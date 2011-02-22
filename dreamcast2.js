/*************************
 * framework
 ************************/
var dreamcast2;

if (window.log === undefined) {
    window.log = function(){
        log.history = log.history || [];   // store logs to an array for reference
        log.history.push(arguments);
        if (this.console){
            console.log( Array.prototype.slice.call(arguments) );
        }
    };
}

(function($) {
    
    var noclick = function(ev) {
        ev.preventDefault();
    };
    
    dreamcast2 = {
        util: {
            distance: function(pos1, pos2) {
                return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
            },            
            pad: function(s, n, c) {
                var padLen = n - s.length;
                if (padLen > 0) {
                    for (var i = 0; i < padLen; i++) {
                        s = c + s;
                    }
                }
                return s;
            },
            safe_remove: function(element) {
                if (element.jquery) element = element.get(0);
                element.parentNode && element.parentNode.removeChild(element);
            }
        }
    };
    
    var Game = function(sel, options, callback) {
    
        $.extend(this, {
            'runOnLoad': true,
            'width': 640,
            'height': 480,
            'frameRate': 30, /* set to zero for fast-as-possible display */
            'uuid': (new Date()).getTime(),
            'masks': [],
            'preload': null,
            'soundMode': typeof(soundManager) != 'undefined' ? 'sm2' : 'html5',
            'audioEnabled': true
        }, options);
        this.intervalRate = this.frameRate ? 1000 / this.frameRate : 0;
    
        this.masks = [];
        this.scenes = [];
        this.elapsed = 0;
        
        this.elem = $(sel);
        
        this.preloadSounds = this['_' + this.soundMode + 'PreloadSounds'];
        this.playSound = function(sound) {
            var func = this.audioEnabled ? this['_' + this.soundMode + 'PlaySound'] : this._noopPlaySound;
            return func.call(this, sound);
        }
    
        var game = this;
        this.elem.css({'width': this.width, 'height': this.height}).svg(function(svg) {
            
            game.svg = svg;
            
            // disable text on flash
            if (svgweb.config && svgweb.config.use == 'flash') {
                game.svg.text = function() { return this; };
            }
            
            game.defs = game.svg.defs();
            
            game.background = svg.group(svg, 'game-background');
            game.svg.rect(game.background, 0, 0, game.width, game.height, {fill: '#000000'});
            
            if (game.preload) {
                for (var i = 0; i < game.preload.length; i++) {
                    new Image(game.preload[i]);
                }
            }
            
            if (game.runOnLoad) {
                game.run();
            }
            callback(game);
        });
    
    };
    Game.prototype.run = function() {
        var then = new Date().getTime();
        var game = this;
        var tick = function() {
        
            var suspendID = game.svg.root().suspendRedraw(5000);
        
            var now = new Date().getTime();
            var delta = now - then;
            game.elapsed += delta;
            then = now;
        
            var scene = game.getCurrentScene();
            if (scene && !scene.isPaused()) {
                scene.tick(delta);
            }
        
            game.svg.root().unsuspendRedraw(suspendID);
        
        };
        this.interval = setInterval(tick, this.intervalRate);
    };
    Game.prototype.getCurrentScene = function() {
        var scene;
        if (this.scenes.length > 0) {
            scene = this.scenes[this.scenes.length - 1];
        }
        return scene;
    };
    Game.prototype.newScene = function(id, options) {
        var scene = new Scene(id, options);
        scene.game = this;
        scene.layer = this.svg.group(this.svg, 'scene-' + id);
        return scene;
    };
    Game.prototype.popScene = function() {
        var scene = this.scenes.pop();
        if (scene) {
            scene.destroy();
            if (scene.layer) {
                dreamcast2.util.safe_remove(scene.layer);
            }
        }
        var previousScene = this.getCurrentScene();
        if (previousScene) {
            if (previousScene.layer) {
                previousScene.layer.hasAttribute('display') && previousScene.layer.removeAttribute('display');
            }
            if (previousScene.init) {
                previousScene.init();
            }
            previousScene.resume();
        }
    };
    Game.prototype.pushScene = function(scene) {
        scene.game = this;
        var previousScene = this.getCurrentScene();
        if (previousScene) {
            previousScene.pause();
            if (previousScene.layer) {
                previousScene.layer.setAttribute('display', 'none');
            }
        }
        if (scene.init) {
            scene.init();
        }
        this.scenes.push(scene);
    };
    Game.prototype.setBackgroundImage = function(x, y, width, height, path) {
        this.svg.image(this.background, x, y, width, height, path);
        dreamcast2.util.safe_remove($(this.background).children().first());
    };
    Game.prototype.setBackgroundColor = function(color) {
        this.svg.rect(this.background, 0, 0, this.width, this.height, {fill: color});
        dreamcast2.util.safe_remove($(this.background).children().first());
    };
    Game.prototype.getElapsedTime = function() {
        return this.elapsed;
    };
    Game.prototype.getUUID = function() {
        return this.uuid++;
    };
    Game.prototype.getMask = function(width, height) {
        var id = width + '_' + height;
        if (!this.masks[id]) {
            this.masks[id] = this.svg._makeNode(this.defs, 'clipPath', {id: id, x: 0, y: 0, width: width, height: height});
            this.svg.rect(this.masks[id], 0, 0, width, height);
        }
        return id;
    };
    
    Game.prototype._html5PreloadSounds = function(sounds) {
        $.each(sounds, function(name, file) {
            var id = 'sound-' + name;
            $('body').append('<audio src="' + file +'.wav" autobuffer="autobuffer" preload="auto" id="' + id + '" />');
        })
    }
    Game.prototype._html5PlaySound = function(sound) {
        var snd = new Audio($('#sound-' + sound).attr('src'));
        snd.play();
        return snd;
    }
    
    Game.prototype._sm2PreloadSounds = function(sounds) {
        soundManager.onready(function() {
            $.each(sounds, function(name, file) {
                soundManager.createSound({
                    id: name,
                    url: file + '.mp3',
                    autoLoad: true,
                    multiShotEvents: true
                });
            });
        })
    }
    
    Game.prototype._sm2PlaySound = function(sound) {
        var out = {'ended': false}
        var snd = soundManager.play(sound, {onfinish: function() {
            out.ended = true;
        }});
        out.pause = function() {
            if (snd && snd.pause) {
                snd.pause();
            }
        };
        return out;
    }
    
    Game.prototype._noopPlaySound = function(sound) {
        return {'ended': true, 'pause': function() {}}
    }
    
    dreamcast2.Game = Game;

    /*** game scene ***/

    var Scene = function(id, options) {
        
        $.extend(this, {
            paused: false,
            layers: {},
            layer: null,
            ondestroy: null
        }, options || {});
        
        this.id = id;
        this.elapsed = 0;
        this.actors = [];
        this.scheduledTasks = [];
        
    };
    Scene.prototype.tick = function(delta) {
        this.elapsed += delta;
        for (var i = 0; i < this.actors.length; i++) {
            this.actors[i].update(delta);
        }
        if (this.update) {
            this.update(delta);
        }
    };
    Scene.prototype.pause = function() {
        this.paused = true;
    };
    Scene.prototype.resume = function() {
        this.paused = false;
    };
    Scene.prototype.isPaused = function() {
        return this.paused;
    };
    Scene.prototype.addActor = function(actor, layer) {
        if (!actor) return;
        actor.scene = this;
        actor.layer = layer && this.layers[layer] ? this.layers[layer] : this.game.svg.root();
        this.actors.push(actor);
        return actor;
    };
    Scene.prototype.addLayer = function(layer) {
        var layerId = "scene-" + this.id + "-" + layer;
        this.layers[layer] = this.game.svg.group(
            this.layer || this.game.svg,
            layerId
        );
        return this.layers[layer];
    };
    Scene.prototype.addScheduledTask = function(fn, delay) {
        this.scheduledTasks.push(setInterval(function() {
            if (!this.paused) fn();
        }, delay));
    };
    Scene.prototype.destroy = function() {
        for (var i = 0; i < this.scheduledTasks.length; i++) {
            clearInterval(this.scheduledTasks[i]);
        }
        if (this.ondestroy) {
            this.ondestroy();
        }
    };
    
    dreamcast2.Scene = Scene;

    /*** sprite ***/

    var Sprite = function(options) {
        $.extend(this, {
            className: null,
            enabled: true,
            pos: {x: 0, y: 0},
            hasDirection: true,
            direction: 90,
            front: 90,
            frameSize: {width: 32, height: 32},
            center: false,
            background: '',
            frameCount: 1,
            animating: false,
            animateWhileMoving: true,
            animateCallback: false,
            frame: 0,
            image: '',
            animInterval: 100,
            onclick: noclick
        }, options);
    
        if (!this.center) this.center = {x: Math.round(this.frameSize.width/2), y: Math.round(this.frameSize.height/2)};
        this.element = null;
        this.moving = false;
        this.moveTime = 0;
        this.animateTime = 0;
        this.mode = svgweb.config && svgweb.config.use == 'flash' ? 'embed' : 'clip';
    };

    Sprite.prototype.update = function(elapsed) {
        if (this.enabled) {
            if (!this.element && this.scene) {
                var game = this.scene.game;
                if (this.mode == 'clip') {
                    this.element = game.svg.image(this.layer, 0, 0, this.frameSize.width * this.frameCount, this.frameSize.height, this.image, {'clip-path': 'url(#' + game.getMask(this.frameSize.width, this.frameSize.height) + ')'});
                    this.imageElement = this.element;
                } else {
                    this.element = game.svg.group(this.layer);
                    this.embeddedSvg = game.svg._makeNode(this.element, 'svg', {x: 0, y: 0, width: this.frameSize.width, height: this.frameSize.height, viewBox: '0 0 ' + this.frameSize.width + ' ' + this.frameSize.height});
                    this.imageElement = game.svg.image(this.embeddedSvg, 0, 0, this.frameSize.width * this.frameCount, this.frameSize.height, this.image);
                }
                var elem = $(this.element);
                if (this.className) {
                    elem.addClass(this.className);
                }
                if (this.onclick) {
                    elem.click(this.onclick);
                }
                this.updateTransform();
            }
            if (this.moving) {
                this.moveTime += elapsed;
                this.updatePosition();
            }
            if (this.animating) {
                this.animateTime += elapsed;
                if (this.animateTime > this.animInterval) {
                    var numFrames = Math.floor(this.animateTime / this.animInterval);
                    this.advanceFrame(numFrames);
                    this.animateTime = this.animateTime % this.animInterval;
                }
            }
        }
    };
    Sprite.prototype.advanceFrame = function(numFrames) {
        if (!numFrames) numFrames = 1;
        var oldFrame = this.frame;
        this.frame = (this.frame + numFrames) % this.frameCount;
        if (this.animateCallback && this.frame < oldFrame) {
            this.animateCallback();
            this.animating = false;
        } else {
            var offset = this.frame * this.frameSize.width * -1;
            $(this.imageElement).attr('x', offset);
        }
    };
    Sprite.prototype.moveTo = function(x, y) {
        this.pos.x = x;
        this.pos.y = y;
    
        this.updateTransform();
    };
    Sprite.prototype.updateTransform = function() {
        var transform = 'translate(' + (this.pos.x - this.center.x) + ', ' + (this.pos.y - this.center.y) + ')';
        if (this.rotate) transform = transform + ' rotate(' + this.rotate + ',' + this.center.x + ',' + this.center.y + ')';
        $(this.element).attr({'transform': transform});
    };
    
    // Sprite.prototype.directions = {true: {true: 0, false: 360}, false: {true: 180, false: 180}};
    Sprite.prototype.directions = {};
    Sprite.prototype.directions[true] = {}
    Sprite.prototype.directions[true][true] = 0;
    Sprite.prototype.directions[true][false] = 360;
    Sprite.prototype.directions[false] = {}
    Sprite.prototype.directions[false][true] = 180;
    Sprite.prototype.directions[false][false] = 180;
    
    Sprite.prototype.moveToward = function(x, y, duration, callback, easing) {
        this.moving = true;
        this.moveStartPos = {x: this.pos.x, y: this.pos.y};
        this.moveTime = 0;
        this.moveDestPos = {x: x, y: y};
        this.moveDuration = duration;
        this.moveCallback = callback;
    
        if (this.animateWhileMoving) this.animating = true;
    
        if (easing) {
            this.easing = $.easing[easing];
        } else {
            this.easing = $.easing.linear;
        }
    
        if (this.hasDirection) {
            var xdiff = this.moveDestPos.x - this.pos.x;
            var ydiff = this.moveDestPos.y - this.pos.y;
            if (xdiff == 0) {
                if (ydiff > 0) {
                    this.rotate = (this.front + 90) % 360;
                } else if (ydiff < 0) {
                    this.rotate = (this.front + 270) % 360;
                }
            } else {
                var theta = Math.atan(ydiff/xdiff) * (180/Math.PI);
                theta += this.directions[xdiff >= 0][ydiff >= 0];
                theta += this.front
                this.rotate = theta % 360;
            }
        }
    };
    Sprite.prototype.updatePosition = function() {
        if (this.moveTime > this.moveDuration) {
            this.finishMoving();
            if (this.moveCallback) this.moveCallback();
        } else {
            var newX = this.easing(this.moveTime / this.moveDuration, this.moveTime, this.moveStartPos.x, this.moveDestPos.x - this.moveStartPos.x, this.moveDuration);
            var newY = this.easing(this.moveTime / this.moveDuration, this.moveTime, this.moveStartPos.y, this.moveDestPos.y - this.moveStartPos.y, this.moveDuration);
            this.moveTo(newX, newY);
        }
    };
    Sprite.prototype.finishMoving = function() {
        this.moveTo(this.moveDestPos.x, this.moveDestPos.y);
        this.moving = false;
    
        if (this.animateWhileMoving) {
            this.frame = 0;
            $(this.element).attr('x', 0);
            this.animating = false;
        }
    };
    Sprite.prototype.remove = function() {
        this.enabled = false;
        var arrayPos = $.inArray(this, this.scene.sprites);
        if (arrayPos != -1) {
            this.scene.sprites.splice(arrayPos, 1);
        }
        dreamcast2.util.safe_remove(this.element);
    };
    
    dreamcast2.Sprite = Sprite;
    
})(jQuery);
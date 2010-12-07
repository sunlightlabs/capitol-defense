/*************************
 * framework
 ************************/

var Game = function(sel, options, callback) {
    
    $.extend(this, {
        'width': 640,
        'height': 480,
        'frameRate': 30, /* set to zero for fast-as-possible display */
        'uuid': (new Date()).getTime(),
        'masks': [],
        'background': '#eeefff'
    }, options);
    this.interval = this.frameRate ? 1000 / this.frameRate : 0;
    
    this.masks = [];
    this.scenes = [];
    this.elapsed = 0;
    
    var game = this;
    $(sel).css({'width': this.width, 'height': this.height}).svg(function(svg) {
        game.svg = svg;
        game.defs = game.svg.defs();
        game.bg = game.svg.rect(0,0,game.width,game.height,{fill: game.background});
        callback(game);
    });
    
};
Game.prototype.run = function() {
    var then = new Date().getTime();
    var game = this;
    var tick = function() {
        
        var suspendID = this.svg.root().suspendRedraw(5000);
        
        var now = new Date().getTime();
        var delta = (now - then) / 1000;
        game.elapsed += delta;
        then = now;
        
        var scene = game.getCurrentScene();
        if (scene && !scene.isPaused()) {
            scene.tick(delta);
        }
        
        this.svg.root().unsuspendRedraw(suspendID);
        
    };
    this.interval = setInterval(tick, 1000 / 60);
};
Game.prototype.getCurrentScene = function() {
    var scene;
    if (this.scenes.length > 0) {
        scene = this.scenes[this.scenes.length - 1];
    }
    return scene;
};
Game.prototype.popScene = function() {
    var scene = this.scenes.pop();
    if (scene && scene.destroy) {
        scene.destroy();
    }
    var previousScene = this.getCurrentScene();
    if (previousScene) {
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
    }
    if (scene.init) {
        scene.init();
    }
    this.scenes.push(scene);
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
Game.prototype.util = {
    distance: function(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }
};

/*** game scene ***/

var Layer = function(name) {
    this.name = name
};

var Scene = function(name, config) {
    this.name = name;
    this.config = config || {};
    this.paused = false;
    this.elapsed = 0;
    this.actors = [];
    this.layers = {};
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
    actor.scene = this;
    actor.layer = layer && this.layers[layer] ? this.layers[layer] : this.game.svg.root();
    this.actors.push(actor);
};
Scene.prototype.addLayer = function(layer) {
    this.layers[layer] = this.game.svg.group(this.game.svg, layer);
};

/*** sprite ***/

var Sprite = function(options) {
    $.extend(this, {
        pos: {x: 0, y: 0},
        hasDirection: true,
        direction: 90,
        front: 90,
        frameSize: {width: 32, height: 32},
        center: false,
        background: '',
        frameCount: 1,
        animateWhileMoving: true,
        frame: 0,
        image: '',
        animInterval: 100
    }, options);
    
    if (!this.center) this.center = {x: Math.round(this.frameSize.width/2), y: Math.round(this.frameSize.height/2)};
    this.element = null;
    this.moving = false;
    this.animating = false;
    this.moveTime = 0;
    this.animateTime = 0;
}

Sprite.prototype.update = function(elapsed) {
    if (!this.element && this.window) {
        this.element = this.window.svg.image(this.parent, 0, 0, this.frameSize.width * this.frameCount, this.frameSize.height, this.image, {'clip-path': 'url(#' + this.window.getMask(this.frameSize.width, this.frameSize.height) + ')'});
        //this.element = this.window.svg.image(0, 0, this.frameSize.width * this.frameCount, this.frameSize.height, this.image, {'clip': 'rect(0,0,32,32)'});
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
Sprite.prototype.advanceFrame = function(numFrames) {
    if (!numFrames) numFrames = 1;
    this.frame = (this.frame + numFrames) % this.frameCount;
    var offset = this.frame * this.frameSize.width * -1;
    $(this.element).attr('x', offset);
}
Sprite.prototype.moveTo = function(x, y) {
    this.pos.x = x;
    this.pos.y = y;
    
    this.updateTransform();
}
Sprite.prototype.updateTransform = function() {
    var transform = 'translate(' + (this.pos.x - this.center.x) + ', ' + (this.pos.y - this.center.y) + ')';
    if (this.rotate) transform = transform + ' rotate(' + this.rotate + ',' + this.center.x + ',' + this.center.y + ')';
    $(this.element).attr({'transform': transform});
}
Sprite.prototype.directions = {true: {true: 0, false: 360}, false: {true: 180, false: 180}};
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
}
Sprite.prototype.updatePosition = function() {
    if (this.moveTime > this.moveDuration) {
        this.finishMoving();
        if (this.moveCallback) this.moveCallback();
    } else {
        var newX = this.easing(this.moveTime / this.moveDuration, this.moveTime, this.moveStartPos.x, this.moveDestPos.x - this.moveStartPos.x, this.moveDuration);
        var newY = this.easing(this.moveTime / this.moveDuration, this.moveTime, this.moveStartPos.y, this.moveDestPos.y - this.moveStartPos.y, this.moveDuration);
        this.moveTo(newX, newY);
    }
}
Sprite.prototype.finishMoving = function() {
    this.moveTo(this.moveDestPos.x, this.moveDestPos.y);
    this.moving = false;
    
    if (this.animateWhileMoving) {
        this.frame = 0;
        $(this.element).attr('x', 0);
        this.animating = false;
    }
}
Sprite.prototype.associateWindow = function(win) {
    this.window = win;
}
Sprite.prototype.remove = function() {
    var arrayPos = $.inArray(this, this.window.sprites);
    if (arrayPos != -1) {
        this.window.sprites.splice(arrayPos, 1);
    }
    $(this.element).remove();
}
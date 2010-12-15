var CapitolDefense;

(function($) {
    
    var Man = function(options) {
        var opts = $.extend({
            'speed': 50,
            'image': 'sprites/MaleLobbyist_Yellow_Sprites.png',
            'frameCount': 8,
            'front': 90
        }, options)
        opts.animInterval = 2000/opts.speed;
        dreamcast2.Sprite.call(this, opts);
    }
    Man.prototype = new dreamcast2.Sprite();
    Man.prototype.walkTo = function(x, y, callback) {
        var distance = dreamcast2.util.distance(this.pos, {x: x, y: y});
        var duration = (distance / this.speed) * 1000;
        this.moveToward(x, y, duration, callback, 'linear');
    }
    dreamcast2.Man = Man;
    
    /* snowball easing */
    $.extend($.easing, {
        'easeOutInQuad' : function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * ((t)*(t-2)) + b;
            return c/2*((--t)*t + 1) + b;
        },
        'halfQuad' : function(x, t, b, c, d) {
            return ($.easing.linear(x, t, b, c, d) + $.easing.easeOutInQuad(x, t, b, c, d)) / 2;
        }
    });
    
    var Snowball = function(options) {
        var opts = $.extend({
            'speed': 125,
            'image': 'sprites/SnowBall_Sprites.png',
            'frameCount': 5,
            'frameSize': {'width': 16, 'height': 16},
            'front': 90
        }, options)
        opts.animInterval = 2000/opts.speed;
        dreamcast2.Sprite.call(this, opts);
    }
    Snowball.prototype = new dreamcast2.Sprite();
    Snowball.prototype.throwTo = function(x, y, callback) {
        var distance = dreamcast2.util.distance(this.pos, {x: x, y: y});
        var duration = (distance / this.speed) * 1000;        
        this.moveToward(x, y, duration, callback, 'halfQuad');
    }
    dreamcast2.Snowball = Snowball;
    
    
    var PowerBarNeedle = function(options) {
        var opts = $.extend({
            'image': 'sprites/ui/PowerGauge_Needle.png',
        }, options)
        this.originalPos = {x: opts.pos.x, y: opts.pos.y};
        dreamcast2.Sprite.call(this, opts);
    };
    PowerBarNeedle.prototype = new dreamcast2.Sprite();
    PowerBarNeedle.prototype.reset = function() {
        this.moveTo(this.originalPos.x, this.originalPos.y);
    };
    
    
    CDUI = function() {
        this.audio = true;
    };
    CDUI.prototype.setPower = function(val, of) {
        var power = (val / of) * 105;
        if (power > 105) power = 105;
        var op = this.powerNeedle.originalPos;
        window.log(val, of, power, op.x);
        this.powerNeedle.moveTo(op.x + power, op.y);
        window.log(val, of, power, op.x);
    };
    CDUI.prototype.setAudio = function(audio) {
        this.audio = audio;
    };
    CDUI.prototype.writeTerminal = function(message) {
        // write message to terminal
    };
    CDUI.prototype.reset = function() {
        this.powerNeedle.reset();
    };
    CDUI.prototype.draw = function(scene, layer) {
        var svg = scene.game.svg;
        svg.image(layer, 0, 0, 800, 600, "sprites/ui/UserInterface_BlankState.png");
        svg.image(layer, 730, 560, 44, 36, "sprites/ui/SoundDial_Off.png");
        this.powerNeedle = new PowerBarNeedle({
            pos: {x: 47, y: 583},
            frameSize: {width: 13, height: 14},
        });
        scene.addActor(this.powerNeedle, "controls");
    };
    
    
    
    
    CapitolDefense = function(game) {
        this.game = game;
        this.currentLevel = 0;
        this.controls = new CDUI();
        this.levels = [
            {
                pac: "American's for a Tastier America",
                amount: 10 * 1000 * 1000,
                lobbyists: 8,
                goal: 4
            },
            {
                pac: "Our Future Are Our Children PAC",
                amount: 23 * 1000 * 1000,
                lobbyists: 15,
                goal: 7
            }
        ];
    };
    
    CapitolDefense.prototype.getCurrentLevel = function() {
        return this.levels[this.currentLevel - 1];
    };
    
    CapitolDefense.prototype.gameOver = function() {
        var game = this.game;
        var scene = game.newScene('gameover');
        scene.init = function() {
            scene.addLayer('text');
            game.svg.rect(game.background, 0, 0, game.width, game.height, {fill: '#008800'});
            game.svg.rect(scene.layers['text'], 30, 30, 50, 50, {fill: '#000000'});
        }
        game.pushScene(scene);
        return scene;
    };
    
    CapitolDefense.prototype.nextLevel = function() {
        
        this.currentLevel++;
        var level = this.levels[this.currentLevel - 1];
        
        if (level === undefined) {
            
            return this.gameOver();
            
        } else {
            
            level.lobbyistsDefeated = 0;
            level.lobbyistsRemaining = level.lobbyists;
            level.isComplete = false;
        
            var cd = this;
            var game = this.game;
        
            var lobbyists = [];
        
            var scene = game.newScene('level-' + this.currentLevel);
            scene.init = function() {
                cd.controls.draw(scene, scene.layers['controls']);
                game.svg.image(game.background, 0, 0, 800, 600, "sprites/Grid_800x600_M1.png");
            };
            scene.update = function() {
                if (!level.isComplete && level.lobbyistsDefeated >= level['goal']) {
                    level.isComplete = true;
                    $(game.svg.root()).unbind('click');
                    svgweb.config.use != 'flash' && game.svg.text(
                        this.layers['overlay'],
                        200,
                        200,
                        "The Capitol has been saved!",
                        {fill: '#000000'}
                    );
                    setTimeout(function() {
                        game.popScene();
                    }, 3000)
                }
            };
            
            
            scene.addLayer('snowballs');
            scene.addLayer('lobbyists');
            scene.addLayer('controls');
            scene.addLayer('overlay');
            
            var overlay = svgweb.config.use != 'flash' && game.svg.text(
                scene.layer['overlay'],
                200,
                200,
                "Level " + this.currentLevel + ": " + level.pac,
                {fill: '#000000'}
            );
            
            setTimeout(function() {
                
                overlay && overlay.setAttribute('display', 'none');
                
                $(game.svg.root()).unbind('click').click(function(evt) {

                    var offset = game.elem.offset();
                    var x = evt.pageX - offset.left;
                    var y = evt.pageY - offset.top;

                    var ball = scene.addActor(new dreamcast2.Snowball(), 'snowballs');
                    ball.moveTo(400, 600);
                    ball.throwTo(x, y, function() {
                        lobbyists = $.map(lobbyists, function(lobbyist, index) {
                            if (dreamcast2.util.distance(ball.pos, lobbyist.pos) < 100) {
                                lobbyist.remove();
                                level.lobbyistsDefeated++;
                                cd.controls.setPower(level.lobbyistsDefeated, level.goal);
                                return null;
                            } else {
                                return lobbyist;
                            }
                        })
                        ball.remove();
                    });

                });

                scene.addScheduledTask(function() {
                    if (level.lobbyistsRemaining > 0) {
                        var man = scene.addActor(new dreamcast2.Man(), 'lobbyists');
                        man.moveTo(Math.round(Math.random() * 800), 0);
                        man.walkTo(Math.random() * 800, 600, function() { man.remove(); });
                        lobbyists[lobbyists.length] = man;
                        level.lobbyistsRemaining--;
                    }
                }, 1000);
                
            }, 3000);
            
            game.pushScene(scene);
            
            return scene;
            
        }
        
    };
    
})(jQuery);


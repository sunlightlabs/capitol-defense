var CapitolDefense;

(function($) {
    
    var manImages = [
        'sprites/FemaleLobbyist_Blue_Sprites.png',
        'sprites/FemaleLobbyist_Green_Sprites.png',
        'sprites/FemaleLobbyist_Red_Sprites.png',
        'sprites/FemaleLobbyist_Yellow_Sprites.png',
        'sprites/MaleLobbyist_Blue_Sprites.png',
        'sprites/MaleLobbyist_Green_Sprites.png',
        'sprites/MaleLobbyist_Red_Sprites.png',
        'sprites/MaleLobbyist_Yellow_Sprites.png'
    ];
    
    var Man = function(options) {
        var opts = $.extend({
            'speed': 50,
            'image': manImages[Math.floor(Math.random() * manImages.length)],
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
            'speed': 150,
            'image': 'sprites/SnowBall_Flying_Sprites.png',
            'frameCount': 4,
            'frameSize': {'width': 32, 'height': 32},
            'front': 90,
            'animating': true,
            'animateWhileMoving': false
        }, options)
        opts.animInterval = 2000/opts.speed;
        dreamcast2.Sprite.call(this, opts);
    }
    Snowball.prototype = new dreamcast2.Sprite();
    Snowball.prototype.throwTo = function(x, y, callback) {
        var distance = dreamcast2.util.distance(this.pos, {x: x, y: y});
        var duration = (distance / this.speed) * 1000;
        var snowball = this;
        this.moveToward(x, y, duration, function() { snowball.explode(); callback.call(this); }, 'linear');
    }
    Snowball.prototype.explode = function() {
        this.imageElement.setAttributeNS($.svg.xlinkNS, 'href', 'sprites/SnowBall_Crashing_Sprites.png');
        $(this.imageElement).attr({'x': 0, 'width': 32 * 5});
        this.frame = 0;
        this.frameCount = 5;
        
        this.rotate = 0;
        this.updateTransform();
        
        this.animateCallback = function() {
            this.remove();
        }
        this.animInterval = 200;
    }
    dreamcast2.Snowball = Snowball;
    
    
    var PowerBarNeedle = function(options) {
        var opts = $.extend({
            'image': 'sprites/ui/PowerGauge_Needle.png'
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
        this.powerNeedle.moveTo(op.x + power, op.y);
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
        this.powerNeedle = new PowerBarNeedle({
            pos: {x: 47, y: 583},
            frameSize: {width: 13, height: 14}
        });
        scene.addActor(this.powerNeedle, "controls");
        scene.addActor(new AudioControl, "controls");
    };
    
    
    
    var AudioControl = function(options) {
        var me = this;
        var opts = $.extend({
            image: 'sprites/ui/SoundDial_On.png',
            frameSize: {width: 44, height: 36},
            pos: {x: 752, y: 579},
            onclick: function(ev) {
                var elem = $(this);
                if (me.scene.game.audioEnabled) {
                    elem.attr('href', 'sprites/ui/SoundDial_Off.png');
                    me.scene.game.audioEnabled = false;
                } else {
                    elem.attr('href', 'sprites/ui/SoundDial_On.png');
                    me.scene.game.audioEnabled = true;
                }
                ev.preventDefault();
            }
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    AudioControl.prototype = new dreamcast2.Sprite();
    
    var StartButton = function(options) {
        var opts = $.extend({
            image: 'sprites/ui/Blinker_On.png',
            frameSize: {width: 26, height: 26},
            pos: {x: 300, y: 300}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    StartButton.prototype = new dreamcast2.Sprite();
    
    
    
    
    
    
    CapitolDefense = function(game) {
        this.game = game;
        this.score = 0;
        this.currentLevel = 0;
        this.controls = new CDUI();
        this.levels = [
            {
                name: "Lawyers and Lobbyists",
                amount: 22883321,
                lobbyists: 3,
                lobbyistInterval: 1500,
                lobbyistSpeed: 30
            },
            {
                name: "Labor",
                amount: 33449709,
                lobbyists: 15,
                lobbyistInterval: 1500,
                lobbyistSpeed: 30
            },
            {
                name: "Construction",
                amount: 42660871,
                lobbyists: 25,
                lobbyistInterval: 1500,
                lobbyistSpeed: 30
            },
            {
                name: "Agribusiness",
                amount: 85884965,
                lobbyists: 25,
                lobbyistInterval: 1000,
                lobbyistSpeed: 50
            },
            {
                name: "Transportation",
                amount: 169951169,
                lobbyists: 25,
                lobbyistInterval: 1000,
                lobbyistSpeed: 50
            },
            {
                name: "Communications and Electronics",
                amount: 256198500,
                lobbyists: 25,
                lobbyistInterval: 1000,
                lobbyistSpeed: 50
            },
            {
                name: "Energy and Natural Resources",
                amount: 323494656,
                lobbyists: 25,
                lobbyistInterval: 800,
                lobbyistSpeed: 70
            },
            {
                name: "Finance, Insurance, and Real Estate",
                amount: 347321552,
                lobbyists: 25,
                lobbyistInterval: 800,
                lobbyistSpeed: 70
            },
            {
                name: "Healthcare",
                amount: 377775794,
                lobbyists: 25,
                lobbyistInterval: 800,
                lobbyistSpeed: 70
            },
            {
                name: "ALL LOBBYISTS!!!",
                amount: 2610000000,
                lobbyists: 25,
                lobbyistInterval: 300,
                lobbyistSpeed: 100
            }
        ];
    };
    
    CapitolDefense.prototype.getCurrentLevel = function() {
        return this.levels[this.currentLevel - 1];
    };
    
    CapitolDefense.prototype.nextLevel = function() {
        
        var scene = null;
        
        this.currentLevel++;
        var currentLevel = this.currentLevel;
        
        if (currentLevel <= this.levels.length) {

            var cd = this;
            var game = this.game;
            var lobbyists = [];
            var snowBallCount = 0;
            
            var level = this.levels[currentLevel - 1];
            
            level.lobbyistsDeployed = 0;
            level.lobbyistsRemaining = level.lobbyists;
            level.isComplete = false;
            
            level.successfulLobbyists = 0;
            
            var pointsPerLobbyist = Math.floor((level.amount / 5000) / level.lobbyists);
        
            scene = game.newScene('level-' + currentLevel);
            scene.init = function() {
                cd.controls.draw(scene, scene.layers['controls']);
                game.setBackgroundImage(0, 0, 800, 600, "sprites/Grid_800x600_M1.png");
            };
            
            scene.addLayer('snowballs');
            scene.addLayer('lobbyists');
            scene.addLayer('controls');
            scene.addLayer('overlay');
            
            var overlay = svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                200,
                200,
                "Level " + currentLevel + ": " + level.name,
                {fill: '#000000'}
            );
            
            var sbCounter = game.svg.text(
                scene.layers['overlay'],
                23,
                38,
                "" + cd.maxSnowBalls,
                {fill: '#B5D05D', align: 'center'}
            );
            $(sbCounter).css('font-family', 'Geo');
            
            var scoreBoard = game.svg.text(
                scene.layers['overlay'],
                570,
                584,
                "SCORE: " + dreamcast2.util.pad("" + cd.score, 7, '0'),
                {fill: '#B5D05D'}
            );
            $(scoreBoard).css('font-family', 'Geo');
            
            setTimeout(function() {
                
                overlay && overlay.setAttribute('display', 'none');
                
                $(game.svg.root()).unbind('click').click(function(evt) {
                    
                    if (snowBallCount < cd.maxSnowBalls) {

                        var offset = game.elem.offset();
                        var x = evt.pageX - offset.left;
                        var y = evt.pageY - offset.top;

                        snowBallCount++;
                        $(sbCounter).text(cd.maxSnowBalls - snowBallCount);

                        var ball = scene.addActor(new dreamcast2.Snowball(), 'snowballs');
                        ball.moveTo(400, 600);
                        ball.throwTo(x, y, function() {
                            lobbyists = $.map(lobbyists, function(lobbyist, index) {
                                
                                if (dreamcast2.util.distance(ball.pos, lobbyist.pos) < 100) {
                                    
                                    cd.score += pointsPerLobbyist;
                                    var asdf = $(scoreBoard);
                                    $(scoreBoard).text(
                                        "SCORE: " + dreamcast2.util.pad("" + cd.score, 7, '0')
                                    );
                                    
                                    lobbyist.remove();
                                    level.lobbyistsRemaining--;
                                    
                                    return null;
                                    
                                } else {
                                    return lobbyist;
                                }
                                
                            })
                            snowBallCount--;
                            $(sbCounter).text(cd.maxSnowBalls - snowBallCount);
                            //ball.remove();
                        });
                    
                    }
                    
                    evt.preventDefault();

                });
                
                var genLobbyistDest = function() {
                    var x = Math.floor(Math.random() * 649) + 74;
                    var y = (x > 226 && x < 577) ? 393 : 435;
                    return {'x': x, 'y': y}
                };
                
                scene.addScheduledTask(function() {
                    if (!level.isComplete) {
                        if (level.successfulLobbyists >= 3) {
                            level.isComplete = true;
                            $(game.svg.root()).unbind('click');
                            svgweb.config.use != 'flash' && game.svg.text(
                                scene.layers['overlay'],
                                200,
                                200,
                                "The Capitol has succumbed to " + level.name + "!",
                                {fill: '#000000'}
                            );
                            setTimeout(function() {
                                game.gameOver = true;
                                game.popScene();
                            }, 3000);
                        }
                        if (level.lobbyistsRemaining == 0) {
                             level.isComplete = true;
                            $(game.svg.root()).unbind('click');
                            svgweb.config.use != 'flash' && game.svg.text(
                                scene.layers['overlay'],
                                200,
                                200,
                                "The Capitol has been defended!",
                                {fill: '#000000'}
                            );
                            setTimeout(function() {
                                game.popScene();
                            }, 3000);
                        }
                    }
                }, 500);

                scene.addScheduledTask(function() {
                    if (level.lobbyistsDeployed < level.lobbyists) {
                        var dest = genLobbyistDest();
                        var man = scene.addActor(new dreamcast2.Man({
                            'speed': level.lobbyistSpeed,
                            'image': (currentLevel == 10) ? 'sprites/FemaleLobbyist_Triforce_Sprites.png' : manImages[Math.floor(Math.random() * manImages.length)]
                        }), 'lobbyists');
                        man.moveTo(Math.round(Math.random() * 800), 0);
                        man.walkTo(dest.x, dest.y, function() {
                            level.successfulLobbyists++;
                            man.remove();
                        });
                        lobbyists.push(man);
                        level.lobbyistsDeployed++;
                    }
                }, level.lobbyistInterval);
                
            }, 3000);
            
        }    
            
        return scene;
        
    };
    
    CapitolDefense.prototype.letsdothis = function() {
        
        var cd = this;
        var game = this.game;
        
        var startScene = game.newScene('start');
        startScene.addLayer('start-controls');
        startScene.init = function() {
            game.setBackgroundColor('#008800');
        };
        game.pushScene(startScene);
        
        var gameLoop = function() {
            var scene;
            game.popScene();
            if (game.gameOver) {
                scene = game.newScene('youlose');
                scene.init = function() {
                    scene.addLayer('text');
                    game.setBackgroundColor('#FF0000');
                };
            } else {
                scene = cd.nextLevel();
                if (scene) {
                    scene.ondestroy = function() {
                        gameLoop();
                    };
                } else {
                    scene = game.newScene('youwin');
                    scene.init = function() {
                        scene.addLayer('text');
                        game.setBackgroundColor('#008800');
                        game.svg.rect(scene.layers['text'], 30, 30, 50, 50, {fill: '#000000'});
                    };
                }
            }
            game.pushScene(scene);
        };
        
        startScene.addActor(new StartButton({
            onclick: function(ev) {
                gameLoop();
                ev.preventDefault();
            }
        }), 'start-controls');
        
    };
    
})(jQuery);


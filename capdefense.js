var CapitolDefense;

(function($) {
    
    var manImages = {
        'women': [
            'sprites/FemaleLobbyist_Blue_Sprites.png',
            'sprites/FemaleLobbyist_Green_Sprites.png',
            'sprites/FemaleLobbyist_Red_Sprites.png',
            'sprites/FemaleLobbyist_Yellow_Sprites.png'
        ],
        'men': [
            'sprites/MaleLobbyist_Blue_Sprites.png',
            'sprites/MaleLobbyist_Green_Sprites.png',
            'sprites/MaleLobbyist_Red_Sprites.png',
            'sprites/MaleLobbyist_Yellow_Sprites.png'
        ]
    };
    var manSounds = {
        'women': [
            'woman_death1',
            'woman_death2',
            'woman_death3'
        ],
        'men': [
            'man_death1',
            'man_death2',
            'man_death3'
        ]
    }
    
    var Man = function(options) {
        this.gender = ['women', 'men'][Math.floor(Math.random() * 2)];
        images = manImages[this.gender];
        sounds = manSounds[this.gender];
        var opts = $.extend({
            'speed': 50,
            'image': images[Math.floor(Math.random() * images.length)],
            'deathSound': sounds[Math.floor(Math.random() * sounds.length)],
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
    Man.prototype.die = function() {
        var deadImage = this.image.replace('Triforce', 'Blue').replace('Lobbyist', 'Snowed');
        this.imageElement.setAttributeNS($.svg.xlinkNS, 'href', deadImage);
        $(this.imageElement).attr({'x': 0, 'width': 32});
        this.frame = 0;
        this.frameCount = 1;
        
        this.rotate = 0;
        this.updateTransform();
        
        this.enabled = false;
        
        var man = this;
        setTimeout(function() {
            man.remove();
        }, 2000);
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
            'image': 'sprites/Snowball_Flying_Sprites.png',
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
        this.whoosh = this.scene.game.playSound('whoosh')
    }
    Snowball.prototype.explode = function() {
        this.imageElement.setAttributeNS($.svg.xlinkNS, 'href', 'sprites/Snowball_Crashing_Sprites.png');
        $(this.imageElement).attr({'x': 0, 'width': 32 * 5});
        this.frame = 0;
        this.frameCount = 5;
        
        this.rotate = 0;
        this.updateTransform();
        
        this.animateCallback = function() {
            this.remove();
        }
        this.animInterval = 200;
        
        if (!this.whoosh.ended) this.whoosh.pause();
        this.scene.game.playSound('crunch');
    }
    dreamcast2.Snowball = Snowball;
    
    
    var PowerBarNeedle = function(options) {
        var opts = $.extend({
            'image': 'sprites/PowerGauge_Arrow.png'
        }, options)
        this.originalPos = {x: opts.pos.x, y: opts.pos.y};
        dreamcast2.Sprite.call(this, opts);
    };
    PowerBarNeedle.prototype = new dreamcast2.Sprite();
    PowerBarNeedle.prototype.reset = function() {
        this.moveTo(this.originalPos.x, this.originalPos.y);
    };
    PowerBarNeedle.prototype.setPower = function(val, of) {
        var power = (val / of) * 105;
        if (power > 105) power = 105;
        var op = this.originalPos;
        this.moveTo(op.x + power, op.y);
    };
    
    var AudioControl = function(options) {
        var me = this;
        var opts = $.extend({
            className: 'clickable',
            image: 'sprites/SoundDial_On.png',
            frameSize: {width: 50, height: 35},
            pos: {x: 738, y: 584},
            onclick: function(ev) {
                var elem = $(this);
                if (me.scene.game.audioEnabled) {
                    elem.attr('href', 'sprites/SoundDial_Off.png');
                    me.scene.game.audioEnabled = false;
                } else {
                    elem.attr('href', 'sprites/SoundDial_On.png');
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
            className: 'clickable',
            image: 'sprites/GameStart_ClickButton.png',
            frameSize: {width: 305, height: 62},
            pos: {x: 395, y: 476}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    StartButton.prototype = new dreamcast2.Sprite();
    
    var PlayGameButton = function(options) {
        var opts = $.extend({
            className: 'clickable',
            image: 'sprites/playgame_button.png',
            frameSize: {width: 260, height: 70},
            pos: {x: 213, y: 457}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    PlayGameButton.prototype = new dreamcast2.Sprite();
    
    var Blinker = function(options) {
        var opts = $.extend({
            image: 'sprites/Blinker_Lit.png',
            frameSize: {width: 30, height: 30}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    Blinker.prototype = new dreamcast2.Sprite();
    
    var SnowpocalypseButton = function(options) {
        var opts = $.extend({
            image: 'sprites/SnowpocalypseLaunch-Anim_M1.gif',
            pos: {x: 600, y: 520},
            frameSize: {width: 350, height: 55}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    SnowpocalypseButton.prototype = new dreamcast2.Sprite();
    SnowpocalypseButton.prototype.hide = function() {
        if (this.element) {
            $(this.element).css('display', 'none');
        }
    };
    
    var SnowFall = function(options) {
        var opts = $.extend({
            center: {x: 400, y: 300},
            pos: {x: 400, y: 300},
            frameSize: {width: 800, height: 600}
        }, options || {});
        dreamcast2.Sprite.call(this, opts);
    };
    SnowFall.prototype = new dreamcast2.Sprite();
    
    CapitolDefense = function(game) {
        this.game = game;
        this.score = 0;
        this.currentLevel = 0;
        this.snowpocalypse = false;
        this.power = 0;
        this.powerThreshold = 30;
        this.levels = [
            {
                name: "Lawyers and Lobbyists",
                amount: 22883321,
                amountString: "$22,883,321",
                lobbyists: 3,
                lobbyistInterval: 1500,
                lobbyistSpeed: 30
            },
            {
                name: "Labor",
                amount: 33449709,
                amountString: "$33,449,709",
                lobbyists: 6,
                lobbyistInterval: 1500,
                lobbyistSpeed: 30
            },
            {
                name: "Construction",
                amount: 42660871,
                amountString: "$42,660,871",
                lobbyists: 10,
                lobbyistInterval: 1500,
                lobbyistSpeed: 35
            },
            {
                name: "Agribusiness",
                amount: 85884965,
                amountString: "$85,884,965",
                lobbyists: 15,
                lobbyistInterval: 1000,
                lobbyistSpeed: 40
            },
            {
                name: "Transportation",
                amount: 169951169,
                amountString: "$169,951,169",
                lobbyists: 20,
                lobbyistInterval: 1000,
                lobbyistSpeed: 45
            },
            {
                name: "Communications and Electronics",
                amount: 256198500,
                amountString: "$256,198,500",
                lobbyists: 25,
                lobbyistInterval: 1000,
                lobbyistSpeed: 50
            },
            {
                name: "Energy and Natural Resources",
                amount: 323494656,
                amountString: "$323,494,656",
                lobbyists: 25,
                lobbyistInterval: 800,
                lobbyistSpeed: 55
            },
            {
                name: "Finance, Insurance, and Real Estate",
                amount: 347321552,
                amountString: "$347,321,552",
                lobbyists: 30,
                lobbyistInterval: 800,
                lobbyistSpeed: 60
            },
            {
                name: "Healthcare",
                amount: 377775794,
                amountString: "$377,775,794",
                lobbyists: 35,
                lobbyistInterval: 800,
                lobbyistSpeed: 70
            },
            {
                name: "ALL LOBBYISTS!!!",
                amount: 2610000000,
                amountString: "$2,610,000,000",
                lobbyists: 100,
                lobbyistInterval: 100,
                lobbyistSpeed: 100
            }
        ];
        
        // preload sounds
        game.preloadSounds({
            'whoosh': 'sounds/whoosh',
            'crunch': 'sounds/crunch',
            'man_death1': 'sounds/man_death1',
            'man_death2': 'sounds/man_death2',
            'man_death3': 'sounds/man_death3',
            'woman_death1': 'sounds/woman_death1',
            'woman_death2': 'sounds/woman_death2',
            'woman_death3': 'sounds/woman_death3',
            'kaching': 'sounds/kaching',
            'blizzard': 'sounds/blizzard'
        })
    };
    
    CapitolDefense.prototype.getCurrentLevel = function() {
        return this.levels[this.currentLevel - 1];
    };
    
    CapitolDefense.prototype.makeItSnow = function() {
        
        var level = this.levels[this.currentLevel - 1];
        
        this.snowpocalypse = false;
        this.snowpocalypseButton.hide();
        this.snowpocalypseButton.remove();
        this.snowpocalypseButton = null;
        this.power = 0;
        
        var cd = this;
        var snowpocalypseScene = this.game.newScene('snowpocalypse');
        snowpocalypseScene.addLayer('sprites');
        snowpocalypseScene.init = function() {
            
            cd.game.setBackgroundColor("#FFFFFF");
            
            this.snowSmall = this.addActor(new SnowFall({
                image: "sprites/TinySnow1_Fall_ThenDisapear.png"
            }), "sprites");
            
            this.snowLarge = this.addActor(new SnowFall({
                image: "sprites/Snow1_Fall_ThenRotate.png"
            }), "sprites");
            
            cd.game.svg.image(this.layers['sprites'], 0, 0, 800, 600, "sprites/Snowpocalypse_TitleAnim.gif");
            
        };
        snowpocalypseScene.update = function() {
            if (this.snowSmall && this.snowSmall.element) {
                this.snowSmall.rotate = (Math.random() * 360);
                this.snowSmall.updateTransform();
            }
            if (this.snowLarge && this.snowLarge.element) {
                this.snowLarge.rotate = (Math.random() * 360);
                this.snowLarge.updateTransform();
            }
        };
        this.game.pushScene(snowpocalypseScene);
        this.game.playSound('blizzard');
        
        setTimeout(function() {
            for (var i = 0; i < cd.lobbyists.length; i++) {
                cd.lobbyists[i].enabled = false;
            }
            level.lobbyistsRemaining = 0;
            level.lobbyistsDeployed = level.lobbyists;
            cd.game.popScene();
        }, 3000);
        
    };
    
    CapitolDefense.prototype.nextLevel = function() {
        
        var scene = null;
        
        this.lobbyists = [];
        this.currentLevel++;
        var currentLevel = this.currentLevel;
        
        if (currentLevel <= this.levels.length) {

            var cd = this;
            var game = this.game;
            var snowBallCount = 0;
            
            var level = this.levels[currentLevel - 1];
            
            level.lobbyistsDeployed = 0;
            level.lobbyistsRemaining = level.lobbyists;
            level.isComplete = false;
            
            level.successfulLobbyists = 0;
            
            var pointsPerLobbyist = Math.floor((level.amount / 5000) / level.lobbyists);
            
            var sbCounter;
            var scoreBoard;
        
            scene = game.newScene('level-' + currentLevel);
            scene.init = function() {
                game.setBackgroundImage(0, 0, 800, 600, "sprites/Grid_800x600_M1.png");
            };
            
            scene.update = function(delta) {
                if (cd.snowpocalypseButton && cd.snowpocalypseButton.element) {
                    cd.snowpocalypseButton.rotate = (Math.random() * 2) - 1;
                    cd.snowpocalypseButton.updateTransform();
                }
            };
            
            scene.addLayer('snowballs');
            scene.addLayer('lobbyists');
            scene.addLayer('overlay');
            scene.addLayer('controls');
            
            game.svg.image(scene.layers['controls'], 0, 0, 800, 620, "sprites/HUD_blank_M1.png");
            
            blinkers = [
                new Blinker({ pos: {x: 209, y: 583} }),
                new Blinker({ pos: {x: 258, y: 583} }),
                new Blinker({ pos: {x: 305, y: 583} })
            ];
            scene.addActor(blinkers[0], 'controls');
            scene.addActor(blinkers[1], 'controls');
            scene.addActor(blinkers[2], 'controls');
            
            cd.powerNeedle = new PowerBarNeedle({
                pos: {x: 49, y: 586},
                frameSize: {width: 145, height: 30}
            });
            scene.addActor(cd.powerNeedle, "controls");
            cd.powerNeedle.setPower(cd.power, cd.powerThreshold);
            $(cd.powerNeedle.element).css('border', '2px solid #000000')
            
            scene.addActor(new AudioControl({
                'image': game.audioEnabled ? 'sprites/SoundDial_On.png' : 'sprites/SoundDial_Off.png'
            }), "controls");
            
            sbCounter = game.svg.text(
                scene.layers['controls'],
                26, 44,
                "" + cd.maxSnowBalls,
                {fill: '#38B3E7', align: 'center'}
            );
            $(sbCounter).css('font-family', '"Droid Sans"');
            $(sbCounter).css('font-weight', 'bold');
            $(sbCounter).css('font-size', '16px');

            scoreBoard = game.svg.text(
                scene.layers['controls'],
                605, 588,
                dreamcast2.util.pad("" + cd.score, 7, '0'),
                {fill: '#38B3E7'}
            );
            $(scoreBoard).css('font-family', '"Droid Sans"');
            $(scoreBoard).css('font-size', '14px');

            var levelIndicator = game.svg.text(
                scene.layers['controls'],
                510, 588,
                currentLevel + "/10",
                {fill: '#38B3E7'}
            );
            $(levelIndicator).css('font-family', '"Droid Sans"');
            $(levelIndicator).css('font-size', '14px');
            
            game.svg.image(
                scene.layers['overlay'],
                238, 130,
                325, 128,
                "sprites/LevelTag_M1.png"
            );
            
            svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                400, 158,
                "LEVEL " + currentLevel,
                {
                    'fill': '#FFFFFF',
                    'style': 'font-family: "Droid Sans"; font-size: 14px;',
                    'text-anchor': 'middle'
                }
            );
            svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                400, 175,
                level.name,
                {
                    'fill': '#FFFFFF',
                    'style': 'font-family: "Droid Sans"; font-size: 14px;',
                    'text-anchor': 'middle'
                }
            );
            svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                400, 205,
                level.amountString,
                {
                    'fill': '#FFFFFF',
                    'style': 'font-family: "Droid Sans"; font-size: 24px;',
                    'text-anchor': 'middle'
                }
            );
            svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                400, 227,
                'spent on lobbying this election cycle',
                {
                    'fill': '#FFFFFF',
                    'style': 'font-family: "Droid Sans"; font-size: 10px;',
                    'text-anchor': 'middle'
                }
            );
            svgweb.config.use != 'flash' && game.svg.text(
                scene.layers['overlay'],
                400, 243,
                '(data from the Center for Responsive Politics)',
                {
                    'fill': '#FFFFFF',
                    'style': 'font-family: "Droid Sans"; font-size: 10px;',
                    'text-anchor': 'middle'
                }
            );
            
            setTimeout(function() {
                
                scene.layers['overlay'] && scene.layers['overlay'].setAttribute('display', 'none');
                
                if (cd.snowpocalypse) {
                    cd.snowpocalypseButton = new SnowpocalypseButton({
                        className: 'clickable',
                        onclick: function(ev) {
                            cd.makeItSnow();
                            ev.preventDefault();
                        }
                    });
                    scene.addActor(cd.snowpocalypseButton, 'controls');
                }
                var root = $(game.svg.root());
                root.unbind('click');
                if (svgweb.config.use == 'flash' && game.svg._svg._listeners && game.svg._svg._listeners.click) {
                    console.log(5);
                    game.svg._svg._listeners.click = game.svg._svg._listeners.click.slice(0, 0);
                    console.log(6);
                }
                root.click(function(evt) {

                    var offset = game.elem.offset();
                    var x = evt.pageX - offset.left;
                    var y = evt.pageY - offset.top;
                    
                    if (y < 435 && snowBallCount < cd.maxSnowBalls) {

                        snowBallCount++;
                        svgweb.config.use != 'flash' && $(sbCounter).text(cd.maxSnowBalls - snowBallCount);

                        var ball = scene.addActor(new dreamcast2.Snowball(), 'snowballs');
                        ball.moveTo(400, 600);
                        ball.throwTo(x, y, function() {
                            cd.lobbyists = $.map(cd.lobbyists, function(lobbyist, index) {
                                
                                if (dreamcast2.util.distance(ball.pos, lobbyist.pos) < 50) {
                                    
                                    cd.score += pointsPerLobbyist;
                                    var asdf = $(scoreBoard);
                                    svgweb.config.use != 'flash' && $(scoreBoard).text(
                                        dreamcast2.util.pad("" + cd.score, 7, '0')
                                    );
                                    
                                    lobbyist.die();
                                    level.lobbyistsRemaining--;
                                    
                                    cd.power = Math.min(cd.power + 1, cd.powerThreshold);
                                    cd.powerNeedle.setPower(cd.power, cd.powerThreshold);
                                    if (cd.power >= cd.powerThreshold && !cd.snowpocalypse) {
                                        cd.snowpocalypseButton = new SnowpocalypseButton({
                                            className: 'clickable',
                                            onclick: function(ev) {
                                                cd.makeItSnow();
                                                ev.preventDefault();
                                            }
                                        });
                                        scene.addActor(cd.snowpocalypseButton, 'controls');
                                    }
                                    
                                    setTimeout(function() { game.playSound(lobbyist.deathSound) }, Math.floor(Math.random() * 500));
                                    
                                    return null;
                                    
                                } else {
                                    return lobbyist;
                                }
                                
                            })
                            snowBallCount--;
                            svgweb.config.use != 'flash' && $(sbCounter).text(cd.maxSnowBalls - snowBallCount);
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
                        var overlay = scene.layers['controls'];
                        if (level.successfulLobbyists >= 3) {
                            if (cd.snowpocalypseButton) {
                                cd.snowpocalypseButton.remove();
                            }
                            level.isComplete = true;
                            $(game.svg.root()).unbind('click');
                            game.svg.image(
                                overlay,
                                52,
                                120,
                                697,
                                220,
                                "sprites/LevelCompleteFail_M1.png"
                            );
                            setTimeout(function() {
                                game.gameOver = true;
                                game.popScene();
                            }, 3000);
                        } else if (level.lobbyistsRemaining <= 0) {
                            if (cd.snowpocalypseButton) {
                                cd.snowpocalypseButton.remove();
                            }
                            level.isComplete = true;
                            $(game.svg.root()).unbind('click');
                            game.svg.image(
                                overlay,
                                52,
                                120,
                                697,
                                220,
                                "sprites/LevelCompleteWin_M1.png"
                            );
                            setTimeout(function() {
                                game.popScene();
                            }, 3000);
                        }
                    }
                }, 250);

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
                            level.lobbyistsRemaining--;
                            blinkers[3 - level.successfulLobbyists].remove();
                            man.remove();
                            game.playSound('kaching');
                        });
                        cd.lobbyists.push(man);
                        level.lobbyistsDeployed++;
                    }
                }, level.lobbyistInterval);
                
            }, 5000);
            
        }    
            
        return scene;
        
    };
    
    CapitolDefense.prototype.letsdothis = function() {
        
        var cd = this;
        var game = this.game;
        
        var startScene = game.newScene('start');
        startScene.addLayer('start-controls');
        startScene.init = function() {
            game.setBackgroundImage(0, 0, 800, 620, "sprites/GameStart_M1.png");
            var logoImg = game.svg.image(this.layers['start-controls'], 171, 502, 458, 83, "sprites/GameStart_logo_M2.png")
            $(logoImg).addClass('clickable').click(function() {
                window.open('http://sunlightfoundation.com');
            });
        };
        
        var playGameButton = new PlayGameButton({
            onclick: function(ev) {
                gameLoop();
            }
        });
        
        var instructionsScene = game.newScene('instructions');
        instructionsScene.addLayer('gamestart-controls');
        instructionsScene.init = function() {
            game.setBackgroundImage(0, 0, 800, 620, "sprites/GameStart_Screen_M1.png");
        };
        instructionsScene.addActor(playGameButton, 'gamestart-controls');
        
        var gameLoop = function() {
            var scene;
            game.popScene();
            if (game.gameOver) {
                scene = game.newScene('youlose');
                scene.init = function() {
                    var layer = scene.addLayer('sprites');
                    game.setBackgroundImage(0, 0, 800, 620, "sprites/GameOver_Screen_M1.png");
                    var paImage = game.svg.image(layer, 473, 274, 255, 65, "sprites/playagain_button.png");
                    $(paImage).addClass('clickable').click(function(ev) {
                        window.location.reload();
                        ev.preventDefault();
                    });
                    var dImage = game.svg.image(layer, 528, 436, 143, 48, "sprites/donate_button.png");
                    $(dImage).addClass('clickable').click(function(ev) {
                        window.open('http://sunlightfoundation.com/donate/');
                        ev.preventDefault();
                    });
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
                        var layer = scene.addLayer('sprites');
                        game.setBackgroundImage(0, 0, 800, 620, "sprites/GameWon_Screen_M1.png");
                        var paImage = game.svg.image(layer, 295, 387, 205, 39, "sprites/GameOver_PlayButton_M1.png");
                        $(paImage).addClass('clickable').click(function(ev) {
                            window.location.reload();
                            ev.preventDefault();
                        });
                        var dImage = game.svg.image(layer, 326, 448, 143, 39, "sprites/GameOver_DonateButton_M1.png");
                        $(dImage).addClass('clickable').click(function(ev) {
                            window.open('http://sunlightfoundation.com/donate/');
                            ev.preventDefault();
                        });
                    };
                }
            }
            game.pushScene(scene);
        };
        
        var startButton = new StartButton({
            onclick: function(ev) {
                game.pushScene(instructionsScene);
            }
        });
        
        startScene.addActor(startButton, 'start-controls');
        startScene.update = function(delta) {
            startButton.rotate = (Math.random() * 2) - 1;
            startButton.updateTransform();
        };

        game.pushScene(startScene);
        
    };
    
})(jQuery);


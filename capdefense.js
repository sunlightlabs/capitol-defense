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
        psboxii.Sprite.call(this, opts);
    }
    Man.prototype = new psboxii.Sprite();
    Man.prototype.walkTo = function(x, y, callback) {
        var distance = psboxii.util.distance(this.pos, {x: x, y: y});
        var duration = (distance / this.speed) * 1000;
        this.moveToward(x, y, duration, callback, 'linear');
    }
    psboxii.Man = Man;
    
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
        psboxii.Sprite.call(this, opts);
    }
    Snowball.prototype = new psboxii.Sprite();
    Snowball.prototype.throwTo = function(x, y, callback) {
        var distance = psboxii.util.distance(this.pos, {x: x, y: y});
        var duration = (distance / this.speed) * 1000;        
        this.moveToward(x, y, duration, callback, 'halfQuad');
    }
    psboxii.Snowball = Snowball;
    
    
    
    
    
    
    
    
    
    CapitolDefense = function(game) {
        this.game = game;
        this.currentLevel = 0;
        this.levels = [
            {
                pac: "American's for a Tastier America",
                amount: 10 * 1000 * 1000,
                lobbyists: 8,
                goal: 4
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
        
            var cd = this;
            var game = this.game;
        
            var lobbyists = [];
        
            var scene = game.newScene('level-' + this.currentLevel);
            scene.init = function() {
                game.svg.rect(game.background, 0, 0, game.width, game.height, {fill: '#000066'});
            };
            scene.update = function() {
                if (level.lobbyistsDefeated >= level['goal']) {
                    game.getCurrentScene().pause();
                    setTimeout(function() {
                        game.popScene();
                    }, 1500)
                }
            };
            
            scene.addLayer('snowballs');
            scene.addLayer('lobbyists');
            scene.addLayer('controls');
            
            scene.addLayer('overlay');
            var overlay = game.svg.text(
                scene.layer['overlay'],
                200,
                200,
                "Level " + this.currentLevel + ": GET READY!",
                {fill: '#000000'}
            );
            
            setTimeout(function() {
                
                game.svg.remove(overlay);
                
                $(game.svg.root()).unbind('click').click(function(evt) {

                    var offset = game.elem.offset();
                    var x = evt.pageX - offset.left;
                    var y = evt.pageY - offset.top;

                    var ball = scene.addActor(new psboxii.Snowball(), 'snowballs');
                    ball.moveTo(400, 600);
                    ball.throwTo(x, y, function() {
                        lobbyists = $.map(lobbyists, function(lobbyist, index) {
                            if (psboxii.util.distance(ball.pos, lobbyist.pos) < 100) {
                                lobbyist.remove();
                                level.lobbyistsDefeated++;
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
                        var man = scene.addActor(new psboxii.Man(), 'lobbyists');
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


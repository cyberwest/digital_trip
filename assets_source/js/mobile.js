$(function() {
    // Game config
    var server = window.location.origin,
        hash = window.location.hash,
        leftBreakThreshold = -3,
        leftTurnThreshold = -20,
        rightBreakThreshold = 3,
        rightTurnThreshold = 20,
        controller = $("#controller"),
        $gameCodeInput = $("#gameCodeInput"),
        wheel = $("#wheel"),
        status = $("#status"),
        turned = false;

    if( /iP(ad|od|hone)|Android|Blackberry|Windows Phone/i.test(navigator.userAgent) || true) {
        // Show the controller ui with gamecode input
        controller.show();
        // window.addEventListener('orientationchange', function(event) {
        //     var rotate = 0 - window.orientation;
        //     $("body").css({
        //         "transform": "rotate("+rotate+"deg)",
        //         "-ms-transform": "rotate("+rotate+"deg)",
        //         "-webkit-transform": "rotate("+rotate+"deg)",
        //         "-moz-transform": "rotate("+rotate+"deg)"
        //     });
        // }, false );
        // When connect is pushed, establish socket connection
        var connect = function(gameCode) {
            socket = io.connect(server);
            // When server replies with initial welcome...
            socket.on('welcome', function(data) {
                // Send 'controller' device type with our entered game code
                socket.emit("device", {"type":"controller", "gameCode":gameCode});
            });
            socket.on("message", function(data) {
                if (data.type === "vibr") {
                    // console.log("vibtare", data.time);
                    navigator.vibrate(data.time);
                }
                if (data.type === "gameover") {
                    // console.log("gameover");
                    wheel.hide();
                    $("#gameover").show();
                }
                if (data.type === "resetGame") {
                    // console.log("resetGame");
                    $("#gameover").hide();
                    wheel.show();
                }
            });
            // When game code is validated, we can begin playing...
            socket.on("connected", function(data) {

                // Hide game code input, and show the vehicle wheel UI
                $("#socket").hide();
                $("#preparetostart").show();
                $("#start").click(function () {
                    socket.emit('start', {});
                    $(this).unbind('click');
                    $("#preparetostart").hide();
                    wheel.show();
                    // Audio loop - hack for prevent screen sleep
                    $('#audioloop').trigger('play');
                });
                // If user touches the screen, accelerate
                document.addEventListener("touchstart", function (event) {
                    socket.emit("accelerate", {'accelerate':true});
                    $('#forward').addClass('active');
                }, false);
                // Stop accelerating if user stops touching screen
                document.addEventListener("touchend", function(event) {
                    socket.emit("accelerate", {'accelerate':false});
                    $('#forward').removeClass('active');
                }, false);
                // Prevent touchmove event from cancelling the 'touchend' event above
                document.addEventListener("touchmove", function(event) {
                    event.preventDefault();
                }, false);
                
                function orientationHandler (event) {
                    var a = event.alpha, // "direction"
                        b = event.beta,  // left/right 'tilt'
                        g = event.gamma; // forward/back 'tilt'
                    var turn,
                        ori = window.orientation;
                    if (ori === 0) turn = g;
                    if (ori === 90) turn = b;
                    if (ori === -90) turn = -b;
                    if (!turned) turned = true;
                    socket.emit("turn", {'turn':turn, 'g':a});
                }
                // Steer the vehicle based on the phone orientation
                window.addEventListener('deviceorientation', orientationHandler, false);
                window.addEventListener('MozOrientation', orientationHandler, false);

                setTimeout(function () {
                    if (!turned) {
                        $("#turnLeft").on('touchstart',function () {
                            socket.emit("click", {"click":"toTheLeft"});
                        });
                        $("#turnRight").on('touchstart',function () {
                            socket.emit("click", {"click":"toTheRight"});
                        });
                    }
                }, 1000);

                $("#sphere").on('touchstart',function () {
                    socket.emit("click", {"click":"pause"});
                });

                $("#restart").click(function () {
                    socket.emit("click", {"click":"restart"});
                    $("#gameover").hide();
                    wheel.show();
                    $('#audioloop').trigger('play');
                });

            });
            socket.on("fail", function() {
                status.html("Failed to connect! Reload!");
            });
            $(document).unbind("keyup", connnectOnEnter);
        };
        if (hash) {
            connect(hash.slice(1));
        }
        var connnectOnEnter = function (event) {
            var k = event.keyCode;
            if (k === 13) {
                connect($gameCodeInput.val());
            }
        };
        $("#connect").click(function () {
            connect($gameCodeInput.val());
        });
        $(document).bind("keyup", connnectOnEnter);
    }
});
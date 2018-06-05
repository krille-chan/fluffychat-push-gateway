const app = require("https");
const request = require('request');
const fs = require('fs');

const options = {
    key: fs.readFileSync('//etc/letsencrypt/live/janian.de/privkey.pem'),
    cert: fs.readFileSync('//etc/letsencrypt/live/janian.de/fullchain.pem'),
};

app.createServer( options,
    function (req, res) {
        if (req.method == 'POST') {
            var jsonString = '';

            req.on('data', function (data) {
                jsonString += data;
            });

            req.on('end', function () {
                notification = JSON.parse(jsonString).notification;

                var approxExpire = new Date ();
                approxExpire.setUTCMinutes(approxExpire.getUTCMinutes()+10);

                var devices = notification.devices;
                var rejected = [];
                for ( var i = 0; i < devices.length; i++ ) {

                    // Workaround for wrong appid:
                    if ( devices[i].app_id === "fluffychat.christianpauly_hello" ) devices[i].app_id = "fluffychat.christianpauly_fluffychat";

                    var localPushKey = devices[i].pushkey;

                    if ( devices[i].app_id === "fluffychat.christianpauly_fluffychat" ) {
                        var room = notification.room_name || notification.sender_display_name || notification.sender || "";
                        console.log ( room );
                        var isMessage = notification.type === "m.room.message"

                        var notifydata = {
                            "appid" : devices[i].app_id,
                            "expire_on": approxExpire.toISOString(),
                            "token": localPushKey,
                            "clear_pending": true,
                            "replace_tag": room,
                            "data": {
                                "message": notification,
                                "notification": {
                                    "sound": isMessage,
                                    "tag": room,
                                    "vibrate": isMessage,
                                    "emblem-counter": {
                                        "count": notification.counts.unread || 0,
                                        "visible": (notification.counts.unread || 0) > 0 ? true : false
                                    }
                                }
                            }
                        };

                        if ( isMessage ) notifydata.data.notification.card = {
                            "action": "application:///fluffychat.desktop",
                            "summary": notification.room_name || notification.sender_display_name || notification.sender,
                            "body": notification.content ? notification.content.body : "New secret Message",
                            "persist": true,
                            "popup": true
                        };
                        request.post("https://push.ubports.com/notify", {json: notifydata}, function(err,res,body) {
                            rejected.push(localPushKey);
                            //res.writeHead(200);
                            //res.end(rejected);
                        });
                    }
                }

            });
        }
        else {
            res.writeHead(200);
            res.end("Fluffychat Push-Gateway");
        }
    }
).listen(7001);

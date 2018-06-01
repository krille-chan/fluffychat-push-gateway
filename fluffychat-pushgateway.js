const app = require("https");
const request = require('request');
const fs = require('fs');

const options = {
  key: fs.readFileSync('//etc/letsencrypt/live/janian.de/privkey.pem'),
  cert: fs.readFileSync('//etc/letsencrypt/live/janian.de/fullchain.pem'),
};

app.createServer( options,
    function (req, res) {
res.writeHead(200);
  res.end("Fluffychat Push-Gateway");
        if (req.method == 'POST') {
            var jsonString = '';

            req.on('data', function (data) {
                jsonString += data;
            });

            req.on('end', function () {
                notification = JSON.parse(jsonString).notification;
                console.log("New Notification!");

                var approxExpire = new Date ();
                approxExpire.setUTCMinutes(approxExpire.getUTCMinutes()+10);

                var devices = notification.devices;
                for ( var i = 0; i < devices.length; i++ ) {

                    if ( devices[i].app_id === "fluffychat.christianpauly_fluffychat" && notification.type === "m.room.message" ) {
			var room = notification.room_name || notification.sender_display_name || notification.sender;
                        data = {
                            "appid" : devices[i].app_id,
                            "expire_on": approxExpire.toISOString(),
                            "token": devices[i].pushkey,
                            "clear_pending": true,
                            "replace_tag": room,
                            "data": {
                                "message": "New Message",
                                "notification": {
                                    "card": {
					"action": "appid://" + devices[i].app_id,
                                        "summary": notification.room_name || notification.sender_display_name || notification.sender,
                                        "body": notification.content ? notification.content.body : "New secret Message",
					"persist": true,
                                        "popup": true
                                    },
					"sound": true,
                                    "tag": room,
                                    "vibrate": true,
                                    "emblem-counter": {
                                        "count": notification.counts.unread || 1,
                                        "visible": true
                                    }
                                }
                            }
                	
                        };
                        console.log("sending to " + devices[i].app_id)
                        request.post("https://push.ubports.com/notify", {json: data}, function(err,res,body) {console.log(body)});
                    }
                }

            });
        }
    }
).listen(7000);


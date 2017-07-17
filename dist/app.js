"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var messenger_1 = require("./messenger");
var botConfig = {
    "appSecret": "677736de57975cf75655b0585ec00c70",
    "pageAccessToken": "EAAQpk3JkMZB4BAPLH5GOcEtZBZBUPU8enRNaSB9fHsGPsYUMpZA9U4Vj9ZBDJLDtEJKU5ZCkc7asUSgJlAXZAravUrqJNV0rjFlnB5XZCYZCaMACNKSdHJuOZCL0FMA8M3Ofmb9TaQI3hVE0AV6vCzNyR6drmWD4ZCzgeztZCXbmdCQ6cwZDZD",
    "validationToken": "validation_token",
    "serverURL": "https://65e507c2.ngrok.io"
};
var messengerRouter = express.Router();
var mbot = new messenger_1.MessengerConnector(messengerRouter, botConfig);
var app = express();
var port = process.env.PORT || 3000;
app.use('/messenger', messengerRouter);
app.listen(port, function () {
    return console.log("Listening at http://localhost:" + port);
});
mbot.on('input', function (e) {
    var loginfo = '[';
    if (e.botInfo.platform)
        loginfo += e.botInfo.platform + '|';
    if (e.botInfo.botId)
        loginfo += e.botInfo.botId + '|';
    loginfo += e.userId + ']';
    switch (e.type) {
        case 'text':
            console.log(loginfo + " << text: " + e.content.text);
            mbot.id().sendTextMessage(e.userId, e.content.text);
            break;
        case 'button':
            console.log(loginfo + " << button: " + e.content.callback);
            break;
        case 'tbutton':
            console.log(loginfo + " << tbutton: " + e.content.callback);
            break;
    }
});
//# sourceMappingURL=app.js.map
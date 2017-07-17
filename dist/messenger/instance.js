"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var MessengerConnectorInstance = (function () {
    function MessengerConnectorInstance(botConfig, botId) {
        this.botId = botId;
        console.log("# Messenger bot with ID \"" + botId + "\" has been created");
        if (!(botConfig.appSecret && botConfig.pageAccessToken &&
            botConfig.validationToken && botConfig.serverURL)) {
            throw "NextbotMessenger: Missing config values";
        }
        this.botConfig = botConfig;
    }
    MessengerConnectorInstance.prototype.receivedAuthentication = function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;
        var passThroughParam = event.optin.ref;
        console.log("Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam, timeOfAuth);
    };
    MessengerConnectorInstance.prototype.receivedDeliveryConfirmation = function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;
        if (messageIDs) {
            messageIDs.forEach(function (messageID) {
            });
        }
    };
    MessengerConnectorInstance.prototype.receivedMessageRead = function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;
    };
    MessengerConnectorInstance.prototype.sendReadReceipt = function (recipientId) {
        console.log("Sending a read receipt to mark message as seen");
        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };
        return this.callSendAPI(messageData);
    };
    MessengerConnectorInstance.prototype.getStartedButton = function (isOn) {
        var _this = this;
        if (isOn === void 0) { isOn = true; }
        return new Promise(function (resolve, reject) {
            if (isOn) {
                request({
                    url: "https://graph.facebook.com/v2.6/me/messenger_profile",
                    qs: { access_token: _this.botConfig.pageAccessToken },
                    method: "POST",
                    json: {
                        "get_started": {
                            "payload": "GET_STARTED"
                        }
                    }
                }, function (error, response, body) {
                    resolve(body);
                });
            }
            else {
                request({
                    url: "https://graph.facebook.com/v2.6/me/messenger_profile",
                    qs: { access_token: _this.botConfig.pageAccessToken },
                    method: "DELETE",
                    json: {
                        "fields": [
                            "get_started"
                        ]
                    }
                }, function (error, response, body) {
                    resolve(body);
                });
            }
        });
    };
    MessengerConnectorInstance.prototype.botDescription = function (descrText) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            request({
                url: "https://graph.facebook.com/v2.6/me/thread_settings",
                qs: { access_token: _this.botConfig.pageAccessToken },
                method: "POST",
                json: {
                    setting_type: "greeting",
                    greeting: {
                        text: descrText
                    }
                }
            }, function (error, response, body) {
                resolve(body);
            });
        });
    };
    MessengerConnectorInstance.prototype.persistentMenu = function (persistentMenu, isInputEnabled) {
        var _this = this;
        if (isInputEnabled === void 0) { isInputEnabled = true; }
        return new Promise(function (resolve, reject) {
            var persistent_menu_arr = [];
            for (var i = 0; i < persistentMenu.length; i++) {
                persistent_menu_arr[i] = {
                    "type": "postback",
                    "title": persistentMenu[i].title,
                    "payload": persistentMenu[i].payload
                };
            }
            request({
                url: "https://graph.facebook.com/v2.6/me/messenger_profile",
                qs: { access_token: _this.botConfig.pageAccessToken },
                method: "POST",
                json: {
                    persistent_menu: [{
                            locale: "default",
                            composer_input_disabled: !isInputEnabled,
                            call_to_actions: persistent_menu_arr
                        }]
                }
            }, function (error, response, body) {
                resolve(body);
            });
        });
    };
    MessengerConnectorInstance.prototype.callSendAPI = function (messageData) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            request({
                uri: 'https://graph.facebook.com/v2.6/me/messages',
                qs: { access_token: _this.botConfig.pageAccessToken },
                method: 'POST',
                json: messageData
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var recipientId = body.recipient_id;
                    var messageId = body.message_id;
                    if (messageId) {
                        resolve(body);
                    }
                    else {
                        console.log("Successfully called Send API for recipient %s", recipientId);
                    }
                }
                else {
                    console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
                    reject(error);
                    return;
                }
            });
        });
    };
    MessengerConnectorInstance.prototype.sendTextMessage = function (recipientId, messageText) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "DEVELOPER_DEFINED_METADATA"
            }
        };
        return this.callSendAPI(messageData);
    };
    return MessengerConnectorInstance;
}());
exports.default = MessengerConnectorInstance;
//# sourceMappingURL=instance.js.map
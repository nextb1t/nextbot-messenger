"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_events_1 = require("typescript.events");
var request = require("request");
var NextbotMessenger = (function (_super) {
    __extends(NextbotMessenger, _super);
    function NextbotMessenger(botConfig) {
        var _this = _super.call(this) || this;
        console.log('# NextbotMessenger is creating...', botConfig);
        if (!(botConfig.appSecret && botConfig.pageAccessToken &&
            botConfig.validationToken && botConfig.serverURL)) {
            throw "NextbotMessenger: Missing config values";
        }
        _this.botConfig = botConfig;
        return _this;
    }
    NextbotMessenger.prototype.receivedAuthentication = function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;
        var passThroughParam = event.optin.ref;
        console.log("Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam, timeOfAuth);
    };
    NextbotMessenger.prototype.receivedDeliveryConfirmation = function (event) {
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
    NextbotMessenger.prototype.receivedMessageRead = function (event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;
    };
    NextbotMessenger.prototype.sendReadReceipt = function (recipientId) {
        console.log("Sending a read receipt to mark message as seen");
        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };
        return this.callSendAPI(messageData);
    };
    NextbotMessenger.prototype.callSendAPI = function (messageData) {
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
    NextbotMessenger.prototype.sendTextMessage = function (recipientId, messageText) {
        console.log('FBBOT: sendTextMessage:', messageText);
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
    return NextbotMessenger;
}(typescript_events_1.Event));
exports.NextbotMessenger = NextbotMessenger;
exports.default = NextbotMessenger;
var bodyParser = require("body-parser");
var crypto = require("crypto");
var DEFAULT_BOTID = 'default';
var MessengerController = (function () {
    function MessengerController(router, config) {
        var verifyRequestSignature = this.verifyRequestSignature.bind(this);
        var getWebhook = this.getWebhook.bind(this);
        var postWebhook = this.postWebhook.bind(this);
        if ('appSecret' in config && 'pageAccessToken' in config &&
            'validationToken' in config && 'serverURL' in config) {
            this.botBoxConfig = (_a = {}, _a[DEFAULT_BOTID] = config, _a);
        }
        else {
            for (var bot in config) {
                if (!('appSecret' in config[bot] && 'pageAccessToken' in config[bot] &&
                    'validationToken' in config[bot] && 'serverURL' in config[bot])) {
                    throw "Missing config values";
                }
            }
            this.botBoxConfig = config;
        }
        router.get('/:botId?/webhook', getWebhook);
        router.post('/:botId?/webhook', bodyParser.json({ verify: verifyRequestSignature }), postWebhook);
        var _a;
    }
    MessengerController.prototype.getWebhook = function (req, res) {
        var botConfig = this.getBotConfig(req);
        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === botConfig.validationToken) {
            console.log("Validating webhook for \"" + botConfig.botId + "\"");
            res.status(200).send(req.query['hub.challenge']);
        }
        else {
            console.error('Failed validation. Make sure the validation tokens match.');
            res.sendStatus(403);
        }
    };
    MessengerController.prototype.postWebhook = function (req, res) {
        var botConfig = this.getBotConfig(req);
        console.dir(req.body);
        console.dir(req.body.entry[0].messaging);
        res.send("POST msg, " + botConfig.botId);
    };
    MessengerController.prototype.verifyRequestSignature = function (req, res, buf) {
        var botConfig = this.getBotConfig(req);
        var signature = req.headers['x-hub-signature'];
        console.log("Validating x-hub-signature for \"" + botConfig.botId + "\"");
        if (!signature) {
            throw new Error('Couldn\'t validate the request signature.');
        }
        else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];
            var expectedHash = crypto.createHmac('sha1', botConfig.appSecret)
                .update(buf)
                .digest('hex');
            if (signatureHash != expectedHash) {
                throw new Error('Couldn\'t validate the request signature.');
            }
        }
    };
    MessengerController.prototype.getBotConfig = function (req) {
        var botId = req.params.botId;
        botId = botId || DEFAULT_BOTID;
        var cfg;
        cfg.botId = botId;
        if (botId in this.botBoxConfig) {
            cfg = this.botBoxConfig[botId];
        }
        else
            throw 'Got webhook request with unknown botId';
        return cfg;
    };
    return MessengerController;
}());
exports.MessengerController = MessengerController;
//# sourceMappingURL=index.js.map
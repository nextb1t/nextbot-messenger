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
var bodyParser = require("body-parser");
var crypto = require("crypto");
var typescript_events_1 = require("typescript.events");
var instance_1 = require("./instance");
var DEFAULT_BOTID = '_default';
var MessengerConnector = (function (_super) {
    __extends(MessengerConnector, _super);
    function MessengerConnector(router, config) {
        var _this = _super.call(this) || this;
        var verifyRequestSignature = _this.verifyRequestSignature.bind(_this);
        var getWebhook = _this.getWebhook.bind(_this);
        var postWebhook = _this.postWebhook.bind(_this);
        if ('appSecret' in config && 'pageAccessToken' in config &&
            'validationToken' in config && 'serverURL' in config) {
            _this.botBoxConfig = (_a = {}, _a[DEFAULT_BOTID] = config, _a);
        }
        else {
            for (var key in config) {
                if (typeof config[key] === 'string') {
                    throw "Missing config values";
                }
                var bot = key;
                if (!('appSecret' in config[bot] && 'pageAccessToken' in config[bot] &&
                    'validationToken' in config[bot] && 'serverURL' in config[bot])) {
                    throw "Missing config values in " + bot;
                }
            }
            _this.botBoxConfig = config;
        }
        for (var botId in _this.botBoxConfig)
            _this.createMCI(botId);
        router.get('/', function (req, res) { return res.status(200).send('Ok'); });
        router.route('/:botId?/webhook')
            .get(getWebhook)
            .post(bodyParser.json({ verify: verifyRequestSignature }), postWebhook);
        return _this;
        var _a;
    }
    MessengerConnector.prototype.getWebhook = function (req, res) {
        var botConfig = this.getBotInfo(req.params.botId).botConfig;
        console.log(botConfig);
        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === botConfig.validationToken) {
            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        }
        else {
            console.error('Failed validation. Make sure the validation tokens match.');
            res.sendStatus(403);
        }
    };
    MessengerConnector.prototype.postWebhook = function (req, res) {
        var _this = this;
        var _a = this.getBotInfo(req.params.botId), botConfig = _a.botConfig, botId = _a.botId;
        var data = req.body;
        if (data.object === 'page') {
            var mci = this.id(botId);
            data.entry.forEach(function (pageEntry) {
                var pageID = pageEntry.id;
                var timeOfEvent = pageEntry.time;
                pageEntry.messaging.forEach(function (messagingEvent) {
                    if (messagingEvent.optin) {
                    }
                    else if (messagingEvent.delivery) {
                    }
                    else if (messagingEvent.read) {
                    }
                    else if (messagingEvent.message) {
                        _this.receivedMessage(messagingEvent, botId);
                    }
                    else if (messagingEvent.postback) {
                    }
                    else if (messagingEvent.account_linking) {
                    }
                    else {
                        console.error("Webhook received unknown messagingEvent: ", messagingEvent);
                    }
                });
            });
            res.sendStatus(200);
        }
        else {
            res.sendStatus(400);
        }
    };
    MessengerConnector.prototype.receivedMessage = function (event, botId) {
        var senderID = event.sender.id;
        var message = event.message;
        var isEcho = message.is_echo;
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;
        var resEvent = { userId: senderID,
            botInfo: { platform: 'messenger' },
            type: '',
            content: {} };
        if (botId !== DEFAULT_BOTID)
            resEvent.botInfo['botId'] = botId;
        if (isEcho) {
            return;
        }
        else if (quickReply) {
            var quickReplyPayload = quickReply.payload;
            resEvent.type = 'tbutton';
            resEvent.content = { title: message.text,
                callback: quickReply.payload };
            this.emit('input', resEvent);
            return;
        }
        if (messageText) {
            resEvent.type = 'text';
            resEvent.content = { text: messageText };
            this.emit('input', resEvent);
        }
        else if (messageAttachments) {
        }
    };
    MessengerConnector.prototype.receivedPostback = function (event, botId) {
        var senderID = event.sender.id;
        var payload = event.postback.payload;
        var resEvent = { userId: senderID,
            botInfo: { platform: 'messenger' },
            type: 'button',
            content: {} };
        if (botId !== DEFAULT_BOTID)
            resEvent.botInfo['botId'] = botId;
        resEvent.content = { callback: payload };
        this.emit('input', resEvent);
    };
    MessengerConnector.prototype.verifyRequestSignature = function (req, res, buf) {
        var botConfig = this.getBotInfo(req.params.botId).botConfig;
        var signature = req.headers['x-hub-signature'];
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
    MessengerConnector.prototype.getBotInfo = function (botIdReq) {
        var botId = (!botIdReq)
            ? DEFAULT_BOTID : botIdReq;
        if (botId in this.botBoxConfig) {
            return { botConfig: this.botBoxConfig[botId],
                botId: botId };
        }
        else
            throw 'Got webhook request with unknown botId';
    };
    MessengerConnector.prototype.getBotInfoFromReq = function (req) {
        if (!req.params)
            throw 'Req.params is undefined in getBotInfoFromReq, this shouldn\'t happen';
        var res;
        var botId = req.params.botId;
        if (!botId) {
            botId = DEFAULT_BOTID;
        }
        if (botId in this.botBoxConfig) {
            res = { botConfig: this.botBoxConfig[botId],
                botId: botId };
        }
        else
            throw 'Got webhook request with unknown botId';
        return res;
    };
    MessengerConnector.prototype.createMCI = function (botId) {
        if (!this.MCI) {
            this.MCI = {};
        }
        this.MCI[botId] = new instance_1.default(this.botBoxConfig[botId], botId);
    };
    MessengerConnector.prototype.id = function (botId) {
        if (botId === void 0) { botId = DEFAULT_BOTID; }
        if (!this.MCI[botId])
            throw 'No bot with this ID "' + botId + '"';
        return this.MCI[botId];
    };
    return MessengerConnector;
}(typescript_events_1.Event));
exports.MessengerConnector = MessengerConnector;
exports.default = MessengerConnector;
//# sourceMappingURL=connector.js.map
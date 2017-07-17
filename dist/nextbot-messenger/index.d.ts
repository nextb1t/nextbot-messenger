import { Event } from "typescript.events";
export interface IMessengerBotConfig {
    botId?: string;
    appSecret: string;
    pageAccessToken: string;
    validationToken: string;
    serverURL: string;
}
export interface IMessengerBotBoxConfig {
    [botId: string]: IMessengerBotConfig;
}
export declare class NextbotMessenger extends Event {
    private botConfig;
    constructor(botConfig: IMessengerBotConfig);
    private receivedAuthentication(event);
    private receivedDeliveryConfirmation(event);
    private receivedMessageRead(event);
    sendReadReceipt(recipientId: any): any;
    private callSendAPI(messageData);
    sendTextMessage(recipientId: any, messageText: any): any;
}
export default NextbotMessenger;
import { Router } from 'express';
export declare class MessengerController {
    private botBoxConfig;
    constructor(router: Router, config: IMessengerBotConfig | IMessengerBotBoxConfig);
    private getWebhook(req, res);
    private postWebhook(req, res);
    private verifyRequestSignature(req, res, buf);
    private getBotConfig(req);
}

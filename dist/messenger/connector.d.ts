import { Router } from 'express';
import { Event } from "typescript.events";
import { IMessengerBotConfig, IMessengerBotBoxConfig } from "./index";
import MessengerConnectorInstance from "./instance";
export declare class MessengerConnector extends Event {
    private readonly botBoxConfig;
    private MCI;
    constructor(router: Router, config: IMessengerBotConfig | IMessengerBotBoxConfig);
    private getWebhook(req, res);
    private postWebhook(req, res);
    private receivedMessage(event, botId);
    receivedPostback(event: object, botId: string): void;
    private verifyRequestSignature(req, res, buf);
    private getBotInfo(botIdReq);
    private getBotInfoFromReq(req);
    private createMCI(botId);
    id(botId?: string): MessengerConnectorInstance;
}
export default MessengerConnector;

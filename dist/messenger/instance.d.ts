import { IMessengerBotConfig } from "./index";
declare class MessengerConnectorInstance {
    private readonly botConfig;
    private readonly botId;
    constructor(botConfig: IMessengerBotConfig, botId: string);
    receivedAuthentication(event: any): void;
    receivedDeliveryConfirmation(event: any): void;
    receivedMessageRead(event: any): void;
    sendReadReceipt(recipientId: any): any;
    getStartedButton(isOn?: boolean): any;
    botDescription(descrText: any): any;
    persistentMenu(persistentMenu: any, isInputEnabled?: boolean): any;
    private callSendAPI(messageData);
    sendTextMessage(recipientId: any, messageText: any): any;
    sendImageMessage(recipientId: any, imgPath: any, fromServer?: boolean): any;
    sendQuickReply(recipientId: any, messageText: any, buttons: any): any;
}
export default MessengerConnectorInstance;

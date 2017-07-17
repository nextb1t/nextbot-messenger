export { MessengerConnector } from "./connector";
export interface IMessengerBotConfig {
    appSecret: string;
    pageAccessToken: string;
    validationToken: string;
    serverURL: string;
}
export interface IMessengerBotBoxConfig {
    [botId: string]: IMessengerBotConfig;
}
export interface IEventInput {
    userId: string;
    botInfo: {
        platform: string;
        botId?: string;
    };
    type: 'text' | 'button' | 'tbutton';
    content: {
        title?: string;
        callback: string;
    } | {
        text: string;
    };
}

import { Event } from "typescript.events"
// ??? I can't make default export work at the same time with {} export here
export { MessengerConnector } from "./connector"
// export default MessengerConnector

export interface IMessengerBotConfig {
  appSecret: string,
  pageAccessToken: string,
  validationToken: string,
  serverURL: string
}

export interface IMessengerBotBoxConfig {
  [botId: string]: IMessengerBotConfig
}

export interface IEventInput {
  userId: string, 
  botInfo: { platform: string, botId?: string },
  type: 'text' | 'button' | 'tbutton',
  content: { title?: string, callback: string } | { text: string }
}
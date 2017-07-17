import * as express from 'express'

import { MessengerConnector,
  IMessengerBotConfig, IMessengerBotBoxConfig } from '../../src/messenger'

const DEFAULT_BOTID = '_default'


let botBoxConfig: IMessengerBotBoxConfig = {
  bot1: {
    appSecret: "APP_SECRET",
    pageAccessToken: "PAGE_TOKEN",
    validationToken: "VALIDATION_TOKEN",
    serverURL: "SERVER_URL"
  },
  bot2: {
    appSecret: "2_APP_SECRET",
    pageAccessToken: "2_PAGE_TOKEN",
    validationToken: "2_VALIDATION_TOKEN",
    serverURL: "2_SERVER_URL"
  }
}

let botConfig: IMessengerBotConfig = botBoxConfig.bot1

// ??? How to remove syntax highliting in tests
const messengerRouter: express.Router = express.Router()
const mbot = new MessengerConnector(messengerRouter, botConfig)


describe('class MessengerConnector', () => {
  let bc = botConfig
  let mc = new MessengerConnector(messengerRouter, bc)

  test('config with only one bot', () => {
    expect(mc.botBoxConfig).toEqual({
      [DEFAULT_BOTID]: bc
    })

    let bcPart = Object.assign({}, bc)
    delete bcPart['appSecret']
    try { new MessengerConnector(messengerRouter, bcPart) }
    catch(e) { expect(e).toBe('Missing config values') } 
  })

  test('getBotInfoFromReq', () => {
    let req = { params: { } }
    let res = mc.getBotInfoFromReq(req)
    expect(res.botId).toBe(DEFAULT_BOTID)
    expect(res.botConfig).toEqual(bc)

    let req2 = { params: { botId: 'test' } }
    try { mc.getBotInfoFromReq(req2) }
    catch(e) { expect(e).toBe('Got webhook request with unknown botId') } 
  })

  test('findOrCreateMCI', () => {
    let mci = mc.findOrCreateMCI(DEFAULT_BOTID)
    expect(mci.botId).toBe(DEFAULT_BOTID)
  })

})
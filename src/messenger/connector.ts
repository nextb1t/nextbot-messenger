import { Router, Request, Response } from 'express'
import * as bodyParser from 'body-parser'
import * as crypto from 'crypto'
import { Event } from "typescript.events"
import { IMessengerBotConfig, IMessengerBotBoxConfig } from "./index"
import MessengerConnectorInstance from "./instance"

const DEFAULT_BOTID = '_default'


export class MessengerConnector extends Event {
  private readonly botBoxConfig: IMessengerBotBoxConfig
  private MCI: { [botId: string]: MessengerConnectorInstance }

  constructor(router: Router, config: IMessengerBotConfig | IMessengerBotBoxConfig) {
    super() // required for Event to work

    const verifyRequestSignature = this.verifyRequestSignature.bind(this)
    const getWebhook = this.getWebhook.bind(this)
    const postWebhook = this.postWebhook.bind(this)
    
    // converting IMessengerBotConfig -> IMessengerBotBoxConfig
    // all config varuables are required to create a Messenger bot
    if ('appSecret' in config && 'pageAccessToken' in config &&
        'validationToken' in config && 'serverURL' in config) {
      // config type : IMessengerBotConfig
      this.botBoxConfig = { [DEFAULT_BOTID]: <IMessengerBotConfig>config }
    } else {
      // config type : IMessengerBotBoxConfig, checking every bot
      for (let key in config) {
        // of there are missing values in IMessengerBotConfig        
        if (typeof config[key] === 'string') 
        { throw "Missing config values" }

        let bot = key
        if (!('appSecret' in config[bot] && 'pageAccessToken' in config[bot] &&
              'validationToken' in config[bot] && 'serverURL' in config[bot]))
        { throw `Missing config values in ${bot}` }
      }
      this.botBoxConfig = <IMessengerBotBoxConfig>config
    }

    // creating all MCI
    for (let botId in this.botBoxConfig) this.createMCI(botId)
    // console.log('[MessengerConnector] botBoxConfig:', this.botBoxConfig)

    // Render a index message
    router.get('/', (req, res) => res.status(200).send('Ok'))

    router.route('/:botId?/webhook')
      .get(getWebhook)
      .post(bodyParser.json({ verify: verifyRequestSignature }), postWebhook)
  }

  private getWebhook(req: Request, res: Response) {
    const { botConfig } = this.getBotInfo(req.params.botId)
    console.log(botConfig)

    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === botConfig.validationToken) {
      console.log(`Validating webhook`)
      res.status(200).send(req.query['hub.challenge'])
    } else {
      console.error('Failed validation. Make sure the validation tokens match.')
      res.sendStatus(403)
    }
  }

  private postWebhook(req: Request, res: Response) {
    // console.log('req.params', req.params)
    const { botConfig, botId } = this.getBotInfo(req.params.botId)
    // console.log('BID:', botId)

    const data = req.body
    // console.log('POST:', data)
    // Make sure this is a page subscription
    if (data.object === 'page') {
      // console.log('botId', botId)
      let mci: MessengerConnectorInstance = this.id(botId)
      // Iterate over each entry
      // There may be multiple if batched
      data.entry.forEach((pageEntry) => {
        var pageID = pageEntry.id
        var timeOfEvent = pageEntry.time
        // Iterate over each messaging event
        pageEntry.messaging.forEach((messagingEvent) => {
          // console.log('FBM event')
          if (messagingEvent.optin) {
            // mci.receivedAuthentication(messagingEvent)
          } else if (messagingEvent.delivery) {
            // mci.receivedDeliveryConfirmation(messagingEvent)
          } else if (messagingEvent.read) {
            // mci.receivedMessageRead(messagingEvent)
          } else if (messagingEvent.message) {
            this.receivedMessage(messagingEvent, botId)
          } else if (messagingEvent.postback) {
            // log.fbm('Recieved event from FBM : postback')
            // receivedPostback(messagingEvent, req.params.locale)
          } else if (messagingEvent.account_linking) {
            // mci.receivedAccountLink(messagingEvent)
          } else {
            console.error("Webhook received unknown messagingEvent: ", messagingEvent)
          }
        })
      })
      // Assume all went well.
      // You must send back a 200, within 20 seconds, to let us know you've 
      // successfully received the callback. Otherwise, the request will time out.
      res.sendStatus(200)
    } else {
      // no valid data found
      res.sendStatus(400);
    }
  }

  private receivedMessage(event: object, botId: string) {
    // console.log('receivedMessage')
    let senderID = event.sender.id
    let message = event.message
    let isEcho = message.is_echo

    // You may get a text or attachment but not both
    let messageText = message.text
    let messageAttachments = message.attachments
    let quickReply = message.quick_reply

    let resEvent = { userId: senderID, 
                     botInfo: { platform: 'messenger' },
                     type: '',
                     content: {} }
    if (botId !== DEFAULT_BOTID) resEvent.botInfo['botId'] = botId

    if (isEcho) {
      // recieved echo message
      return
    } else if (quickReply) {
      let quickReplyPayload = quickReply.payload
      resEvent.type = 'tbutton'
      resEvent.content = { title: message.text, 
                           callback: quickReply.payload }
      this.emit('input', resEvent)
      return
    }

    if (messageText) {
      resEvent.type = 'text'
      resEvent.content = { text: messageText }
      this.emit('input', resEvent)

    } else if (messageAttachments) {
      // console.log("We can't process message with attachement")
    }
  }

  receivedPostback(event: object, botId: string) {
    var senderID = event.sender.id
    var payload = event.postback.payload
    // console.log('Recieved postback event :', payload)

    let resEvent = { userId: senderID, 
                     botInfo: { platform: 'messenger' },
                     type: 'button',
                     content: {} }
    if (botId !== DEFAULT_BOTID) resEvent.botInfo['botId'] = botId

    // emitting event with callback to socket
    resEvent.content = { callback: payload }  
    this.emit('input', resEvent)
  }

  /* Verify that the callback came from Facebook. Using the App Secret from 
   * the App Dashboard, we can verify the signature that is sent with each 
   * callback in the x-hub-signature field, located in the header.
   * https://developers.facebook.com/docs/graph-api/webhooks#setup
   */
  private verifyRequestSignature(req: Request, res: Response, buf: any) {
    const { botConfig } = this.getBotInfo(req.params.botId)

    let signature = req.headers['x-hub-signature']
    // console.log(`Validating x-hub-signature`)

    if (!signature) {
      throw new Error('Couldn\'t validate the request signature.')
    } else {
      var elements = signature.split('=')
      var method = elements[0]
      var signatureHash = elements[1]

      var expectedHash = crypto.createHmac('sha1', botConfig.appSecret)
        .update(buf)
        .digest('hex')

      if (signatureHash != expectedHash) {
        throw new Error('Couldn\'t validate the request signature.')
      }
    }
  }

  private getBotInfo(botIdReq: string)
    : { botConfig: IMessengerBotConfig, botId: string } {
      
    // console.log('getBotInfo:', botIdReq)
    let botId = (!botIdReq) 
      ? DEFAULT_BOTID : botIdReq

    if (botId in this.botBoxConfig) {
      return { botConfig: this.botBoxConfig[botId],
               botId: botId }
    } else throw 'Got webhook request with unknown botId'
  }

  private getBotInfoFromReq(req: Request)
    : { botConfig: IMessengerBotConfig, botId: string } {

    if (!req.params) throw 'Req.params is undefined in getBotInfoFromReq, this shouldn\'t happen'

    let res: { botConfig: IMessengerBotConfig, botId: string }
    
    let { botId } = req.params
    if (!botId) { botId = DEFAULT_BOTID }
    
    if (botId in this.botBoxConfig) {
      res = { botConfig: this.botBoxConfig[botId],
              botId: botId }
    } else throw 'Got webhook request with unknown botId'

    return res
  }

  private createMCI(botId: string) {
    if (!this.MCI) { this.MCI = {} }
    // botId is always going to be at least DEFAULT_BOTID here
    this.MCI[botId] = new MessengerConnectorInstance(this.botBoxConfig[botId], botId)
  }

  public id(botId: string = DEFAULT_BOTID): MessengerConnectorInstance {
    if (!this.MCI[botId]) throw 'No bot with this ID "' + botId + '"'
    return this.MCI[botId]
  }
}

export default MessengerConnector
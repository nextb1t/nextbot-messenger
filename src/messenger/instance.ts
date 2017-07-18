import * as request from "request"
import { IMessengerBotConfig } from "./index"


/* MessengerConnectorInstance is the bot instance for each "botId" */
class MessengerConnectorInstance {
  private readonly botConfig: IMessengerBotConfig  
  private readonly botId: string

  constructor(botConfig: IMessengerBotConfig, botId: string) {
    this.botId = botId
    console.log(`# Messenger Connector for botId "${botId}" has been created`)

    // all config varuables are required to create a Messenger bot
    if (!(botConfig.appSecret && botConfig.pageAccessToken &&
          botConfig.validationToken && botConfig.serverURL)) 
    { throw "NextbotMessenger: Missing config values" }
    this.botConfig = botConfig
  }

  /////////////////////////////////////////////////////////////
  ////////////////////// MAIN METHODS /////////////////////////
  /////////////////////////////////////////////////////////////

  /* Authorization Event
   * The value for 'optin.ref' is defined in the entry point. For the "Send to 
   * Messenger" plugin, it is the 'data-ref' field. Read more at 
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
   */
  public receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the 
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger' 
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
      "through param '%s' at %d", senderID, recipientID, passThroughParam, 
      timeOfAuth);

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    // sendTextMessage(senderID, "Authentication successful");
  }

  /* Delivery Confirmation Event
   * This event is sent to confirm the delivery of a message. Read more about 
   * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
   */
  public receivedDeliveryConfirmation(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
      messageIDs.forEach(function(messageID) {
        // console.log("Received delivery confirmation for message ID: %s", 
        //   messageID);
      });
    }
    //console.log("All message before %d were delivered.", watermark);
  }

  /* Message Read Event
   * This event is called when a previously-sent message has been read.
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
   */
  public receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    // console.log("@ Received message read event for watermark %d and sequence " +
    //   "number %d", watermark, sequenceNumber);
  }

  /* Send a read receipt to indicate the message has been read */
  public sendReadReceipt(recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    var messageData = {
      recipient: {
        id: recipientId
      },
      sender_action: "mark_seen"
    }
    return this.callSendAPI(messageData)
  }

  /////////////////////////////////////////////////////////////
  ////////////////////// INIT SETUP ///////////////////////////
  /////////////////////////////////////////////////////////////

  public getStartedButton(isOn = true) {
    // console.log('getStartedButton:', isOn)
    return new Promise((resolve, reject) => {
      if (isOn) {
        request({
          url: "https://graph.facebook.com/v2.6/me/messenger_profile",
          qs: {access_token: this.botConfig.pageAccessToken},
          method: "POST",
          json: {
            "get_started": {
              "payload":"GET_STARTED"
            }
          }
        }, (error, response, body) => {
          resolve(body)
        })
      } else {
        request({
          url: "https://graph.facebook.com/v2.6/me/messenger_profile",
          qs: {access_token: this.botConfig.pageAccessToken},
          method: "DELETE",
          json: {
            "fields":[
              "get_started"
            ]
          }
        }, (error, response, body) => {
          resolve(body)
        })
      }
    })
  }

  public botDescription(descrText) {
    // console.log('botDescription:', descrText)
    return new Promise((resolve, reject) => {
      request({
        url: "https://graph.facebook.com/v2.6/me/thread_settings",
        qs: {access_token: this.botConfig.pageAccessToken},
        method: "POST",
        json: {  
          setting_type: "greeting",
            greeting: {
              text: descrText
            } 
        }
      }, (error, response, body) => {
        // console.log("! setThreadDescription ", body)
        resolve(body)
      })
    })
  }

  public persistentMenu(persistentMenu, isInputEnabled = true) {
    // console.log(`Thread: Setting up the persistent menu for ${lang}.`)
    return new Promise((resolve, reject) => {
      let persistent_menu_arr = []
      for (let i = 0; i < persistentMenu.length; i++) {
        persistent_menu_arr[i] = {
          "type": "postback",
          "title": persistentMenu[i].title,
          "payload": persistentMenu[i].payload
        }
      }
      request({
        url: "https://graph.facebook.com/v2.6/me/messenger_profile",
        qs: {access_token: this.botConfig.pageAccessToken},
        method: "POST",
        json: {
          persistent_menu:[{
              locale: "default",
              composer_input_disabled: !isInputEnabled,
              call_to_actions: persistent_menu_arr
            }]
        }
      }, (error, response, body) => {
        resolve(body)
      })
    })
  }

  /////////////////////////////////////////////////////////////
  ///////////////////// SENDING MESSAGES //////////////////////
  /////////////////////////////////////////////////////////////

  private callSendAPI(messageData) {
    return new Promise((resolve, reject) => {
      request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: this.botConfig.pageAccessToken },
        method: 'POST',
        json: messageData

      }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          let recipientId = body.recipient_id;
          let messageId = body.message_id;

          if (messageId) {
            // console.log("Successfully sent message with id %s to recipient %s",
            //   messageId, recipientId);
            resolve(body)
          } else {
          console.log("Successfully called Send API for recipient %s",
            recipientId);
            // resolve(body)
          }
        } else {
          console.error("Failed calling Send API",
            response.statusCode, response.statusMessage, body.error)
          reject(error)
          return
        }
      })
    })
  }

  /* Send a text message using the Send API. */
  public sendTextMessage(recipientId, messageText) {
    // console.log('FBBOT: sendTextMessage:', messageText)
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        metadata: "DEVELOPER_DEFINED_METADATA"
      }
    }
    return this.callSendAPI(messageData)
  }

  /* Send an image using the Send API */
  sendImageMessage(recipientId, imgPath, fromServer = true) {
    console.log('FBBOT: sendImageMessage:', this.botConfig.serverURL + imgPath)
    const fullImgPath = (fromServer) ? this.botConfig.serverURL + imgPath : imgPath
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: fullImgPath
          }
        }
      }
    }
    return this.callSendAPI(messageData)
  }

  /* Send a message with Quick Reply buttons */
  sendQuickReply(recipientId, messageText, buttons) {
    if(!(buttons)) throw "ERROR: Quick reply with no buttons!"
      
    let quick_replies_arr = []
    for(let i = 0; i < buttons.length; i++) {
      quick_replies_arr[i] = {
        "content_type": "text",
        "title": buttons[i].title,
        "payload": buttons[i].callback
      }
    }

    // console.log(quick_replies_arr)
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        quick_replies: quick_replies_arr
      }
    }
    return this.callSendAPI(messageData)
  }
}

export default MessengerConnectorInstance
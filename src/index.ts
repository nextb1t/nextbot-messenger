export { MessengerConnector,
  IMessengerBotConfig, IMessengerBotBoxConfig,
  IEventInput } from "./messenger"
/*
import * as express from 'express'
import { MessengerConnector,
  IMessengerBotConfig, IMessengerBotBoxConfig,
  IEventInput } from "./messenger"


let botConfig: IMessengerBotConfig = {
  "appSecret": "677736de57975cf75655b0585ec00c70",
  "pageAccessToken": "EAAQpk3JkMZB4BAPLH5GOcEtZBZBUPU8enRNaSB9fHsGPsYUMpZA9U4Vj9ZBDJLDtEJKU5ZCkc7asUSgJlAXZAravUrqJNV0rjFlnB5XZCYZCaMACNKSdHJuOZCL0FMA8M3Ofmb9TaQI3hVE0AV6vCzNyR6drmWD4ZCzgeztZCXbmdCQ6cwZDZD",
  "validationToken": "validation_token",
  "serverURL": "https://65e507c2.ngrok.io"
}

const messengerRouter: express.Router = express.Router()
const mbot = new MessengerConnector(messengerRouter, botConfig)

const app: express.Application = express()
const port: number = process.env.PORT || 3000

app.use('/messenger', messengerRouter)
// app.set('view engine', 'ejs')
// app.use(express.static('public'))
// app.use(cors()); // Allow CORS

app.listen(port, () => 
  console.log(`Listening at http://localhost:${port}`))

/////////////////////////////////////////////////
// mbot.id().getStartedButton()
// mbot.id().botDescription('text123')
// mbot.id().persistentMenu('menu-data', inputEnabled)

// event: IEventInput, how to set this type?
mbot.on('input', (e) => {
  // console.log('e:', e)
  let loginfo = '['
  if (e.botInfo.platform) loginfo += e.botInfo.platform + '|'
  if (e.botInfo.botId) loginfo += e.botInfo.botId + '|'
  loginfo += e.userId + ']'

  switch (e.type) {
    case 'text':
      console.log(`${loginfo} << text: ${e.content.text}`)
      mbot.id().sendTextMessage(e.userId, e.content.text)
      break;
    case 'button': 
      console.log(`${loginfo} << button: ${e.content.callback}`)
      break;
    case 'tbutton':
      console.log(`${loginfo} << tbutton: ${e.content.callback}`)
      break;
  }
})
*/
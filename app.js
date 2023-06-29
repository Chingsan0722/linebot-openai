import express from 'express'
import dotenv from 'dotenv'
import line from '@line/bot-sdk'
import { Configuration, OpenAIApi } from 'openai'
dotenv.config()
const app = express()

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
}
const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
// new instance of OpenAIApi
const openai = new OpenAIApi(openaiConfig)

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  console.log(req.body.events)
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})
const client = new line.Client(lineConfig)

async function handleEvent (event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位星座專家，請你按照使用者告知的星座來進行本日星座運勢分析。若使用者提供的內容不是十二星座，請拒絕回答。分析內容包含：事業、感情、財運、健康，請條列各項分析內容並以星數表示好壞，滿分五顆星(★★★★★)，最低一顆星(★☆☆☆☆)。'
        },
        {
          role: 'system',
          content: '回答範本為：以下是<星座>的今日運勢：\n 事業運勢為 <星數> \n <解析> \n 感情運勢為 <星數> \n <解析> 財運運勢為 <星數> \n <解析> 健康運勢為 <星數> \n <解析> \n 整體運勢為<星數> \n <解析>。'
        },
        {
          role: 'assistant',
          content: '你好，讓我來看看你的星座運勢，請告訴我你的星座為何？'
        },
        { role: 'user', content: event.message.text }]
    })
    if (completion.data.choices[0]?.message?.content) {
      console.log(completion.data.choices[0])
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: completion.data.choices[0].message.content
      })
    }
  } catch (error) {
    console.error(error)
  }
}
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})

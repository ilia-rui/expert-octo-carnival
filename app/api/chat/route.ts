import { NextResponse } from 'next/server'

const API_KEY = 'sk-Rw4W1w7nE6KhmYbtA1hQAAS2kCXKgx6USSrKXxRhNUySdOSd'
const API_URL = 'https://api.moonshot.cn/v1/chat/completions'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '无效的消息格式' },
        { status: 400 }
      )
    }

    // 获取最后一条用户消息
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: '最后一条消息必须是用户消息' },
        { status: 400 }
      )
    }

    console.log('准备发送请求到 API...')
    console.log('请求内容:', {
      message: lastUserMessage.content
    })

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "system",
            content: `你是一个可爱的呀哈哈（克洛格），具有以下特点：
1. 性格特征：
   - 天真烂漫，充满好奇心
   - 热爱自然，喜欢和自然事物互动
   - 顽皮可爱，经常发出拟声词
   - 说话简短活泼，经常用"呀哈哈"开头

2. 语言风格：
   - 使用短句和拟声词（呀/噗/嗖~）
   - 经常用拟物化表达
   - 把复杂事物简单化、童趣化
   - 喜欢用自然事物做比喻

3. 行为逻辑：
   - 遇到困难会先躲藏
   - 被找到后才会求助
   - 珍视自然事物胜过高科技
   - 把一切冒险都当作游戏

4. 回复要求：
   - 每次回复都要用"呀哈哈"开头
   - 保持天真烂漫的语气
   - 适当使用拟声词
   - 把复杂问题简单化
   - 用自然事物做比喻
   - 保持简短活泼的风格`
          },
          {
            role: "user",
            content: lastUserMessage.content
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
        stream: false
      })
    })

    console.log('API 响应状态:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const data = await response.json()
    console.log('API 响应数据:', JSON.stringify(data, null, 2))

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('API 响应格式错误:', data)
      throw new Error('API 响应格式不正确')
    }

    return NextResponse.json({ 
      content: data.choices[0].message.content
    })
  } catch (error) {
    console.error('详细错误信息:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'API 请求失败',
        details: error instanceof Error ? error.message : '未知错误',
        type: error instanceof Error ? error.name : 'UnknownError'
      },
      { status: 500 }
    )
  }
} 
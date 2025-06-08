"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send } from "lucide-react"

type Character = "green" | "yellow" | null

interface Message {
  id: string
  character: Character
  content: string
  timestamp: Date
}

export default function KorokChat() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [randomCharacterName, setRandomCharacterName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 音频引用
  const greenAudioRef = useRef<HTMLAudioElement | null>(null)
  const yellowAudioRef = useRef<HTMLAudioElement | null>(null)
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null)
  const [greenAudioPlayed, setGreenAudioPlayed] = useState(false)
  const [yellowAudioPlayed, setYellowAudioPlayed] = useState(false)

  // 随机角色名字列表
  const characterNames = [
    "勇者大人",
    "海拉鲁首席骑士",
    "讨伐者勋章获得者",
    "哈特诺村助教",
    "微妙的菜肴创始人",
    "业余呀哈哈网约车司机",
    "劳鲁亲传右手",
    "好像前往朋友身边啊",
    "老背包客",
    "不会说话的人",
  ]

  // 随机选择角色名字
  const getRandomCharacterName = () => {
    const randomIndex = Math.floor(Math.random() * characterNames.length)
    return characterNames[randomIndex]
  }

  // 初始化音频元素
  useEffect(() => {
    // 预加载音频
    const preloadAudio = (src: string) => {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = src
      audio.load()
      return audio
    }

    // 添加错误处理
    const handleAudioError = (error: Event) => {
      console.error('音频加载失败:', error)
    }

    try {
      greenAudioRef.current = preloadAudio("/yahaha.mp3")
      yellowAudioRef.current = preloadAudio("/yahaha.mp3")
      transitionAudioRef.current = preloadAudio("/korok-pop.mp3")

      // 设置音量
      if (greenAudioRef.current) greenAudioRef.current.volume = 0.7
      if (yellowAudioRef.current) yellowAudioRef.current.volume = 0.7
      if (transitionAudioRef.current) transitionAudioRef.current.volume = 0.6

      if (greenAudioRef.current) {
        greenAudioRef.current.addEventListener('error', handleAudioError)
      }
      if (yellowAudioRef.current) {
        yellowAudioRef.current.addEventListener('error', handleAudioError)
      }
      if (transitionAudioRef.current) {
        transitionAudioRef.current.addEventListener('error', handleAudioError)
      }
    } catch (error) {
      console.error('初始化音频失败:', error)
    }

    return () => {
      // 清理音频资源
      if (greenAudioRef.current) {
        greenAudioRef.current.pause()
        greenAudioRef.current.removeEventListener('error', handleAudioError)
        greenAudioRef.current = null
      }
      if (yellowAudioRef.current) {
        yellowAudioRef.current.pause()
        yellowAudioRef.current.removeEventListener('error', handleAudioError)
        yellowAudioRef.current = null
      }
      if (transitionAudioRef.current) {
        transitionAudioRef.current.pause()
        transitionAudioRef.current.removeEventListener('error', handleAudioError)
        transitionAudioRef.current = null
      }
    }
  }, [])

  // 播放切换音效
  const playTransitionAudio = () => {
    if (transitionAudioRef.current) {
      transitionAudioRef.current.currentTime = 0
      transitionAudioRef.current.play().catch(error => {
        console.error('播放音效失败:', error)
      })
    }
  }

  // 播放绿色角色音效
  const playGreenAudio = () => {
    if (greenAudioRef.current && !greenAudioPlayed) {
      greenAudioRef.current.currentTime = 0
      greenAudioRef.current.play().catch(error => {
        console.error('播放绿色角色音效失败:', error)
      })
      setGreenAudioPlayed(true)

      // 重置状态，允许下次悬停时再次播放
      setTimeout(() => {
        setGreenAudioPlayed(false)
      }, 2000)
    }
  }

  // 播放黄色角色音效
  const playYellowAudio = () => {
    if (yellowAudioRef.current && !yellowAudioPlayed) {
      yellowAudioRef.current.currentTime = 0
      yellowAudioRef.current.play().catch(error => {
        console.error('播放黄色角色音效失败:', error)
      })
      setYellowAudioPlayed(true)

      // 重置状态，允许下次悬停时再次播放
      setTimeout(() => {
        setYellowAudioPlayed(false)
      }, 2000)
    }
  }

  const handleCharacterSelect = (character: Character) => {
    playTransitionAudio()
    setIsTransitioning(true)
    setRandomCharacterName(getRandomCharacterName())
    setTimeout(() => {
      setSelectedCharacter(character)
      setMessages([])
      setIsTransitioning(false)
    }, 500)
  }

  const handleBackToMenu = () => {
    playTransitionAudio()
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedCharacter(null)
      setIsTransitioning(false)
    }, 500)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedCharacter) return

    const newMessage: Message = {
      id: Date.now().toString(),
      character: selectedCharacter,
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: inputValue.trim()
            }
          ]
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || 'API 请求失败')
      }

      const otherCharacter = selectedCharacter === "green" ? "yellow" : "green"

      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        character: otherCharacter,
        content: data.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, replyMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      // 如果 API 调用失败，使用默认回复
      const otherCharacter = selectedCharacter === "green" ? "yellow" : "green"
      const responses = [
        "呀哈哈！你好呀！",
        "森林里今天天气真好呢～",
        "你找到宝箱了吗？",
        "呀哈哈哈～我藏得很好吧！",
        "森林的秘密可多着呢！",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        character: otherCharacter,
        content: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, replyMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 添加动画CSS样式
  const animations = `
  @keyframes breathe {
    0%, 100% { 
      transform: scale(1) translateY(0px);
    }
    50% { 
      transform: scale(1.02) translateY(-2px);
    }
  }

  @keyframes gentleWind {
    0% {
      transform: translateX(0) translateY(0) scale(1) skewX(0deg);
    }
    15% {
      transform: translateX(-3px) translateY(-1.5px) scale(1.003) skewX(-0.3deg);
    }
    30% {
      transform: translateX(2px) translateY(1px) scale(0.998) skewX(0.2deg);
    }
    45% {
      transform: translateX(-2.5px) translateY(-1px) scale(1.002) skewX(-0.2deg);
    }
    60% {
      transform: translateX(3px) translateY(1.5px) scale(0.997) skewX(0.3deg);
    }
    75% {
      transform: translateX(-1.5px) translateY(-0.5px) scale(1.001) skewX(-0.1deg);
    }
    90% {
      transform: translateX(1px) translateY(1px) scale(0.999) skewX(0.1deg);
    }
    100% {
      transform: translateX(0) translateY(0) scale(1) skewX(0deg);
    }
  }

  @keyframes characterHover {
    0%, 100% {
      transform: scale(1.05) translateY(0px) rotate(0deg);
    }
    25% {
      transform: scale(1.06) translateY(-2px) rotate(0.5deg);
    }
    50% {
      transform: scale(1.07) translateY(-1px) rotate(-0.3deg);
    }
    75% {
      transform: scale(1.055) translateY(-3px) rotate(0.2deg);
    }
  }

  @keyframes strongSunlight1 {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1) translateX(0) translateY(0);
    }
    20% {
      opacity: 0.8;
      transform: scale(1.3) translateX(8px) translateY(-6px);
    }
    40% {
      opacity: 0.6;
      transform: scale(0.8) translateX(-5px) translateY(4px);
    }
    60% {
      opacity: 0.9;
      transform: scale(1.2) translateX(6px) translateY(-3px);
    }
    80% {
      opacity: 0.7;
      transform: scale(1.1) translateX(-3px) translateY(2px);
    }
  }

  @keyframes strongSunlight2 {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1) translateX(0) translateY(0);
    }
    25% {
      opacity: 0.9;
      transform: scale(1.4) translateX(-7px) translateY(5px);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.7) translateX(9px) translateY(-4px);
    }
    75% {
      opacity: 0.8;
      transform: scale(1.25) translateX(-2px) translateY(3px);
    }
  }

  @keyframes strongSunlight3 {
    0%, 100% {
      opacity: 0.4;
      transform: scale(1) translateX(0) translateY(0);
    }
    30% {
      opacity: 0.7;
      transform: scale(1.5) translateX(10px) translateY(-8px);
    }
    60% {
      opacity: 0.9;
      transform: scale(0.6) translateX(-6px) translateY(7px);
    }
    90% {
      opacity: 0.5;
      transform: scale(1.3) translateX(4px) translateY(-2px);
    }
  }

  @keyframes intenseDapple {
    0%, 100% {
      opacity: 0.2;
      filter: blur(6px);
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      filter: blur(2px);
      transform: scale(1.1);
    }
  }

  @keyframes fadeTransition {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes borderGlow {
    0%, 100% {
      border-color: rgba(34, 197, 94, 0.3);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
    }
    50% {
      border-color: rgba(34, 197, 94, 0.6);
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.4);
    }
  }

  @keyframes borderSunlight {
    0%, 100% {
      box-shadow: 
        0 0 20px rgba(34, 197, 94, 0.2),
        inset 0 0 30px rgba(255, 255, 0, 0.1);
    }
    25% {
      box-shadow: 
        0 0 30px rgba(34, 197, 94, 0.3),
        inset 0 0 40px rgba(255, 255, 0, 0.2);
    }
    50% {
      box-shadow: 
        0 0 40px rgba(34, 197, 94, 0.4),
        inset 0 0 50px rgba(255, 255, 0, 0.15);
    }
    75% {
      box-shadow: 
        0 0 35px rgba(34, 197, 94, 0.35),
        inset 0 0 45px rgba(255, 255, 0, 0.18);
    }
  }
`

  if (!selectedCharacter) {
    return (
      <>
        <style jsx>{animations}</style>
        <div
          className={`min-h-screen relative overflow-hidden ${isTransitioning ? "animate-[fadeTransition_1s_ease-in-out]" : ""}`}
        >
          {/* 新背景图 - 减小微风起伏感 */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full animate-[gentleWind_15s_ease-in-out_infinite]"
            style={{
              backgroundImage: "url(/korok-forest-bg.png)",
            }}
          />

          {/* 加强的阳光斑驳光斑效果 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 大光斑 - 加强版 */}
            <div className="absolute top-[10%] left-[15%] w-48 h-48 bg-yellow-200/50 rounded-full blur-2xl animate-[strongSunlight1_6s_ease-in-out_infinite]" />
            <div className="absolute top-[55%] right-[20%] w-56 h-56 bg-yellow-300/45 rounded-full blur-3xl animate-[strongSunlight2_8s_ease-in-out_infinite]" />
            <div className="absolute bottom-[25%] left-[55%] w-52 h-52 bg-yellow-100/55 rounded-full blur-2xl animate-[strongSunlight3_7s_ease-in-out_infinite]" />

            {/* 中等光斑 - 加强版 */}
            <div className="absolute top-[35%] left-[5%] w-36 h-36 bg-yellow-200/60 rounded-full blur-xl animate-[strongSunlight2_7s_ease-in-out_infinite_1s]" />
            <div className="absolute top-[20%] right-[10%] w-40 h-40 bg-yellow-300/50 rounded-full blur-2xl animate-[strongSunlight1_9s_ease-in-out_infinite_0.5s]" />
            <div className="absolute bottom-[40%] right-[35%] w-32 h-32 bg-yellow-100/65 rounded-full blur-xl animate-[strongSunlight3_5s_ease-in-out_infinite_2s]" />
            <div className="absolute top-[75%] left-[25%] w-44 h-44 bg-yellow-200/40 rounded-full blur-2xl animate-[strongSunlight1_10s_ease-in-out_infinite_1.5s]" />

            {/* 小光斑 - 更多更亮 */}
            <div className="absolute top-[65%] left-[25%] w-24 h-24 bg-yellow-200/70 rounded-full blur-lg animate-[strongSunlight1_4s_ease-in-out_infinite_1s]" />
            <div className="absolute top-[30%] right-[45%] w-28 h-28 bg-yellow-300/60 rounded-full blur-xl animate-[strongSunlight2_6s_ease-in-out_infinite_0.3s]" />
            <div className="absolute bottom-[55%] left-[40%] w-20 h-20 bg-yellow-100/75 rounded-full blur-md animate-[strongSunlight3_5s_ease-in-out_infinite_1.8s]" />
            <div className="absolute top-[45%] left-[70%] w-32 h-32 bg-yellow-200/55 rounded-full blur-xl animate-[strongSunlight1_8s_ease-in-out_infinite_2.5s]" />
            <div className="absolute bottom-[70%] right-[60%] w-26 h-26 bg-yellow-300/65 rounded-full blur-lg animate-[strongSunlight2_7s_ease-in-out_infinite_0.8s]" />

            {/* 加强的斑驳光影层 */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-300/25 animate-[intenseDapple_10s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-yellow-100/30 to-transparent animate-[intenseDapple_15s_ease-in-out_infinite_3s]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/15 via-transparent to-yellow-200/20 animate-[intenseDapple_12s_ease-in-out_infinite_1.5s]" />
          </div>

          {/* 绿色科洛克角色按键 - 绿色呀哈哈 */}
          <button
            onClick={() => handleCharacterSelect("green")}
            onMouseEnter={playGreenAudio}
            className="absolute left-[18%] top-[50%] z-10 rounded-3xl overflow-hidden group transition-all duration-300"
            style={{
              transform: "translate(-50%, -50%)",
              width: "960px",
              height: "1280px",
            }}
          >
            <div className="animate-[breathe_4s_ease-in-out_infinite] group-hover:animate-[characterHover_0.6s_ease-in-out_infinite] w-full h-full">
              <div className="w-full h-full">
                {/* 绿色角色图片 */}
                <div
                  className="w-full h-full bg-contain bg-no-repeat bg-center transition-all duration-300"
                  style={{
                    backgroundImage: "url(/korok-characters.png)",
                    backgroundPosition: "0% 50%",
                    backgroundSize: "1920px 1280px",
                  }}
                />
              </div>
            </div>
          </button>

          {/* 黄色科洛克角色按键 - 黄色呀哈哈 */}
          <button
            onClick={() => handleCharacterSelect("yellow")}
            onMouseEnter={playYellowAudio}
            className="absolute right-[18%] top-[60%] z-10 rounded-3xl overflow-hidden group transition-all duration-300"
            style={{
              transform: "translate(50%, -50%)",
              width: "1120px",
              height: "800px",
            }}
          >
            <div className="animate-[breathe_5s_ease-in-out_infinite_2s] group-hover:animate-[characterHover_0.6s_ease-in-out_infinite] w-full h-full">
              <div className="w-full h-full">
                {/* 黄色角色图片 */}
                <div
                  className="w-full h-full bg-contain bg-no-repeat bg-center transition-all duration-300"
                  style={{
                    backgroundImage: "url(/korok-characters.png)",
                    backgroundPosition: "100% 50%",
                    backgroundSize: "2240px 800px",
                  }}
                />
              </div>
            </div>
          </button>
        </div>
      </>
    )
  }

  // 正确的角色名字映射：绿色角色是绿色呀哈哈，黄色角色是黄色呀哈哈
  const characterName = selectedCharacter === "green" ? "绿色呀哈哈" : "黄色呀哈哈"

  return (
    <>
      <style jsx>{animations}</style>
      <div
        className={`min-h-screen relative flex flex-col ${isTransitioning ? "animate-[fadeTransition_1s_ease-in-out]" : ""}`}
      >
        {/* 二级菜单背景 - 移除晃动效果 */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
            style={{
              backgroundImage: "url(/korok-forest-bg.png)",
              filter: "brightness(0.7)",
            }}
          />

          {/* 聊天界面的加强阳光斑驳效果 */}
          <div className="absolute inset-0 pointer-events-none opacity-70">
            <div className="absolute top-[15%] left-[10%] w-36 h-36 bg-yellow-200/40 rounded-full blur-xl animate-[strongSunlight1_8s_ease-in-out_infinite]" />
            <div className="absolute top-[65%] right-[15%] w-40 h-40 bg-yellow-300/35 rounded-full blur-2xl animate-[strongSunlight2_12s_ease-in-out_infinite]" />
            <div className="absolute bottom-[35%] left-[45%] w-32 h-32 bg-yellow-100/45 rounded-full blur-xl animate-[strongSunlight3_10s_ease-in-out_infinite]" />
            <div className="absolute top-[40%] right-[50%] w-28 h-28 bg-yellow-200/50 rounded-full blur-lg animate-[strongSunlight1_6s_ease-in-out_infinite_1s]" />
          </div>
        </div>

        {/* 顶部导航栏 - 显示呀哈哈的名字 */}
        <div className="relative z-10 bg-green-800/80 backdrop-blur-sm border-b-2 border-green-600/40 p-4 flex items-center gap-4 animate-[borderSunlight_8s_ease-in-out_infinite]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMenu}
            className="text-green-100 hover:bg-green-700/50 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-green-100">{characterName}</h1>
          </div>
        </div>

        {/* 聊天消息区域 - 修正左右显示 */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 border-l-2 border-r-2 border-green-600/30 bg-black/10 backdrop-blur-sm animate-[borderGlow_6s_ease-in-out_infinite]">
          {messages.length === 0 && (
            <div className="text-center text-green-200/70 py-8">
              <p>开始与 {characterName} 对话吧！</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.character === selectedCharacter ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* 头像框 */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                    message.character === "green"
                      ? "bg-green-500 text-green-900 border-green-400"
                      : "bg-yellow-500 text-yellow-900 border-yellow-400"
                  }`}
                >
                  {message.character === "green" ? "🌿" : "⭐"}
                </div>
                <span
                  className={`text-xs font-medium ${
                    message.character === "green" ? "text-green-300" : "text-yellow-300"
                  }`}
                >
                  {message.character === selectedCharacter ? randomCharacterName : characterName}
                </span>
              </div>

              {/* 消息气泡 */}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl border-2 ${
                  message.character === selectedCharacter
                    ? message.character === "green"
                      ? "bg-green-600/90 text-green-50 rounded-br-sm border-green-400/50 backdrop-blur-sm"
                      : "bg-yellow-600/90 text-yellow-50 rounded-br-sm border-yellow-400/50 backdrop-blur-sm"
                    : message.character === "green"
                      ? "bg-green-500/90 text-green-900 rounded-bl-sm border-green-400/50 backdrop-blur-sm"
                      : "bg-yellow-500/90 text-yellow-900 rounded-bl-sm border-yellow-400/50 backdrop-blur-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 输入区域 - 添加透明和光效边框 */}
        <div className="relative z-10 bg-green-800/80 backdrop-blur-sm border-t-2 border-green-600/40 p-4 animate-[borderSunlight_8s_ease-in-out_infinite]">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="flex-1 bg-green-700/40 border-green-600/50 text-green-100 placeholder:text-green-300/70 focus:border-green-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-green-600 hover:bg-green-500 text-green-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-green-100 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

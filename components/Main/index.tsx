"use client"

import { useState } from "react"
import TextInput from "@/components/TextInput"
import FileUpload from "@/components/FileUpload"
import AudioInput from "@/components/AudioInput"
import "./styles.css"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { handleTextUpload } from "@/telegram-querymind/src/bot"
type InputType = "text" | "file" | "audio"

export const MainComponent=() =>{
  const [selectedType, setSelectedType] = useState<InputType>("text")
  const [isProcessing, setIsProcessing] = useState(false)
  const [hovered, setHovered] = useState(false);
  const router=useRouter();

  const handleDataSubmit = async (data: any, fileType: string) => {
    setIsProcessing(true)
    try {
     if(fileType==="text"){
      await handleTextUpload(data)
     }else if(fileType==="file"){
      
     }
    } catch (error) {
      console.error("Error storing data:", error)
     
    } finally {
      setIsProcessing(false)
    }
  }

  const inputOptions = [
    { value: "text", label: "💬 Text Message", icon: "💬" },
    { value: "file", label: "📁 File Upload", icon: "📁" },
    { value: "audio", label: "🎤 Audio Recording", icon: "🎤" },
  ]

  return (
    <div className="app-container">
      <div className="chat-interface">
        <div className="chat-header">
          <div className="header-content">
            <h1 className="app-title">Query Mind Assistant</h1>
            <div className="app-title" 
             style={{
              color: hovered ? "#ff8c00" : "orange",
              transition: "color 0.2s ease",
              cursor:"pointer"
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={()=>{
              router.push('/Chat')
            }}
            >
              Chat
            </div>
            <div className="input-selector">
              <label htmlFor="input-type" className="selector-label">
                Input Type:
              </label>
              <select
                id="input-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as InputType)}
                className="type-dropdown"
                disabled={isProcessing}
              >
                {inputOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="interface-wrapper">
        <div className="messages-container">
            <div className="welcome-content">
              <div className="imageContainer">
              <Image className="welcome-icon" src={"/queryMind.png"} height={35} width={35} alt="iamge"/>
              </div>
              <h2>Welcome to QueryMind</h2>
              <p>Choose your input method above and start interacting with the AI.</p>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">💬</span>
                  <span>Text conversations</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📁</span>
                  <span>File analysis</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎤</span>
                  <span>Voice interactions</span>
                </div>
              </div>
            </div>
        </div>
        <div className="input-area">
          <div className="input-container">
            {selectedType === "text" && <TextInput onSubmit={handleDataSubmit} isProcessing={isProcessing} />}
            {selectedType === "file" && <FileUpload onSubmit={handleDataSubmit} isProcessing={isProcessing} />}
            {selectedType === "audio" && <AudioInput onSubmit={handleDataSubmit} isProcessing={isProcessing} />}
          </div>
        </div>
        </div>
        
      </div>
    </div>
  )
}

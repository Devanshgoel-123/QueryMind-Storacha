"use client"

import type React from "react"

import { useState } from "react"
import "./styles.css"

interface TextInputProps {
  onSubmit: (data: string, fileType: string) => Promise<void>
  isProcessing: boolean
}

export default function TextInput({ onSubmit, isProcessing }: TextInputProps) {
  const [text, setText] = useState("")
  const [showAudio, setShowAudio] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      await onSubmit(text, "text")
      setText("")
    }
  }

  return (
    <div className="textWrapper">
        <div className="flex justify-center">
          <h2 className="text-5xl font-semibold text-orange-300">Text Input</h2>
        </div>

        {showAudio && (
          <div className="audio-section mb-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-orange-500/30">
              <p className="text-orange-300 mb-2">Audio Input Mode</p>
              <button className="btn-primary">Start Recording</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="TextContainer">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your message or question here..."
            className="input-field "
            disabled={isProcessing}
          />

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!text.trim() || isProcessing}
              className="disabled:opacity-75 disabled:cursor-not-allowed submitButton"
            >
              {isProcessing ? "Processing..." : "Submit Text"}
            </button>
          </div>
        </form>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import "./styles.css"

interface AudioInputProps {
  onSubmit: (data: Blob, fileType: string) => Promise<void>
  isProcessing: boolean
}

export default function AudioInput({ onSubmit, isProcessing }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (audioBlob) {
      await onSubmit(audioBlob, "audio/wav")
      setAudioBlob(null)
      setRecordingTime(0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
  <>
   <h2 className="text-4xl font-semibold text-orange-300 mb-6">Audio Input</h2>

<form onSubmit={handleSubmit} className="formContainer">
    <div className="recording-container">
    
        <div className="mic-icon">
          <span className="mic-span">
          🎤
            </span>
            </div>
        {isRecording && <div className="pulse-ring"></div>}

      <div className="submitButton">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="btn-primary record-btn"
            disabled={isProcessing}
          >
            Start Recording
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="text-orange-300 text-lg font-mono">{formatTime(recordingTime)}</div>
            <button type="button" onClick={stopRecording} className="btn-secondary stop-btn">
              Stop Recording
            </button>
          </div>
        )}
      </div>
    </div>

  {audioBlob && (
    <div className="audio-preview">
      <div className="bg-gray-800 p-4 rounded-lg border border-orange-500/30">
        <p className="text-orange-300 mb-3">Recording Complete</p>
        <audio controls className="w-full audio-player">
          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  )}

  {audioBlob && <div className="buttonWrapper">
      <button
        type="button"
        onClick={() => {
          setAudioBlob(null)
          setRecordingTime(0)
        }}
        className="submitButton"
      >
        Clear Recording
      </button>
    <button
      type="submit"
      disabled={!audioBlob || isProcessing}
      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed submitButton"
    >
      {isProcessing ? "Processing..." : "Submit Audio"}
    </button>
  </div>}
</form>
  </>
       
  )
}

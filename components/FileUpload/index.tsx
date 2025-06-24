"use client"

import type React from "react"

import { useState, useRef } from "react"
import "./styles.css"

interface FileUploadProps {
  onSubmit: (data: File, fileType: string) => Promise<void>
  isProcessing: boolean
}

export default function FileUpload({ onSubmit, isProcessing }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      await onSubmit(selectedFile, selectedFile.type)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="file-upload-container">
        <h2 className="text-4xl flex  font-semibold text-orange-300 mb-6 justify-center">File Upload</h2>

        <form onSubmit={handleSubmit} className="TextContainer">
          <div
            className={`drop-zone ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="drop-zone-content">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-lg text-orange-300 mb-2">{selectedFile ? "File Selected" : "Drop your file here"}</p>
              <p className="text-gray-400">{selectedFile ? "Click to change file" : "or click to browse"}</p>
            </div>
          </div>

          {selectedFile && (
            <div className="file-info">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-orange-500/30">
                <div>
                  <p className="text-orange-300 font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown type"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="text-red-400 hover:text-red-300 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex w-[100%] justify-center">
            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed submitButton"
            >
              {isProcessing ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>

    </div>
  )
}

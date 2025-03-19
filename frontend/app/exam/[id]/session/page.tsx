"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useExam } from '@/contexts/ExamContext'

interface MonitoringStatus {
  phone_detected: boolean
  face_away_detected: boolean
  no_face_detected: boolean
  multiple_faces_detected: boolean
  honesty_score: number
  frame: number
  error?: string
}

export default function ExamSession() {
  const { examState } = useExam()
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({
    phone_detected: false,
    face_away_detected: false,
    no_face_detected: false,
    multiple_faces_detected: false,
    honesty_score: 100,
    frame: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    console.log("ExamSession useEffect")
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        wsRef.current = new WebSocket('ws://localhost:8000/ws')

        wsRef.current.onopen = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          const intervalId = setInterval(() => {
            if (videoRef.current?.readyState === 4 && ctx) {
              canvas.width = videoRef.current.videoWidth
              canvas.height = videoRef.current.videoHeight
              ctx.drawImage(videoRef.current, 0, 0)

              canvas.toBlob(blob => {
                if (blob) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    const base64data = (reader.result as string).split(',')[1]
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(base64data)
                    }
                  }
                  reader.readAsDataURL(blob)
                }
              }, 'image/jpeg')
            }
          }, 100)

          wsRef.current.onclose = () => clearInterval(intervalId)
        }

        wsRef.current.onmessage = (event) => {
          const result = JSON.parse(event.data)
          setMonitoringStatus(result)
        }
      })
      .catch(err => {
        console.error("Webcam access denied or error:", err)
        setMonitoringStatus(prev => ({
          ...prev,
          error: "❌ Webcam access denied."
        }))
      })

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const {
    phone_detected,
    face_away_detected,
    no_face_detected,
    multiple_faces_detected,
    honesty_score,
    frame,
    error
  } = monitoringStatus

  const issuesDetected = phone_detected || face_away_detected || no_face_detected || multiple_faces_detected

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`p-4 ${issuesDetected ? 'bg-red-100' : 'bg-green-100'}`}>
        {error ? error : (
          <>
            Frame: {frame} | Honesty Score: {honesty_score}%
            {issuesDetected ? (
              <span>
                {' '}| ⚠️
                {phone_detected && " 📱 Phone"}
                {face_away_detected && " 🙈 Face Away"}
                {no_face_detected && " 😶 No Face"}
                {multiple_faces_detected && " 👥 Multiple Faces"}
              </span>
            ) : " | ✅ All Clear"}
          </>
        )}
      </div>

      <div className="relative w-full max-w-md mx-auto mt-4">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="w-full rounded-lg shadow-lg"
        />
      </div>

      <div className="mt-4 text-center">
        {issuesDetected && (
          <div className="text-red-500">
            {phone_detected && "📱 Phone "}
            {face_away_detected && "🙈 Face Away "}
            {no_face_detected && "😶 No Face "}
            {multiple_faces_detected && "👥 Multiple Faces "}
          </div>
        )}
        <div>Honesty Score: {honesty_score}%</div>
      </div>

      <div className="flex-1 p-6">
        {/* Exam questions will go here */}
      </div>
    </div>
  )
} 
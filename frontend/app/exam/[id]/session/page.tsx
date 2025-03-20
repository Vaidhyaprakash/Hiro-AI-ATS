"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useExam } from '@/contexts/ExamContext'
import Editor from "@monaco-editor/react"
import axios from 'axios'

interface MonitoringStatus {
  phone_detected: boolean
  face_away_detected: boolean
  no_face_detected: boolean
  multiple_faces_detected: boolean
  honesty_score: number
  frame: number
  error?: string
}

interface TestCase {
  input: string
  expectedOutput: string
}

export default function ExamSession() {
  const { examState } = useExam()
  const [code, setCode] = useState("")
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "5", expectedOutput: "120" }, // Example test case for factorial
    { input: "3", expectedOutput: "6" }
  ])
  const [results, setResults] = useState<{passed: boolean, output: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleEditorChange = (value: string | undefined) => {
    if (value) setCode(value)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const response = await axios.post('http://localhost:8000/api/submit-code', {
        code,
        testCases,
        examId: examState.examId
      })
      
      setResults(response.data.results)
      
      // Calculate and send score
      const passedTests = response.data.results.filter((r: any) => r.passed).length
      const totalScore = (passedTests / testCases.length) * 100
      
      await axios.post('http://localhost:8000/api/submit-score', {
        examId: examState.examId,
        score: totalScore,
        honestyScore: monitoringStatus.honesty_score
      })
      
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    console.log("ExamSession useEffect")
    let intervalId: NodeJS.Timeout | undefined

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        const ws = new WebSocket('ws://localhost:8000/ws')
        wsRef.current = ws

        ws.onopen = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          intervalId = setInterval(() => {
            if (videoRef.current?.readyState === 4 && ctx) {
              canvas.width = videoRef.current.videoWidth
              canvas.height = videoRef.current.videoHeight
              ctx.drawImage(videoRef.current, 0, 0)

              canvas.toBlob(blob => {
                if (blob && ws.readyState === WebSocket.OPEN) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    const base64data = (reader.result as string).split(',')[1]
                    ws.send(base64data)
                  }
                  reader.readAsDataURL(blob)
                }
              }, 'image/jpeg')
            }
          }, 100)
        }

        ws.onclose = () => {
          if (intervalId) {
            clearInterval(intervalId)
          }
        }

        ws.onmessage = (event) => {
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
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
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

      <div className="flex">
        {/* Video feed */}
        <div className="w-1/4 p-4">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full rounded-lg shadow-lg"
          />
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
        </div>

        {/* Code editor and test cases */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Problem: Calculate Factorial</h2>
            <p className="text-gray-700">
              Write a function that calculates the factorial of a given number.
              The function should take a single integer as input and return the factorial of that number.
            </p>
          </div>

          <div className="mb-4 h-[500px]">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
              }}
            />
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Test Cases:</h3>
            <div className="space-y-2">
              {testCases.map((testCase, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 bg-gray-100 rounded">
                  <div>Input: {testCase.input}</div>
                  <div>Expected: {testCase.expectedOutput}</div>
                  {results[index] && (
                    <div className={results[index].passed ? "text-green-500" : "text-red-500"}>
                      {results[index].passed ? "✅ Passed" : "❌ Failed"}
                      {!results[index].passed && ` (Got: ${results[index].output})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Solution"}
          </button>
        </div>
      </div>
    </div>
  )
} 
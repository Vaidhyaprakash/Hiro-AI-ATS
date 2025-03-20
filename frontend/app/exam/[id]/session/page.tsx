"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useExam } from '@/contexts/ExamContext'
import Editor from "@monaco-editor/react"
import axios from 'axios'
import { useParams } from 'next/navigation'

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
  hidden?: boolean
}

interface ProblemDetails {
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  examples: { input: string, output: string, explanation: string }[]
  constraints: string[]
}

const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python', template: 'def solution(n):\n    # Write your code here\n    pass' },
  { id: 'javascript', name: 'JavaScript', template: 'function solution(n) {\n    // Write your code here\n}' },
  { id: 'java', name: 'Java', template: 'class Solution {\n    public int solution(int n) {\n        // Write your code here\n        return 0;\n    }\n}' },
]

const SAMPLE_PROBLEM: ProblemDetails = {
  title: 'Calculate Factorial',
  difficulty: 'Easy',
  description: 'Write a function that calculates the factorial of a given number n. The factorial of a non-negative integer n is the product of all positive integers less than or equal to n.',
  examples: [
    {
      input: '5',
      output: '120',
      explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120'
    },
    {
      input: '3',
      output: '6',
      explanation: '3! = 3 × 2 × 1 = 6'
    }
  ],
  constraints: [
    '0 ≤ n ≤ 12',
    'Input is always a valid integer'
  ]
}

export default function ExamSession() {
  const { examState } = useExam()
  const params = useParams()
  const candidateId = params.id
  const [language, setLanguage] = useState(SUPPORTED_LANGUAGES[0])
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].template)
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "5", expectedOutput: "120", hidden: false },
    { input: "3", expectedOutput: "6", hidden: false },
    { input: "0", expectedOutput: "1", hidden: true },
    { input: "10", expectedOutput: "3628800", hidden: true }
  ])
  const [results, setResults] = useState<{passed: boolean, output: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description')
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

  const handleLanguageChange = (langId: string) => {
    const newLang = SUPPORTED_LANGUAGES.find(l => l.id === langId)
    if (newLang) {
      setLanguage(newLang)
      setCode(newLang.template)
    }
  }

  const handleRunTests = async () => {
    try {
      setIsRunning(true)
      const response = await axios.post('http://localhost:8000/api/submit-code', {
        code,
        testCases: testCases.filter(tc => !tc.hidden),
        examId: examState.examId
      })
      setResults(response.data.results)
    } catch (error) {
      console.error('Test run error:', error)
    } finally {
      setIsRunning(false)
    }
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
      
      const passedTests = response.data.results.filter((r: any) => r.passed).length
      const totalScore = (passedTests / testCases.length) * 100
      
      await axios.post('http://localhost:8000/api/submit-score', {
        assessmentId: examState.examId,
        candidateId: candidateId,
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
    let intervalId: ReturnType<typeof setInterval> | undefined
    let isConnected = false
    let frameCount = 0
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5

    const connectWebSocket = () => {
      console.log('Attempting WebSocket connection...')
      const ws = new WebSocket(`ws://localhost:8000/ws/${candidateId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        isConnected = true
        reconnectAttempts = 0
        startSendingFrames()
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed with code:', event.code, 'reason:', event.reason)
        isConnected = false
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = undefined
        }

        // Try to reconnect with backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)
          console.log(`Attempting reconnect in ${backoffTime}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
          setTimeout(connectWebSocket, backoffTime)
          reconnectAttempts++
        } else {
          console.error('Max reconnection attempts reached')
          setMonitoringStatus(prev => ({
            ...prev,
            error: "❌ Connection failed after multiple attempts."
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setMonitoringStatus(prev => ({
          ...prev,
          error: "❌ Connection error. Retrying..."
        }))
      }

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data)
          console.log('Received frame data:', result)
          setMonitoringStatus(result)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      return ws
    }

    const startSendingFrames = () => {
      if (!videoRef.current || !isConnected || intervalId) {
        console.log('Cannot start sending frames:', {
          videoReady: !!videoRef.current,
          isConnected,
          hasInterval: !!intervalId
        })
        return
      }

      console.log('Starting to send frames...')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return
      }

      // Wait for video to be ready
      const waitForVideo = () => {
        if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
          // Set initial canvas size
          if (videoRef.current) {
            canvas.width = videoRef.current.videoWidth || 640
            canvas.height = videoRef.current.videoHeight || 480

            // Start the interval
            intervalId = setInterval(() => {
              if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                console.log('Skipping frame:', {
                  videoReady: !!videoRef.current,
                  wsReady: !!wsRef.current,
                  wsState: wsRef.current?.readyState
                })
                return
              }

              try {
                // Update canvas size if video dimensions change
                if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
                  canvas.width = videoRef.current.videoWidth
                  canvas.height = videoRef.current.videoHeight
                }

                // Draw the current video frame
                ctx.drawImage(videoRef.current, 0, 0)

                // Convert to blob and send
                canvas.toBlob(
                  (blob) => {
                    if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          const base64data = reader.result.split(',')[1]
                          wsRef.current?.send(base64data)
                          frameCount++
                          console.log('Frame sent:', frameCount)
                        }
                      }
                      reader.readAsDataURL(blob)
                    }
                  },
                  'image/jpeg',
                  0.8
                )
              } catch (error) {
                console.error('Error sending frame:', error)
              }
            }, 100) // Send frame every 100ms
          }
        } else {
          // Wait for video to be ready
          console.log('Waiting for video data...')
          setTimeout(waitForVideo, 100)
        }
      }

      waitForVideo()
    }

    // Start the video stream
    console.log('Requesting video stream...')
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 10 }
        } 
      })
      .then(stream => {
        console.log('Video stream obtained')
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded')
            videoRef.current?.play()
              .then(() => {
                console.log('Video started playing')
                connectWebSocket()
              })
              .catch(error => {
                console.error('Error playing video:', error)
                setMonitoringStatus(prev => ({
                  ...prev,
                  error: "❌ Failed to start video."
                }))
              })
          }
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
      console.log('Cleaning up resources...')
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
  }, [candidateId])

  useEffect(() => {
    // Send final honesty score when component unmounts
    const handleBeforeUnload = async () => {
      if (monitoringStatus.honesty_score !== undefined) {
        try {
          await axios.post('http://localhost:8000/api/submit-score', {
            assessmentId: examState.examId,
            candidateId: candidateId,
            score: 0, // This will be updated when actual score is submitted
            honestyScore: monitoringStatus.honesty_score
          })
        } catch (error) {
          console.error('Failed to save honesty score:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [candidateId, monitoringStatus.honesty_score])

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
      {/* Monitoring Status Bar */}
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

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '320px',
          height: '240px',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          transform: 'scaleX(-1)' // Mirror the video
        }}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Problem Description */}
        <div className="w-[400px] border-r border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{SAMPLE_PROBLEM.title}</h1>
            <span className={`px-3 py-1 rounded text-sm font-medium
              ${SAMPLE_PROBLEM.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                SAMPLE_PROBLEM.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}`}>
              {SAMPLE_PROBLEM.difficulty}
            </span>
          </div>
          
          <div className="prose max-w-none">
            <p>{SAMPLE_PROBLEM.description}</p>
            
            <h3 className="font-bold mt-6 mb-2">Examples:</h3>
            {SAMPLE_PROBLEM.examples.map((example, idx) => (
              <div key={idx} className="mb-4 bg-gray-50 p-4 rounded">
                <p><strong>Input:</strong> {example.input}</p>
                <p><strong>Output:</strong> {example.output}</p>
                <p><strong>Explanation:</strong> {example.explanation}</p>
              </div>
            ))}

            <h3 className="font-bold mt-6 mb-2">Constraints:</h3>
            <ul className="list-disc pl-5">
              {SAMPLE_PROBLEM.constraints.map((constraint, idx) => (
                <li key={idx}>{constraint}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel - Editor and Test Cases */}
        <div className="flex-1 flex flex-col">
          {/* Language Selector and Actions */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <select
              value={language.id}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            
            <div className="flex gap-3">
              <button
                onClick={handleRunTests}
                disabled={isRunning}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                {isRunning ? "Running..." : "Run Tests"}
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language.id}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 4,
                insertSpaces: true,
              }}
            />
          </div>

          {/* Test Cases Panel */}
          <div className="h-[200px] border-t border-gray-200 overflow-y-auto">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-4 py-2 ${activeTab === 'description' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('description')}
              >
                Test Cases
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'submissions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('submissions')}
              >
                Submissions
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'description' ? (
                <div className="space-y-2">
                  {testCases.filter(tc => !tc.hidden).map((testCase, index) => (
                    <div key={index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div><strong>Input:</strong> {testCase.input}</div>
                        <div><strong>Expected:</strong> {testCase.expectedOutput}</div>
                      </div>
                      {results[index] && (
                        <div className={`flex items-center ${results[index].passed ? 'text-green-500' : 'text-red-500'}`}>
                          {results[index].passed ? (
                            <span>✅ Passed</span>
                          ) : (
                            <div>
                              <span>❌ Failed</span>
                              <div className="text-sm">Got: {results[index].output}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="text-sm text-gray-500 mt-2">
                    + {testCases.filter(tc => tc.hidden).length} hidden test cases will be run on submission
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Your previous submissions will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
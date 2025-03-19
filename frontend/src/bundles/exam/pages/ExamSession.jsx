import React, { useEffect, useRef, useState } from 'react';
import { useExam } from '../contexts/ExamContext';
import './ExamSession.css';

function ExamSession() {
  const { examState } = useExam();
  const [monitoringStatus, setMonitoringStatus] = useState({
    phone_detected: false,
    face_away_detected: false,
    no_face_detected: false,
    multiple_faces_detected: false,
    honesty_score: 100,
    frame: 0
  });

  const wsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    console.log("ExamSession useEffect");
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        wsRef.current = new WebSocket('ws://localhost:8000/ws');

        wsRef.current.onopen = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const intervalId = setInterval(() => {
            if (videoRef.current.readyState === 4) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);

              canvas.toBlob(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64data = reader.result.split(',')[1];
                  if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(base64data);
                  }
                };
                reader.readAsDataURL(blob);
              }, 'image/jpeg');
            }
          }, 100);

          wsRef.current.onclose = () => clearInterval(intervalId);
        };

        wsRef.current.onmessage = (event) => {
          const result = JSON.parse(event.data);
          setMonitoringStatus(result);
        };
      })
      .catch(err => {
        console.error("Webcam access denied or error:", err);
        setMonitoringStatus(prev => ({
          ...prev,
          error: "❌ Webcam access denied."
        }));
      });

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const {
    phone_detected,
    face_away_detected,
    no_face_detected,
    multiple_faces_detected,
    honesty_score,
    frame,
    error
  } = monitoringStatus;

  const issuesDetected = phone_detected || face_away_detected || no_face_detected || multiple_faces_detected;

  return (
    <div className="exam-session">
      <div className={`monitoring-status ${issuesDetected ? 'alert' : 'ok'}`}>
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

      <video ref={videoRef} autoPlay muted className="webcam-feed" />

      <div className="monitoring-status-text">
        {issuesDetected && (
          <>
            {phone_detected && "📱 Phone "}
            {face_away_detected && "🙈 Face Away "}
            {no_face_detected && "😶 No Face "}
            {multiple_faces_detected && "👥 Multiple Faces "}
          </>
        )}
        Honesty Score: {honesty_score}%
      </div>

      <div className="exam-content">
        {/* Exam questions go here */}
      </div>
    </div>
  );
}

export default ExamSession;

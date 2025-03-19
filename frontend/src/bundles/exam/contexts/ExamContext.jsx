import React, { createContext, useContext, useState, useEffect } from 'react';

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
  const [examState, setExamState] = useState({
    isActive: false,
    startTime: null,
    endTime: null,
    currentQuestion: 0,
    answers: {},
    tabSwitchCount: 0,
    lastTabSwitch: null,
    warnings: []
  });

  // Listen for tab switch events and track them
  useEffect(() => {
    if (!examState.isActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timestamp = new Date();

        setExamState(prev => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
          lastTabSwitch: timestamp,
          warnings: [
            ...prev.warnings,
            {
              type: 'tab_switch',
              timestamp,
              message: 'Candidate switched tabs/windows during exam'
            }
          ]
        }));

        // You would typically also log this to your backend
        logViolation({
          type: 'tab_switch',
          timestamp,
          examId: examState.examId
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examState.isActive, examState.examId]);

  // Mock function to log violations to backend
  const logViolation = (violationData) => {
    console.warn('Exam violation detected:', violationData);
    // In a real app, you would make an API call here
  };

  const startExam = (examId, duration) => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000); // duration in minutes

    setExamState({
      isActive: true,
      examId,
      startTime,
      endTime,
      currentQuestion: 0,
      answers: {},
      tabSwitchCount: 0,
      lastTabSwitch: null,
      warnings: []
    });
  };

  const endExam = (reason = 'completed') => {
    setExamState(prev => ({
      ...prev,
      isActive: false,
      endReason: reason
    }));
  };

  const saveAnswer = (questionId, answer) => {
    setExamState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const nextQuestion = () => {
    setExamState(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1
    }));
  };

  const previousQuestion = () => {
    setExamState(prev => ({
      ...prev,
      currentQuestion: Math.max(0, prev.currentQuestion - 1)
    }));
  };

  const submitExam = async () => {
    try {
      // In a real app, you would send the answers to your backend here
      console.log('Submitting exam answers:', examState.answers);
      endExam('submitted');
      return true;
    } catch (error) {
      console.error('Error submitting exam:', error);
      return false;
    }
  };

  const value = {
    ...examState,
    startExam,
    endExam,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitExam
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export default ExamContext; 
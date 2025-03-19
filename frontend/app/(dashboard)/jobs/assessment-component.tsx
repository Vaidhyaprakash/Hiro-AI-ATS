"use client"

import { Box, Dialog, DialogContent, DialogTitle, Flex, FormInput, Input, Text } from "@sparrowengg/twigs-react"
import { ArrowRight, ChevronRight, PlusCircleIcon, X } from "lucide-react"
import { useState, useEffect } from "react"

export function AssessmentComponent() {
  // State for steps and modal
  const [steps, setSteps] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStep, setNewStep] = useState({ title: '', description: '' })

  const initialSteps = [
    {
      id:'1',
      title: "Initial Screening",
      description: "Configure assessment questions and evaluation criteria for candidates.",
    },
    {
      id:'2',
      title: "Aptitude Test",
      description: "Configure assessment questions and evaluation criteria for candidates.",
    },
    {
      id:'3',
      title: "Technical Test",
      description: "Configure assessment questions and evaluation criteria for candidates.",
    }
  ]

  // Fetch steps from backend
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/assessment-steps')
        // const data = await response.json()
        // setSteps(data)
        
        // For now, use fallback data
        setSteps(initialSteps)
      } catch (error) {
        console.error('Error fetching steps:', error)
        setSteps(initialSteps)
      }
    }

    fetchSteps()
  }, [])

  // Handle adding new step
  const handleAddStep = async () => {
    try {
      const newStepData = {
        id: (steps.length + 1).toString(),
        ...newStep
      }

      // TODO: Replace with actual API call
      // await fetch('/api/assessment-steps', {
      //   method: 'POST',
      //   body: JSON.stringify(newStepData)
      // })

      // For now, update local state
      setSteps([...steps, newStepData])
      setIsModalOpen(false)
      setNewStep({ title: '', description: '' })
    } catch (error) {
      console.error('Error adding step:', error)
    }
  }

  return (
    <Flex css={{
      width: "100%",
      height: "100%",
      flexWrap: "wrap",
    }}
      gap="$6"
    >
      {steps.map((step, index) => (
        <Flex css={{
          alignItems: "center",
          gap: "$4",
        }}>
        <Flex key={step.id} gap="$4" css={{
          width: "240px",
          height: "100%",
          
          padding: "$4",
          flexDirection: "column",
          border: "1px solid $neutral200",
          borderRadius: "$roundedSm",
        }}>
          <Text as="h3">{step.title}</Text> 
          <Text as="p" css={{
            color:'$neutral600'
          }}>{step.description}</Text>
        </Flex>
          {index !== steps.length - 1 && <ArrowRight />}
          {index === steps.length - 1 && <Box
            onClick={() => setIsModalOpen(true)}
            css={{
            cursor: "pointer",
          }}>
            <PlusCircleIcon />
          </Box>}
        </Flex> 
      ))}

      {/* Basic Modal - Replace with your UI library's modal component */}
      {isModalOpen && (
        <Dialog open={isModalOpen}>
        <DialogContent css={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '$6',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            height: '360px',
            borderRadius: '$xl',
          }}>
            <DialogTitle css={{
              padding: "$12",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              
              <Text css={{
                fontSize: "$lg",
              }}>Add New Assessment Step</Text>
              <X onClick={() => setIsModalOpen(false)}/>
          </DialogTitle>
            <Flex flexDirection="column" gap="$4" css={{
            padding: "0 $12 $12 $12",
            }}>
              <FormInput type="text"
                size="lg"
                label="Title"
                value={newStep.title}
                onChange={(e: any) => setNewStep({ ...newStep, title: e.target.value })}
              />

              <FormInput type="text"
                size="lg"
                label="Description"
                value={newStep.description}
                onChange={(e: any) => setNewStep({ ...newStep, description: e.target.value })}
              />
            <Flex gap="$4">
              <button onClick={handleAddStep}>Add</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </Flex>
          </Flex>
        </DialogContent>
        </Dialog>
      )}
    </Flex>
  )
}

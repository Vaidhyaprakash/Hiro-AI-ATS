"use client"

import { Box, Button, Dialog, DialogContent, DialogTitle, Flex, FormInput, Input, Select, Text, Chip } from "@sparrowengg/twigs-react"
import { ArrowRight, PlusCircleIcon, X } from "lucide-react"
import { useState, useEffect } from "react"

// Define the Step interface
interface Step {
  id: string; // Added id property
  title: string;
  description?: string;
  assessmentType?: string; // Optional property
  difficulty?: number; // Optional property
  mcq?: number;
  openEnded?: number;
  code?: number;
  skills?: string[];
  type?: string;
}

export function AssessmentComponent() {
  // State for steps and modal
  const [steps, setSteps] = useState<Step[]>([]) // Specify the type for steps
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false) // Specify the type for modal state
  const [newStep, setNewStep] = useState<Step>({ id: '', title: '', description: '' }) // Specify the type for newStep
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const initialSteps: Step[] = [ // Specify the type for initialSteps
    {
      id: '1',
      title: "Initial Screening",
      type: 'initial_screening',
      difficulty: 1,
      skills: ['skill1', 'skill2', 'skill3'],
    },
    {
      id: '2',
      title: "Aptitude Test",
      type: 'aptitude_test',
      mcq: 10,
      openEnded: 10,
      difficulty: 2,
    },
    {
      id: '3',
      title: "Technical Test",
      type:'technical_test',
      mcq: 10,
      openEnded: 10,
      code: 10,
      difficulty: 3,
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

  // Modify handleAddStep to handle both add and edit
  const handleAddStep = async () => {
    try {
      if (isEditing) {
        // Update existing step
        const updatedSteps = steps.map(step => 
          step.id === newStep.id ? newStep : step
        )
        setSteps(updatedSteps)
      } else {
        // Add new step (existing logic)
        const newStepData: Step = {
          id: (steps.length + 1).toString(),
          ...newStep
        }
        setSteps([...steps, newStepData])
      }
      
      setIsModalOpen(false)
      setNewStep({ id: '', title: '', description: '' })
      setIsEditing(false)
      setSkills([])
    } catch (error) {
      console.error('Error handling step:', error)
    }
  }

  // Add handler for editing existing step
  const handleEditStep = (step: Step) => {
    setIsEditing(true)
    setNewStep(step)
    setSkills(step.skills || [])
    setIsModalOpen(true)
  }

  // Add skill handler
  const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      setSkills([...skills, currentSkill.trim()])
      setCurrentSkill('')
      // Update newStep with skills
      setNewStep({ ...newStep, skills: [...skills, currentSkill.trim()] })
    }
  }

  // Remove skill handler
  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove)
    setSkills(updatedSkills)
    setNewStep({ ...newStep, skills: updatedSkills })
  }

  const assessmentTypes = [
    {
      label: "Initial Screening",
      value: "initial_screening",
      description: "Screening questions to assess candidates' suitability for the job."
    },
    {
      label: "Aptitude Test",
      value: "aptitude_test",
      description: "Questions to evaluate candidates' basic skills and abilities."
    },
    {
      label: "Technical Test",
      value: "technical_test",
      description: "Questions to evaluate candidates' technical skills and knowledge."
    },
    {
      label: "Interview",
      value: "interview",
      description: "Questions to evaluate candidates' basic skills and abilities."
    },
  ]
  const typesOfQuestions = [
    {
      label: "MCQ",
      value: "mcq",
    },
    {
      label: "Open Ended",
      value: "open_ended",
    },
    {
      label: "Code",
      value: "code",
    },
  ]
  return (
    <Flex css={{
      width: "100%",
      height: "100%",
      flexWrap: "wrap",
    }}
      gap="$6"
    >
      {steps.map((step, index) => (
        <Flex key={step.id} css={{
          alignItems: "center",
          gap: "$4",
        }}>
          <Flex 
            gap="$4" 
            css={{
              width: "240px",
              height: "100%",
              padding: "$4",
              flexDirection: "column",
              border: "1px solid $neutral200",
              borderRadius: "$roundedSm",
              cursor: "pointer",
              '&:hover': {
                backgroundColor: '$neutral100'
              }
            }}
            onClick={() => handleEditStep(step)}
          >
            <Text as="h3">{step.title}</Text>
            <Text as="p" css={{
              color: '$neutral600'
            }}>{assessmentTypes.find(type => type.value === step.type)?.description}</Text>
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
            height: newStep.assessmentType === "aptitude_test" || newStep.assessmentType === "technical_test" ? "620px" : "480px",
            borderRadius: '$xl',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out',
          }}>
            <DialogTitle css={{
              padding: "$12",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <Text css={{
                fontSize: "$lg",
              }}>{isEditing ? 'Edit Assessment Step' : 'Add New Assessment Step'}</Text>
              <X onClick={() => setIsModalOpen(false)} />
            </DialogTitle>
            <Flex flexDirection="column" gap="$4" css={{
              height: '100%',
              overflowY: 'hidden',
              padding:"$12 $6 $6 $6"
            }}>
              <Flex flexDirection="column" gap="$4" css={{
                overflowY: 'auto',
                flex: 1,
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                'scrollbarWidth': 'none',
              }}>
                <Flex flexDirection="column" gap="$2">
                  <Text css={{
                    fontSize: '12px',
                    color: '$neutral800',
                    marginBottom: '0'
                  }}>
                    Assessment Type
                  </Text>
                  <Select
                    options={assessmentTypes}
                    placeholder="Select an Assessment Type"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setNewStep({ ...newStep, assessmentType: e.value })
                    }}
                  value={assessmentTypes.find(type => type.value === newStep.assessmentType)}
                  size="lg"
                  css={{
                    '.twigs-select__control': {
                      boxShadow: 'none !important',
                    },
                    '&:focus, &:hover, &:active, &:focus-visible': {
                      outline: 'none',
                      border: 'none',
                      boxShadow: 'none !important',
                    }
                  }}
                  />
                </Flex>
                <FormInput type="text"
                  size="lg"
                  label="Title"
                  value={newStep.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStep({ ...newStep, title: e.target.value })}
                  css={{
                    '&:focus, &:hover, &:active, &:focus-visible': {
                      outline: 'none',
                      boxShadow: 'none !important',
                    }
                  }}
                />

                <FormInput type="number"
                  size="lg"
                  label="Difficulty"
                  max={10}
                  min={1}
                  value={newStep.difficulty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStep({ ...newStep, difficulty: e.target.value ? Number(e.target.value) : undefined })}
                  css={{
                    '&:focus, &:hover, &:active, &:focus-visible': {
                      outline: 'none',
                      boxShadow: 'none !important',
                    }
                  }}
                />
                {(newStep.assessmentType === "aptitude_test" || newStep.assessmentType === "technical_test") && typesOfQuestions.map((type) => {
                  if (type.value === "code" && newStep.assessmentType !== "technical_test") {
                    return null
                  }
                  return (
                    <Flex key={type.value} css={{
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      '&>div':{
                        width:'48%'
                      }
                    }}>
                      <Select
                        value={typesOfQuestions.find(t => t.value === type.value)}
                        size="md"
                        isDisabled
                        css={{
                          '.twigs-select__control': {
                            boxShadow: 'none !important',
                          },
                          '&:focus, &:hover, &:active, &:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none !important',
                          }
                        }}
                      />
                      <FormInput type="number"
                        size="md"
                        label="No.of Questions"
                        max={10}
                        min={1}
                        css={{
                          '&:focus, &:hover, &:active, &:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none !important',
                          },
                          width: '100%',
                        }}
                        value={newStep[type.value]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          let value = e.target.value ? Number(e.target.value) : undefined
                          if (value && value < 0) {
                            value = 1
                          } else if (value && value > 10) {
                            value = 10
                          }
                          setNewStep({ ...newStep, [type.value]: value })
                        }}
                      />
                    </Flex>
                  )
                })}
                {newStep.assessmentType === 'initial_screening' && (
                  <Flex flexDirection="column" gap="$4">
                    <FormInput
                      type="text"
                      size="lg"
                      label="Keywords"
                      placeholder="Type a keyword for screening"
                      value={currentSkill}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentSkill(e.target.value)}
                      onKeyDown={handleSkillInput}
                      css={{
                        '&:focus, &:hover, &:active, &:focus-visible': {
                          outline: 'none',
                          boxShadow: 'none !important',
                        }
                      }}
                    />
                    <Flex gap="$2" css={{ flexWrap: 'wrap' }}>
                      {skills.map((skill, index) => (
                        <Chip 
                          key={index} 
                          closable 
                          onClose={() => handleRemoveSkill(skill)}
                          css={{ margin: '$1' }}
                        >
                          {skill}
                        </Chip>
                      ))}
                    </Flex>
                  </Flex>
                )}
              </Flex>
              <Flex gap="$4" css={{
                marginTop: '$4',
                justifyContent: "flex-end",
              }}>
                <Button size="md" color="primary" onClick={handleAddStep}>
                  {isEditing ? 'Save' : 'Add'}
                </Button>
                <Button size="md" color="secondary" onClick={() => {
                  setIsModalOpen(false)
                  setIsEditing(false)
                  setNewStep({ id: '', title: '', description: '' })
                  setSkills([])
                }}>Cancel</Button>
              </Flex>
            </Flex>
          </DialogContent>
        </Dialog>
      )}
    </Flex>
  )
}

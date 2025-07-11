"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Star,
  Info,
  Download,
  ArrowRight,
  X,
  Loader2,
  PlusIcon,
  FormInput,
} from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox"
import type { RootState } from "@/lib/redux/store";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Flex, Text, Textarea, toast, Input, Select } from "@sparrowengg/twigs-react"
import { TickIcon } from "@sparrowengg/twigs-react-icons"
// import { formatDistanceToNow } from "@/lib/utils"

interface CandidatesListProps {
  jobs: object[];
  candidates: {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    college: string;
    skills: string;
    resume_s3_url: string;
    assessment_score: number;
    resume_score: number;
    resume_summary: string;
    test_summary: string;
    status: string | null;
    created_at: string;
    updated_at: string;
    interview_score: number | null;
    interview_summary: string | null;
  }[],
  assessment: object
}

// Add this constant outside the component
const INTERVIEWERS = [
  { label: "John Smith", value: "John Smith", score: 90 },
  { label: "Sarah Johnson", value: "Sarah Johnson", score: 85 },
  { label: "Michael Chen", value: "Michael Chen", score: 95 },
  { label: "Priya Patel", value: "Priya Patel", score: 80 },
  { label: "David Wilson", value: "David Wilson", score: 75 },
  { label: "Emma Rodriguez", value: "Emma Rodriguez", score: 88 },
  { label: "James Lee", value: "James Lee", score: 92 },
  { label: "Olivia Brown", value: "Olivia Brown", score: 78 },
  { label: "William Garcia", value: "William Garcia", score: 83 },
  { label: "Sophia Martinez", value: "Sophia Martinez", score: 87 },
  { label: "Benjamin Taylor", value: "Benjamin Taylor", score: 91 },
  { label: "Ava Anderson", value: "Ava Anderson", score: 84 },
  { label: "Ethan Thomas", value: "Ethan Thomas", score: 79 },
  { label: "Isabella Jackson", value: "Isabella Jackson", score: 93 },
  { label: "Alexander White", value: "Alexander White", score: 86 },
  { label: "Mia Harris", value: "Mia Harris", score: 82 },
  { label: "Daniel Martin", value: "Daniel Martin", score: 89 },
  { label: "Charlotte Thompson", value: "Charlotte Thompson", score: 77 },
  { label: "Matthew Robinson", value: "Matthew Robinson", score: 94 },
  { label: "Amelia Clark", value: "Amelia Clark", score: 81 }
];

export function InterviewCandidatesList({ jobs, assessment }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)
  const [interviewSummaries, setInterviewSummaries] = useState<{[key: number]: string}>({})
  const [savingSummary, setSavingSummary] = useState<number | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  // const job = useSelector((state: RootState) => state.jobs.jobs.find((j) => j.id === jobId))
  // const candidates = job?.candidates || []
  const [candidates, setCandidates] = useState<any[]>([]);
  const [assessmentDataCandidates, setAssessmentDataCandidates] = useState<
    Record<number, any>
  >({});
  const fetchCandidates = async () => {
    if (!assessment.id) return;
    console.log("assessment.id", assessment.id);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/assessments/${assessment.id}/candidates`
    );
    const data = await response.json();
    console.log("data", data);
    // Map assessment details to candidate IDs
    const assessmentDataMap: Record<number, any> = {};
    data?.candidates.forEach((candidate: any) => {
      assessmentDataMap[candidate.candidate_details.id] =
        candidate?.assessment_details;
    });
    console.log("assessmentDataMap", assessmentDataMap);
    setAssessmentDataCandidates(assessmentDataMap);

    const candidatesData = data?.candidates.map(
      (candidate: any) => candidate.candidate_details
    );
    console.log("candidatesData", candidatesData);
    setCandidates(candidatesData);
  };
  // Only run date formatting on the client
  useEffect(() => {
    setIsClient(true);
    fetchCandidates();
  }, []);

  // Initialize interview summaries from candidates data
  useEffect(() => {
    const summaries: { [key: number]: string } = {};
    candidates.forEach((candidate) => {
      summaries[candidate.id] = candidate.interview_summary || "";
    });
    setInterviewSummaries(summaries);
  }, [candidates]);

  const handleSummaryChange = (candidateId: number, value: string) => {
    setInterviewSummaries((prev) => ({
      ...prev,
      [candidateId]: value,
    }));
  };

  const saveSummary = async (candidateId: number) => {
    setSavingSummary(candidateId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/candidates/${candidateId}/update-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interview_summary: interviewSummaries[candidateId],
          }),
        }
      );

      if (response.ok) {
        toast({
          variant: "success",
          title: "Feedback saved",
          description: "Interview feedback has been saved",
        });
        fetchCandidates();
      } else {
        toast({
          variant: "error",
          title: "Error saving feedback",
          description: "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error saving interview summary:", error);
      toast({
        variant: "error",
        title: "Error saving feedback",
        description: "Please try again later",
      });
    } finally {
      setSavingSummary(null);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map((c) => c.id.toString()));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((cId) => cId !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };
  const moveCandidateToNextStep = async (
    candidateId: number,
    status: string
  ) => {
    console.log("candidateId", assessment?.id);
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/update/candidate-assessment/${assessment?.id}/${candidateId}/job/${jobs[0].id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    fetchCandidates();
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!isClient || !dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!isClient || !dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch {
      return "";
    }
  };
  console.log(candidates);

  if (candidates?.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No candidates yet. Add candidates to get started.
        </p>
      </div>
    );
  }

  console.log("frontend/components/screened-candidates-list.tsx");
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-normal text-gray-500 w-10">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                className="rounded-sm"
              />
            </th>
            <th className="pb-2 font-normal text-gray-500">Candidate Info</th>
            <th className="pb-2 font-normal text-gray-500">Status</th>
            <th className="pb-2 font-normal text-gray-500">Feedback</th>
            <th className="pb-2 font-normal text-gray-500">Applied</th>
            <th className="pb-2 font-normal text-gray-500">Interview</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b hover:bg-gray-50">
              <td className="py-4">
                <Checkbox
                  checked={selectedCandidates.includes(candidate.id.toString())}
                  onCheckedChange={() =>
                    handleSelectCandidate(candidate.id.toString())
                  }
                  className="rounded-sm"
                />
              </td>
              <td className="py-4">
                <div>
                  <div className="font-medium text-blue-600">
                    {candidate.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {candidate.location}
                  </div>
                  <div className="text-sm text-gray-600">{candidate.phone}</div>
                </div>
              </td>
              <td className="py-4">
                <div>
                  <div>{candidate.status || "New"}</div>
                  <div className="text-sm text-gray-600">
                    {isClient ? getTimeAgo(candidate.updated_at) : ""}
                  </div>
                </div>
              </td>
              <td
                className="py-4"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "200px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                }}
              >
                <Flex
                  css={{
                    width: "100%",
                    "&>div": {
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setShowFeedbackModal(candidate.id);
                    }}
                    disabled={savingSummary === candidate.id}
                  >
                    {savingSummary === candidate.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving
                      </>
                    ) : (
                      <div className="flex items-center">
                        <PlusIcon color="#005844" strokeWidth={2} />
                        <span className="ml-2">Add Feedback</span>
                      </div>
                    )}
                  </Button>
                </Flex>
              </td>
              <td className="py-4" suppressHydrationWarning>
                {formatDate(candidate.created_at)}
              </td>
              <td className="py-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col justify-between">
                    <span className="text-sm font-medium py-1 rounded">
                      Score: {candidate?.interview_score?.toFixed(2) || "N/A"}
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center text-sm text-blue-600 hover:underline">
                          <Info className="h-4 w-4 mr-1" />
                          View Summary
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Interview Summary</h4>
                          <p className="text-sm text-gray-700">
                            {candidate.interview_summary ||
                              "No summary available"}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </td>
              <td className="py-4">
                {loading === candidate.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {loading !== candidate.id && (
                  <div className="flex space-x-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              window.open(candidate.resume_s3_url, "_blank")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download Resume</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-800 hover:text-green-900 hover:bg-green-50"
                            onClick={async () => {
                              // You'll implement this functionality later
                              setLoading(candidate.id);
                              console.log(
                                `Moving candidate ${candidate.id} to next step`
                              );
                              try {
                                const response = await moveCandidateToNextStep(
                                  candidate.id,
                                  "Assessment"
                                );
                                if (response.status === 200) {
                                  toast({
                                    variant: "success",
                                    title: "Candidate moved to next step",
                                    description: "Candidate moved to next step",
                                  });
                                } else {
                                  toast({
                                    variant: "error",
                                    title:
                                      "Error moving candidate to next step",
                                    description: "Please try again later",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  variant: "error",
                                  title: "Error moving candidate to next step",
                                  description: "Please try again later",
                                });
                                console.error(
                                  "Error moving candidate to next step:",
                                  error
                                );
                              } finally {
                                setLoading(null);
                              }
                            }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move to Next Step</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              // You'll implement this functionality later
                              await moveCandidateToNextStep(
                                candidate.id,
                                "Hired"
                              );
                              console.log(
                                `Rejecting candidate ${candidate.id}`
                              );
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reject Candidate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showFeedbackModal && (
        <FeedbackModal
          show={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSave={saveSummary}
          job_id={jobs[0].id}
          candidate_id={showFeedbackModal}
        />
      )}
    </div>
  );
}
const FeedbackModal = ({
  show,
  onClose,
  onSave,
  job_id,
  candidate_id,
}: {
  show: boolean;
  onClose: () => void;
  onSave: (candidateId: number) => void;
  job_id: number;
  candidate_id: number;
}) => {
  const [interviewDetails, setInterviewDetails] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<{
    label: string;
    value: string;
    score: number;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (candidate_id: number, job_id: number) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviewer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedback: interviewDetails,
            name: interviewName,
            email: email,
            candidate_id: candidate_id,
            job_id: job_id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApiResponse(data);
        toast({
          variant: "success",
          title: "Feedback submitted",
          description: "Interview feedback has been saved",
        });
      } else {
        toast({
          variant: "error",
          title: "Error submitting feedback",
          description: "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error submitting interview feedback:", error);
      toast({
        variant: "error",
        title: "Error submitting feedback",
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("responseData", JSON.stringify(apiResponse));

      // Add video file if selected
      if (videoFile) {
        formData.append("video", videoFile);
      }
      // I want to upload the video to the API body
      const formdata = new FormData();
      formdata.append("video", videoFile, "candidate.mp4");

      const requestOptions = {
        method: "POST",
        body: formdata,
        redirect: "follow",
      };

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-video/${job_id}/${candidate_id}/${apiResponse.id}`,
        requestOptions
      )
        .then((response) => onClose())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    } catch (error) {
      console.error("Error uploading interview data:", error);
      toast({
        variant: "error",
        title: "Error uploading data",
        description: "Please try again later",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is a video
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        toast({
          variant: "error",
          title: "Invalid file type",
          description: "Please upload a video file",
        });
      }
    }
  };

  return <Dialog open={show} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle css={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text css={{
            marginBottom: '0',
            fontSize: '32px',
            lineHeight: '32px',
          }}>
          Add Feedback
          </Text>
        </DialogTitle>
      </DialogHeader>
      <DialogDescription>
        <Flex css={{
          marginTop: '16px',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px'
        }}>
          <Flex css={{
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Text size="sm" weight="medium">Interviewer</Text>
            <Select
              size="lg"
              placeholder="Select interviewer"
              value={INTERVIEWERS.find( data=>selectedInterviewer===data.label)}
              onChange={(option: any) => {
                console.log(option, "option")
                setSelectedInterviewer(option);
              }}
              components={{
                Option: (props) => (
                  <Flex css={{
                    padding: '8px',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    zIndex: '1000',
                    '&:hover': {
                      backgroundColor: 'var(--colors-gray2)',
                    }
                  }}
                    onClick={() => {
                      setSelectedInterviewer(props.data.label)
                    }}
                  >
                    <Text>{props.data.label}</Text>
                    <Text css={{
                      color: props.data.score >= 90 ? '#005844' : 
                             props.data.score >= 80 ? 'orange' : 
                             'red'
                    }} >{props.data.score}</Text>
                  </Flex>
                )
              }}
              options={INTERVIEWERS}
            />
          </Flex>
          
          <Flex css={{
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Text size="sm" weight="medium">Email ID</Text>
            <Input 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Flex>
          
          <Flex css={{
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Text size="sm" weight="medium">Interview Feedback</Text>
            <Textarea
              placeholder="Enter interview details and feedback"
              value={interviewDetails}
              onChange={(e) => setInterviewDetails(e.target.value)}
              rows={5}
            />
          </Flex>
          
        {!apiResponse && <Flex css={{ 
          marginTop: '16px',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={() => handleSubmit(candidate_id, job_id)}
            disabled={isSubmitting || !interviewDetails || !selectedInterviewer || !email}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting</>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </Flex>}
          
          {apiResponse && (
            <Flex css={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: 'var(--colors-success2)', 
              borderRadius: '4px',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <Flex css={{
                flexDirection: 'column',
                gap: '8px'
              }}>
                <Text size="sm" weight="medium">Upload Interview Recording</Text>
                <Input 
                  type="file" 
                  accept="video/*"
                  onChange={handleFileChange}
                />
                {videoFile && (
                  <Text size="xs" css={{ color: 'var(--colors-success11)' }}>
                    Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </Text>
                )}
              </Flex>
              
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  "Upload Interview Data"
                )}
              </Button>
            </Flex>
          )}
        </Flex>
      </DialogDescription>
    </DialogContent>
  </Dialog>
}
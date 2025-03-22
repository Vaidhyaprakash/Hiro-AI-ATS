"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Settings,
  Mail,
  UserPlus,
  ChevronDown,
  Locate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidatesList } from "@/components/candidates/candidates-list";
import { ScreenedCandidatesList } from "@/components/candidates/screened-candidates-list";
import { motion, AnimatePresence } from "framer-motion";
import { AssessmentList } from "@/components/candidates/assessment-list";
import { InterviewCandidatesList } from "@/components/candidates/interview-candidates-list";
import { HiredCandidatesList } from "@/components/candidates/hired-candidates-list";
import { SmarthireList } from "@/components/candidates/smarthire-list";
// import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@sparrowengg/twigs-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, DialogTrigger, DialogContent, FormLabel, Input, IconButton, Box, Button as TwigsButton, Flex } from "@sparrowengg/twigs-react"; import { CloseIcon } from '@sparrowengg/twigs-react-icons'

interface JobDetails {
  id: number;
  title: string;
  job_description: string;
  requirements: string;
  company_name: string;
  properties: {
    location: string;
    department: string;
    employmentType: string;
    compensation: string;
    hiringLead: string;
    status: string;
    flow?: Record<string, string>;
  };
  created_at: string;
  updated_at: string;
  company_id: number;
  candidate_count: number;
}
interface Candidate {
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
  interview_summary: string | null;
  interview_score: number | null;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [assessmentsCount, setAssessmentsCount] = useState<any>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenedCandidates, setScreenedCandidates] = useState<Candidate[]>([]);
  const [interviewCandidates, setInterviewCandidates] = useState<Candidate[]>(
    []
  );
  const [hiredCandidates, setHiredCandidates] = useState<Candidate[]>([]);
  const [newCandidates, setNewCandidates] = useState<Candidate[]>([]);
  const [assessmentCandidates, setAssessmentCandidates] = useState<Candidate[]>(
    []
  );
  const [activeTab, setActiveTab] = useState("new");
  const [viewDescription, setViewDescription] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side and have a valid ID
    if (typeof window === "undefined" || !params?.id) return;

    const fetchJobDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            router.push("/jobs");
            return;
          }
          throw new Error(
            `Failed to fetch job details: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(data);
        setJob(data);
        const count = {};
        for (const assessment of data.assessments) {
          const responseCandidates = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/assessments/${assessment.id}/candidates`
          );
          const dataCandidates = await responseCandidates.json();
          console.log("dataCandidates", dataCandidates);
          const completedCandidates = dataCandidates.candidates.filter(
            (candidate) => candidate.assessment_details.status !== "completed"
          );
          count[assessment.id] = completedCandidates.length;
        }
        setAssessmentsCount(count);
        const responseCandidates = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidates`
        );
        const dataCandidates = await responseCandidates.json();
        console.log(dataCandidates);
        setCandidates(dataCandidates);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching job details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [params?.id, router]);

  useEffect(() => {
    const screenedCandidates = candidates.filter(
      (candidate) => candidate.status === "Screening"
    );
    const interviewCandidates = candidates.filter(
      (candidate) => candidate.status === "Interview"
    );
    const hiredCandidates = candidates.filter(
      (candidate) => candidate.status === "Hired"
    );
    const newCandidates = candidates.filter(
      (candidate) => candidate.status === "Sourced"
    );
    const assessmentCandidates = candidates.filter(
      (candidate) => candidate.status === "Assessment"
    );
    setScreenedCandidates(screenedCandidates);
    setInterviewCandidates(interviewCandidates);
    setHiredCandidates(hiredCandidates);
    setNewCandidates(newCandidates);
    setAssessmentCandidates(assessmentCandidates);
  }, [candidates]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-500">{error || "Job not found"}</div>
      </div>
    );
  }

  const handleEditJob = () => {
    router.push(`/jobs/edit/${params.id}`);
  };

  const handlePreviewJob = () => {
    // In a real app, this would open a preview modal or page
    alert("Preview job listing functionality would be implemented here");
  };

  const handleViewDescription = () => {
    // In a real app, this would open a modal with the job description
    setViewDescription(true);
    console.log(job.job_description, "job.description");
  };

  const handleStartScreening = () => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resume/analyze/${params.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: params.id,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .then(() => {
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidates`
        )
          .then((response) => response.json())
          .then((data) => {
            setCandidates(data);
            console.log(data);
          })
          .catch((error) => console.error("Error fetching candidates:", error));
      })
      .catch((error) => console.error("Error fetching candidates:", error));
  };
  const handleCandidatesFetch = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidates`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setCandidates(data);
      })
      .catch((error) => console.error("Error fetching candidates:", error));
  };
  console.log(job);
  console.log(assessmentsCount, "assessmentsCount");
  return (
    <div className="bg-[#f8f8f8] min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#4b7a3e]">{job.title}</h1>
          <p className="text-gray-600 mt-1">
            {job.properties.department} - {job.properties.location}
          </p>
        </div>

        <div className="flex flex-col gap-6 mb-8 ">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant="outline"
                className="border-[#4b7a3e] text-[#4b7a3e] hover:bg-[#4b7a3e]/10"
                onClick={handleEditJob}
              >
                Edit Job Opening
              </Button>
              <Button variant="outline" size="icon">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="outline" onClick={handlePreviewJob}>
                Preview Job Listing
              </Button>
              <Button
                variant="link"
                className="text-blue-600"
                onClick={handleViewDescription}
              >
                View Job Description
              </Button>
            </div>

            <Tabs
              defaultValue={job.smart_hire_enabled ? "smarthire" : "new"}
              className="w-full"
              onValueChange={(value) => setActiveTab(value)}
            >
              <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 mb-6">
                <TabsTrigger
                  value="smarthire"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Smart Hire
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  New ({newCandidates.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="screen"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Screened ({screenedCandidates.length || 0})
                </TabsTrigger>
                {job.assessments?.length > 0 &&
                  job.assessments
                    .filter(
                      (assessment) =>
                        assessment.type === "aptitude_test" ||
                        assessment.type === "technical_test"
                    )
                    .map((assessment) => (
                      <TabsTrigger
                        key={assessment.id}
                        value={`assessment-${assessment.id}`}
                        className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                      >
                        {assessment.title} (
                        {assessmentsCount[assessment.id] || 0})
                      </TabsTrigger>
                    ))}
                {job.assessments?.length > 0 &&
                  job.assessments
                    .filter((assessment) => assessment.type === "interview")
                    .map((assessment) => {
                      console.log(assessment);
                      return (
                        <TabsTrigger
                          key={assessment.id}
                          value={`assessment-${assessment.id}`}
                          className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                        >
                          {assessment.title} (
                          {assessmentsCount[assessment.id] || 0})
                        </TabsTrigger>
                      );
                    })}
                {/* <TabsTrigger
                  value="interview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Interview ({interviewCandidates.length || 0})
                </TabsTrigger> */}
                <TabsTrigger
                  value="hired"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Hired ({hiredCandidates.length || 0})
                </TabsTrigger>
                <div className="ml-auto flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    More
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="new" className="mt-0">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                          New Candidates
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            className="bg-white text-black border hover:bg-gray-100"
                            onClick={handleStartScreening}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Start Screening
                          </Button>
                        </div>
                      </div>

                      <CandidatesList jobs={[job]} candidates={newCandidates} />
                    </div>
                  </TabsContent>

                  <TabsContent value="screen" className="mt-0">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                          Screened Candidates
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <ScreenedCandidatesList
                        jobs={[job]}
                        candidates={screenedCandidates}
                        fetchCandidates={handleCandidatesFetch}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="assessment" className="mt-0">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                          Assessment Candidates
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <AssessmentList
                        jobs={[job]}
                        candidates={assessmentCandidates}
                        fetchCandidates={handleCandidatesFetch}
                      />
                    </div>
                  </TabsContent>

                  {/* <TabsContent value="interview" className="mt-0">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">Interview Candidates</h2>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <InterviewCandidatesList jobs={[job]} candidates={interviewCandidates} fetchCandidates={handleCandidatesFetch}/>
                    </div>
                  </TabsContent> */}

                  <TabsContent value="hired" className="mt-0">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                          Hired Candidates
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <HiredCandidatesList
                        jobs={[job]}
                        candidates={hiredCandidates}
                        fetchCandidates={handleCandidatesFetch}
                      />
                    </div>
                  </TabsContent>
                  {job.assessments?.length > 0 &&
                    job.assessments
                      .filter(
                        (assessment) =>
                          assessment.type === "aptitude_test" ||
                          assessment.type === "technical_test"
                      )
                      .map((assessment) => (
                        <TabsContent
                          key={assessment.id}
                          value={`assessment-${assessment.id}`}
                          className="mt-0"
                        >
                          <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                                {assessment.title} Candidates
                              </h2>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="rounded-full"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="rounded-full"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <AssessmentList
                              jobs={[job]}
                              candidates={[]}
                              fetchCandidates={handleCandidatesFetch}
                              assessment={assessment}
                            />
                          </div>
                        </TabsContent>
                      ))}
                  {job.assessments?.length > 0 &&
                    job.assessments
                      .filter((assessment) => assessment.type === "interview")
                      .map((assessment) => {
                        console.log(assessment, "interview");
                        return (
                          <TabsContent
                            key={assessment.id}
                            value={`assessment-${assessment.id}`}
                            className="mt-0"
                          >
                            <div className="bg-white rounded-lg shadow-sm p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                                  {assessment.title} Candidates
                                </h2>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <InterviewCandidatesList
                                jobs={[job]}
                                candidates={[]}
                                assessment={assessment}
                              />
                            </div>
                          </TabsContent>
                        );
                      })}
                  <TabsContent value="smarthire" className="mt-0">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-[#4b7a3e]">
                          Smart Hire Candidates
                        </h2>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <SmarthireList
                        jobs={[job]}
                        candidates={[]}
                        fetchCandidates={handleCandidatesFetch}
                      />
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>

          <div className="">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Hiring Lead</h3>
                  <p>{job.properties.hiringLead}</p>
                </div>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <div className="mr-xl">
                  <h3 className="font-medium">Status</h3>
                  <p>{job.properties?.status}</p>
                </div>
                <div>
                  <h3 className="font-medium">Open</h3>
                  <p>
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(job.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    Days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {viewDescription && <Dialog open={viewDescription} onOpenChange={setViewDescription} size="lg">
  <DialogContent>
    <DialogHeader
      css={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <DialogTitle size="md">Job Description</DialogTitle>
    </DialogHeader>
    <DialogBody>
            <Flex>
              <MarkdownPreview text={job.job_description} />
      </Flex>
    </DialogBody>
    <Box css={{ position: "absolute", top: "$8", right: "$8" }}>
      <DialogClose asChild>
        <IconButton
          size="lg"
          icon={<CloseIcon />}
          variant="ghost"
          aria-label="Close"
          color="default"
        />
      </DialogClose>
    </Box>
  </DialogContent>
</Dialog>}
    </div>
  );
}


const parseText = (text) => {
  // Convert **text** to bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert *text* to semi-bold or italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Convert lines starting with # to headings
  text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/\n/g, '<br />');
  
  return text;
};

const MarkdownPreview = ({ text }) => {
  const parsedText = parseText(text);

  return (
    <div dangerouslySetInnerHTML={{ __html: parsedText }} />
  );
};
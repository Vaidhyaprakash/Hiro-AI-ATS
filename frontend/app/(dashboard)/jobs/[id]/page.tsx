"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Users, Settings, Mail, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidatesList } from "@/components/candidates-list";

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
  resume: string;
  status: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure we're on the client side and have a valid ID
    if (typeof window === 'undefined' || !params?.id) return;

    const fetchJobDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}`
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/jobs');
            return;
          }
          throw new Error(`Failed to fetch job details: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setJob(data);
        const responseCandidates = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidates`);
        const dataCandidates = await responseCandidates.json();
        console.log(dataCandidates);
        setCandidates(dataCandidates);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [params?.id, router]);

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
        <div className="text-lg text-red-500">{error || 'Job not found'}</div>
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
    alert(`Job Description: ${job.job_description}`);
  };

  const handleAddCandidate = () => {
    // This would be implemented with your actual candidate creation logic
    alert("Add candidate functionality would be implemented here");
  };
  const handleCandidatesFetch = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidates`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => console.error('Error fetching candidates:', error));
  };

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
              <Button variant="link" className="text-blue-600" onClick={handleViewDescription}>
                View Job Description
              </Button>
            </div>

            <Tabs defaultValue="new" className="w-full">
              <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 mb-6">
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  New ({job.candidate_count || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="screen"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Schedule...Screen (0)
                </TabsTrigger>
                <TabsTrigger
                  value="interview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Schedule Interview (0)
                </TabsTrigger>
                <TabsTrigger
                  value="hired"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#4b7a3e] data-[state=active]:text-[#4b7a3e] rounded-none bg-transparent h-10 px-4"
                >
                  Hired (0)
                </TabsTrigger>
                <div className="ml-auto flex items-center">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    More
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </TabsList>

              <TabsContent value="new" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-[#4b7a3e]">New Candidates</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button className="bg-white text-black border hover:bg-gray-100" onClick={handleAddCandidate}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        New Candidate
                      </Button>
                    </div>
                  </div>

                  <CandidatesList jobs={[job]} candidates={candidates} />
                </div>
              </TabsContent>

              <TabsContent value="screen" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No Candidates in Screen Stage</h3>
                    <p className="text-muted-foreground mt-2">
                      Move candidates to this stage to schedule screening calls.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interview" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No Candidates in Interview Stage</h3>
                    <p className="text-muted-foreground mt-2">Move candidates to this stage to schedule interviews.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hired" className="mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No Hired Candidates</h3>
                    <p className="text-muted-foreground mt-2">
                      Move candidates to this stage when they accept an offer.
                    </p>
                  </div>
                </div>
              </TabsContent>
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
              <div className="border-t pt-4">
                <div className="mb-2">
                  <h3 className="font-medium">Status</h3>
                  <p>{job.properties.status}</p>
                </div>
                <div>
                  <h3 className="font-medium">Open</h3>
                  <p>{Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
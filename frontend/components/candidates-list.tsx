"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { format } from "date-fns"
import { Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { RootState } from "@/lib/redux/store"
import { formatDistanceToNow } from "@/lib/utils"

interface CandidatesListProps {
  jobs: object[],
  candidates: object[]
}

export function CandidatesList({ jobs, candidates }: CandidatesListProps) {
  const [selectAll, setSelectAll] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  // const job = useSelector((state: RootState) => state.jobs.jobs.find((j) => j.id === jobId))
  console.log(candidates)

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(candidates.map((c) => c.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((cId) => cId !== id))
    } else {
      setSelectedCandidates([...selectedCandidates, id])
    }
  }

  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No candidates yet. Add candidates to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-normal text-gray-500 w-10">
              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} className="rounded-sm" />
            </th>
            <th className="pb-2 font-normal text-gray-500">Candidate Info</th>
            <th className="pb-2 font-normal text-gray-500">Status</th>
            <th className="pb-2 font-normal text-gray-500">Rating</th>
            <th className="pb-2 font-normal text-gray-500">Applied</th>
            <th className="pb-2 font-normal text-gray-500">Last Email</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b hover:bg-gray-50">
              <td className="py-4">
                <Checkbox
                  checked={selectedCandidates.includes(candidate.id)}
                  onCheckedChange={() => handleSelectCandidate(candidate.id)}
                  className="rounded-sm"
                />
              </td>
              <td className="py-4">
                <div>
                  <div className="font-medium text-blue-600">{candidate.name}</div>
                  <div className="text-sm text-gray-600">{candidate.location}</div>
                  <div className="text-sm text-gray-600">{candidate.phone}</div>
                </div>
              </td>
              <td className="py-4">
                <div>
                  <div>{candidate.status}</div>
                  <div className="text-sm text-gray-600">
                    Updated {formatDistanceToNow(new Date(candidate.updatedAt))} ago
                  </div>
                </div>
              </td>
              <td className="py-4">{renderRating(candidate.rating)}</td>
              <td className="py-4">{format(new Date(candidate.appliedAt), "MMM d, yyyy")}</td>
              <td className="py-4">
                {candidate.lastEmail ? format(new Date(candidate.lastEmail), "MMM d, yyyy") : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


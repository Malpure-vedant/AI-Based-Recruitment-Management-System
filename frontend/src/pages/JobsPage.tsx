import React, { useState, useMemo } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Modal } from '../components/ui/Modal'
import { CreateJobModal } from '../components/jobs/CreateJobModal'
import { Job, JobStatus } from '../types'

export const JobsPage: React.FC = () => {
  const { jobs, applications, updateJobStatus } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDept = departmentFilter === 'ALL' || job.department === departmentFilter
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter

      return matchesSearch && matchesDept && matchesStatus
    })
  }, [jobs, searchQuery, departmentFilter, statusFilter])

  // Applicants for selected job
  const jobApplicants = useMemo(() => {
    if (!selectedJob) return []
    return applications
      .filter(a => a.jobId === selectedJob.id)
      .sort((a, b) => (b.aiAnalysis?.matchScore || 0) - (a.aiAnalysis?.matchScore || 0))
  }, [applications, selectedJob])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Requisition Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure open requisitions, define required technical skill rubrics, and inspect applicant pipelines.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Post New Job Requisition
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, department, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Departments</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Core Engineering">Core Engineering</option>
            <option value="Infrastructure & SRE">Infrastructure & SRE</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Product Management">Product Management</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.map(job => (
          <Card key={job.id} className="hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge
                    variant={job.status === 'OPEN' ? 'success' : job.status === 'PAUSED' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {job.status}
                  </Badge>
                  <h3
                    className="text-base font-bold text-slate-900 mt-2 hover:text-indigo-600 cursor-pointer line-clamp-1"
                    onClick={() => setSelectedJob(job)}
                  >
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{job.department}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{job.type} · {job.experienceLevel} Level</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{job.salaryRange}</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                  Target Skill Profile
                </p>
                <div className="flex flex-wrap gap-1">
                  {job.requiredSkills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-medium border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 4 && (
                    <span className="text-[10px] text-slate-400 font-medium self-center">
                      +{job.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{job.applicantsCount} Applicants</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(job)}
                  className="text-xs h-7 px-2.5"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Details & Applicant Leaderboard Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          description={`${selectedJob.department} · ${selectedJob.location} · ${selectedJob.salaryRange}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status & Quick Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Requisition Status:</span>
                <Badge
                  variant={selectedJob.status === 'OPEN' ? 'success' : selectedJob.status === 'PAUSED' ? 'warning' : 'danger'}
                >
                  {selectedJob.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {selectedJob.status !== 'OPEN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateJobStatus(selectedJob.id, 'OPEN')
                      setSelectedJob({ ...selectedJob, status: 'OPEN' })
                    }}
                  >
                    Open Requisition
                  </Button>
                )}
                {selectedJob.status === 'OPEN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateJobStatus(selectedJob.id, 'PAUSED')
                      setSelectedJob({ ...selectedJob, status: 'PAUSED' })
                    }}
                  >
                    Pause Inflow
                  </Button>
                )}
                {selectedJob.status !== 'CLOSED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      updateJobStatus(selectedJob.id, 'CLOSED')
                      setSelectedJob({ ...selectedJob, status: 'CLOSED' })
                    }}
                  >
                    Close Job
                  </Button>
                )}
              </div>
            </div>

            {/* Description & Responsibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Role Mission</h4>
                <p className="text-slate-600 leading-relaxed">{selectedJob.description}</p>

                <h5 className="font-bold text-slate-800 pt-2">Key Responsibilities:</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {selectedJob.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Scoring Weights */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Evaluation Weightings</span>
                </div>
                <p className="text-slate-600">
                  Gemini API calibrates candidate ranking according to this weighted rubric:
                </p>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 text-[11px] mb-1">
                      <span>Technical Skills</span>
                      <span>{Math.round(selectedJob.scoringWeights.skills * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${selectedJob.scoringWeights.skills * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 text-[11px] mb-1">
                      <span>Experience & Seniority</span>
                      <span>{Math.round(selectedJob.scoringWeights.experience * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${selectedJob.scoringWeights.experience * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 text-[11px] mb-1">
                      <span>Education & Accreditations</span>
                      <span>{Math.round(selectedJob.scoringWeights.education * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${selectedJob.scoringWeights.education * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 text-[11px] mb-1">
                      <span>Domain Alignment</span>
                      <span>{Math.round(selectedJob.scoringWeights.domain * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${selectedJob.scoringWeights.domain * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Applicant Leaderboard for this Job */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Applicant Leaderboard ({jobApplicants.length})
                </h4>
                <span className="text-[11px] text-slate-500">Sorted by AI Match Score</span>
              </div>

              {jobApplicants.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                  No applications received yet for this requisition.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">AI Score</th>
                        <th className="p-3">Stage</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobApplicants.map((app, index) => (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-400">#{index + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={app.candidateAvatar}
                                alt={app.candidateName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-semibold text-slate-800">{app.candidateName}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" />
                          </td>
                          <td className="p-3">
                            <Badge variant="neutral" size="sm">
                              {app.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <a
                              href={`/screening?candidateId=${app.id}`}
                              className="text-indigo-600 font-semibold hover:underline"
                            >
                              Inspect AI &rarr;
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Post Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

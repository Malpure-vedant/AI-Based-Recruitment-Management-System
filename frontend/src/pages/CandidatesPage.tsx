import React, { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Sparkles,
  Mail,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { Application, ApplicationStatus } from '../types'

export const CandidatesPage: React.FC = () => {
  const { applications, jobs, updateApplicationStatus } = useApp()
  const [searchParams] = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedJob, setSelectedJob] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'ALL')
  const [minScore, setMinScore] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Selected candidate for detail modal
  const [activeCandidate, setActiveCandidate] = useState<Application | null>(null)

  // Filtering
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch =
        app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.aiAnalysis?.matchedSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesJob = selectedJob === 'ALL' || app.jobId === selectedJob
      const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus
      const matchesScore = (app.aiAnalysis?.matchScore || 0) >= minScore

      return matchesSearch && matchesJob && matchesStatus && matchesScore
    })
  }, [applications, searchQuery, selectedJob, selectedStatus, minScore])

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    updateApplicationStatus(appId, newStatus)
    if (activeCandidate && activeCandidate.id === appId) {
      setActiveCandidate({ ...activeCandidate, status: newStatus })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, evaluate AI screening results, and advance candidates across hiring stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/resumes/upload">
            <Button variant="primary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> Upload & Screen New Resumes
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or skill..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            {/* Job Filter */}
            <select
              value={selectedJob}
              onChange={e => {
                setSelectedJob(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All Requisitions ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All Application Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">AI Screening</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview Round</option>
              <option value="OFFERED">Offer Extended</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Min Score Slider */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                Min Score: {minScore}%
              </span>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={e => {
                  setMinScore(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Candidates Directory</CardTitle>
            <Badge variant="neutral" size="sm">
              {filteredApplications.length} Results
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ranked by AI Match Score</span>
          </div>
        </CardHeader>

        {paginatedApplications.length === 0 ? (
          <EmptyState
            title="No candidates found"
            description="Try adjusting your search criteria, stage filter, or minimum AI match score."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedJob('ALL')
                  setSelectedStatus('ALL')
                  setMinScore(0)
                }}
              >
                Reset All Filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Candidate Profile</th>
                  <th className="px-5 py-3">Target Requisition</th>
                  <th className="px-5 py-3">AI Match Score</th>
                  <th className="px-5 py-3">Extracted Skills</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.candidateAvatar}
                          alt={app.candidateName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => setActiveCandidate(app)}>
                            {app.candidateName}
                          </p>
                          <p className="text-[11px] text-slate-400">{app.candidateEmail}</p>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> Applied {app.appliedDate}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{app.jobTitle}</p>
                      <span className="text-[10px] text-slate-500">{app.jobDepartment}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(app.aiAnalysis?.matchedSkills || []).slice(0, 3).map(skill => (
                          <span
                            key={skill}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {(app.aiAnalysis?.matchedSkills || []).length > 3 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{((app.aiAnalysis?.matchedSkills || []).length) - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          app.status === 'SHORTLISTED' || app.status === 'OFFERED'
                            ? 'success'
                            : app.status === 'REJECTED'
                            ? 'danger'
                            : app.status === 'INTERVIEW'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveCandidate(app)}
                        className="text-xs h-7 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Quick View
                      </Button>
                      <Link to={`/screening?candidateId=${app.id}`}>
                        <Button variant="primary" size="sm" className="text-xs h-7 px-2.5">
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Insights
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredApplications.length}
          itemsPerPage={itemsPerPage}
        />
      </Card>

      {/* Candidate Profile & Evaluation Modal */}
      {activeCandidate && (
        <Modal
          isOpen={!!activeCandidate}
          onClose={() => setActiveCandidate(null)}
          title={`Candidate Profile: ${activeCandidate.candidateName}`}
          description={`Application for ${activeCandidate.jobTitle} · ${activeCandidate.jobDepartment}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Card */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={activeCandidate.candidateAvatar}
                  alt={activeCandidate.candidateName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/30"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{activeCandidate.candidateName}</h4>
                  <p className="text-slate-500">{activeCandidate.candidateEmail}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCandidate.aiAnalysis?.highestEducation} · {activeCandidate.aiAnalysis?.extractedExperienceYears} yrs experience
                  </p>
                </div>
              </div>
              <div className="text-right">
                <ScoreBadge score={activeCandidate.aiAnalysis?.matchScore} size="lg" />
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Gemini 1.5 Flash Screening Verdict</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{activeCandidate.aiAnalysis?.summary}</p>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Demonstrated Core Skills</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeCandidate.aiAnalysis?.matchedSkills.map(s => (
                    <Badge key={s} variant="success" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/60">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Missing Requirements / Gaps</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeCandidate.aiAnalysis?.missingSkills.length === 0 ? (
                    <span className="text-slate-500 text-[11px]">No skill gaps detected.</span>
                  ) : (
                    activeCandidate.aiAnalysis?.missingSkills.map(s => (
                      <Badge key={s} variant="danger" size="sm">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Resume Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Extracted Text (PyMuPDF)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{activeCandidate.resumeFileName}</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-700 font-mono max-h-32 overflow-y-auto leading-relaxed border border-slate-200">
                {activeCandidate.resumeRawTextSnippet}
              </div>
            </div>

            {/* Quick Actions Stage Changers */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Advance Stage:</span>
                <select
                  value={activeCandidate.status}
                  onChange={e => handleStatusChange(activeCandidate.id, e.target.value as ApplicationStatus)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SCREENING">AI Screening</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="INTERVIEW">Interview Round</option>
                  <option value="OFFERED">Offer Extended</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/screening?candidateId=${activeCandidate.id}`} onClick={() => setActiveCandidate(null)}>
                  <Button variant="primary" size="sm">
                    Open Comprehensive AI Scorecard &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

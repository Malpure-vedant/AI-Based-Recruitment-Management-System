import React, { useState, useMemo } from 'react'
import {
  Trophy,
  Medal,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Sliders,
  Scale,
  X,
  ExternalLink,
  Search,
  UserCheck,
  UserX,
  History,
  AlertCircle,
  Briefcase,
  ChevronDown
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Modal } from '../components/ui/Modal'
import { Application, ApplicationStatus } from '../types'
import { Link } from 'react-router-dom'

const REJECTION_PRESETS = [
  'Missing required core technical skills',
  'Insufficient domain & production experience',
  'Salary expectations exceed requisition budget',
  'Did not meet minimum education/qualification benchmark',
  'Failed technical screening evaluation',
  'Location or relocation mismatch',
  'Overqualified for target position level'
]

export const RankingPage: React.FC = () => {
  const { applications, jobs, shortlistCandidate, rejectCandidate, updateApplicationStatus } = useApp()

  const [selectedJobId, setSelectedJobId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(50)
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [targetRejectApp, setTargetRejectApp] = useState<Application | null>(null)
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(REJECTION_PRESETS[0])
  const [customRejectReason, setCustomRejectReason] = useState<string>('')

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [targetHistoryApp, setTargetHistoryApp] = useState<Application | null>(null)

  // Success toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filter and rank candidates
  const rankedCandidates = useMemo(() => {
    return applications
      .filter(app => {
        // Job filter
        const matchesJob = selectedJobId === 'ALL' || app.jobId === selectedJobId
        
        // Stage filter
        const matchesStage = stageFilter === 'ALL' || app.status === stageFilter

        // Cutoff score
        const matchesScore = (app.aiAnalysis?.matchScore || 0) >= minScoreThreshold

        // Search by name, email, or skills
        const q = searchQuery.trim().toLowerCase()
        const matchesSearch =
          !q ||
          app.candidateName.toLowerCase().includes(q) ||
          app.candidateEmail.toLowerCase().includes(q) ||
          (app.aiAnalysis?.matchedSkills || []).some(s => s.toLowerCase().includes(q)) ||
          (app.candidateSkills || []).some(s => s.toLowerCase().includes(q))

        return matchesJob && matchesStage && matchesScore && matchesSearch
      })
      .sort((a, b) => (b.aiAnalysis?.matchScore || 0) - (a.aiAnalysis?.matchScore || 0))
  }, [applications, selectedJobId, stageFilter, minScoreThreshold, searchQuery])

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== id))
    } else {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, id])
      } else {
        setSelectedForCompare([selectedForCompare[1], id])
      }
    }
  }

  const compareCandidates = useMemo(() => {
    return selectedForCompare
      .map(id => applications.find(a => a.id === id))
      .filter((a): a is Application => !!a)
  }, [applications, selectedForCompare])

  const handleShortlist = (app: Application) => {
    shortlistCandidate(app.id, 'Candidate shortlisted directly from AI Ranking Leaderboard.')
    showToast(`✔ ${app.candidateName} has been shortlisted!`)
  }

  const openRejectModal = (app: Application) => {
    setTargetRejectApp(app)
    setCustomRejectReason('')
    setSelectedPresetReason(REJECTION_PRESETS[0])
    setRejectModalOpen(true)
  }

  const handleConfirmReject = () => {
    if (!targetRejectApp) return
    const finalReason = customRejectReason.trim() || selectedPresetReason
    rejectCandidate(targetRejectApp.id, finalReason)
    showToast(`✖ ${targetRejectApp.candidateName} moved to Rejected with recorded reason.`)
    setRejectModalOpen(false)
    setTargetRejectApp(null)
  }

  const openHistoryModal = (app: Application) => {
    setTargetHistoryApp(app)
    setHistoryModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Candidate Ranking & Evaluation</h1>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Semantic Matching
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stack-rank applicants against role-specific qualification rubrics with explainable AI scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedForCompare.length === 2 && (
            <Button variant="primary" size="sm" onClick={() => setCompareModalOpen(true)}>
              <Scale className="w-4 h-4 mr-1.5" /> Compare 2 Candidates
            </Button>
          )}
          <Link to="/pipeline">
            <Button variant="outline" size="sm">
              <Briefcase className="w-4 h-4 mr-1.5" /> View Pipeline Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Ethical AI Notice Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Human-in-the-Loop Safeguard:</span> AI scoring is an objective advisory tool assessing job requirements and resume semantic alignment. Final hiring, shortlisting, and rejection actions must be decided by recruiters.
        </p>
      </div>

      {/* Search & Filters Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, skill (e.g. Python)..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Job opening */}
            <div>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All Requisitions ({jobs.length})</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage filter */}
            <div>
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All Recruitment Stages</option>
                <option value="APPLIED">Applied</option>
                <option value="SCREENING">Resume Screening</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="INTERVIEW_COMPLETED">Interview Completed</option>
                <option value="SELECTED">Selected</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Cutoff slider */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex flex-col justify-center">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                <span>Cutoff Score:</span>
                <span className="text-indigo-600 font-bold">{minScoreThreshold}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                step={5}
                value={minScoreThreshold}
                onChange={e => setMinScoreThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium Highlights */}
      {rankedCandidates.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 (Silver) */}
          <Card className="order-2 md:order-1 border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <CardContent className="p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold shadow-xs">
                #2
              </div>
              <img
                src={rankedCandidates[1].candidateAvatar}
                alt={rankedCandidates[1].candidateName}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-300"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{rankedCandidates[1].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[1].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[1].aiAnalysis?.matchScore} size="md" />
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleShortlist(rankedCandidates[1])}
                  className="text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Shortlist
                </Button>
                <Link to={`/screening?candidateId=${rankedCandidates[1].id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Scorecard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rank 1 (Gold) */}
          <Card className="order-1 md:order-2 border-amber-300 bg-gradient-to-b from-amber-50/50 via-white to-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-extrabold shadow-sm">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <img
                src={rankedCandidates[0].candidateAvatar}
                alt={rankedCandidates[0].candidateName}
                className="w-20 h-20 rounded-full object-cover mx-auto border-3 border-amber-400 shadow-md"
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wider">
                  Top Recommended Fit
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{rankedCandidates[0].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[0].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[0].aiAnalysis?.matchScore} size="lg" />
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleShortlist(rankedCandidates[0])}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Shortlist Candidate
                </Button>
                <Link to={`/screening?candidateId=${rankedCandidates[0].id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Scorecard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rank 3 (Bronze) */}
          <Card className="order-3 border-slate-200 bg-gradient-to-b from-orange-50/30 to-white">
            <CardContent className="p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold shadow-xs">
                #3
              </div>
              <img
                src={rankedCandidates[2].candidateAvatar}
                alt={rankedCandidates[2].candidateName}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-orange-200"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{rankedCandidates[2].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[2].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[2].aiAnalysis?.matchScore} size="md" />
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleShortlist(rankedCandidates[2])}
                  className="text-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Shortlist
                </Button>
                <Link to={`/screening?candidateId=${rankedCandidates[2].id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Scorecard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Ranked Candidates Directory</CardTitle>
              <Badge variant="neutral" size="sm">
                {rankedCandidates.length} Matching
              </Badge>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Check compare boxes for head-to-head comparison · Click actions to Shortlist or Reject
            </p>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">Compare</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Target Role</th>
                <th className="px-4 py-3">Overall Relevance</th>
                <th className="px-4 py-3">Technical</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Current Stage</th>
                <th className="px-4 py-3 text-center">Recruiter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No candidates match the specified filter and score threshold criteria.
                  </td>
                </tr>
              ) : (
                rankedCandidates.map((app, index) => {
                  const isSelected = selectedForCompare.includes(app.id)
                  const isShortlisted = app.status === 'SHORTLISTED' || app.isShortlisted
                  const isRejected = app.status === 'REJECTED'

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Compare Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCompare(app.id)}
                          className="rounded accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Rank badge */}
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            index === 0
                              ? 'bg-amber-100 text-amber-800'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-slate-400'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      {/* Candidate profile */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={app.candidateAvatar}
                            alt={app.candidateName}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{app.candidateName}</p>
                            <p className="text-[11px] text-slate-400">{app.candidateEmail}</p>
                            {/* Skills Preview */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(app.aiAnalysis?.matchedSkills || []).slice(0, 3).map(s => (
                                <span
                                  key={s}
                                  className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[9px] font-semibold border border-emerald-100"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Opening */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{app.jobTitle}</p>
                        <span className="text-[10px] text-slate-400">{app.jobDepartment}</span>
                      </td>

                      {/* Overall Fit score */}
                      <td className="px-4 py-3.5">
                        <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" />
                      </td>

                      {/* Technical Score */}
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {app.aiAnalysis?.technicalSkillsScore || app.aiAnalysis?.matchScore || 0}%
                      </td>

                      {/* Experience Score */}
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {app.aiAnalysis?.experienceScore || 0}%
                      </td>

                      {/* Stage status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isShortlisted
                              ? 'bg-blue-100 text-blue-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : app.status === 'SELECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Recruiter Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Shortlist action */}
                          <button
                            onClick={() => handleShortlist(app)}
                            disabled={isShortlisted}
                            title={isShortlisted ? 'Already Shortlisted' : 'Shortlist Candidate'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isShortlisted
                                ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-default'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Reject action */}
                          <button
                            onClick={() => openRejectModal(app)}
                            disabled={isRejected}
                            title={isRejected ? 'Already Rejected' : 'Reject with Recorded Reason'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isRejected
                                ? 'bg-rose-50 border-rose-200 text-rose-400 cursor-default'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>

                          {/* Status history audit */}
                          <button
                            onClick={() => openHistoryModal(app)}
                            title="View Status Transition History"
                            className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Scorecard link */}
                          <Link to={`/screening?candidateId=${app.id}`}>
                            <button
                              title="Inspect Full AI Scorecard"
                              className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Candidate Modal with Recorded Reason */}
      {targetRejectApp && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Candidate Application"
          description={`Record reason for rejecting ${targetRejectApp.candidateName} for ${targetRejectApp.jobTitle}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800">
              <p className="font-semibold">Audit Record Notice</p>
              <p className="text-[11px] mt-0.5">
                The reason you provide will be logged in PostgreSQL and preserved in the candidate's recruitment timeline.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Standard Rejection Reason:</label>
              <select
                value={selectedPresetReason}
                onChange={e => setSelectedPresetReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-rose-500"
              >
                {REJECTION_PRESETS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Custom Recruiter Note / Additional Remarks (Optional):</label>
              <textarea
                value={customRejectReason}
                onChange={e => setCustomRejectReason(e.target.value)}
                placeholder="Add specific feedback or interview notes justifying the rejection..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-rose-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm & Record Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Candidate Status History Audit Modal */}
      {targetHistoryApp && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Recruitment Stage Audit Trail"
          description={`Full transition history for ${targetHistoryApp.candidateName} (${targetHistoryApp.jobTitle})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">{targetHistoryApp.candidateName}</p>
                <p className="text-[11px] text-slate-500">{targetHistoryApp.candidateEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Current Stage</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {targetHistoryApp.status}
                </span>
              </div>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(targetHistoryApp.statusHistory || []).length === 0 ? (
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Stage: {targetHistoryApp.status}</span>
                      <span className="text-[10px] text-slate-400">{targetHistoryApp.appliedDate}</span>
                    </div>
                    <p className="text-slate-600">Application submitted and evaluated via AI screening pipeline.</p>
                  </div>
                </div>
              ) : (
                targetHistoryApp.statusHistory?.map(hist => (
                  <div key={hist.id} className="relative">
                    <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      hist.toStatus === 'REJECTED'
                        ? 'bg-rose-500'
                        : hist.toStatus === 'SHORTLISTED'
                        ? 'bg-blue-500'
                        : hist.toStatus === 'SELECTED'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`} />
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{hist.reason}</p>
                      {hist.changedByName && (
                        <p className="text-[10px] text-slate-400">By: {hist.changedByName}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Side-by-Side Candidate Comparison Modal */}
      {compareCandidates.length === 2 && (
        <Modal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          title="Head-to-Head Candidate AI Evaluation"
          description="Side-by-side comparison of competencies, experience, and Gemini fit verdicts"
          maxWidth="4xl"
        >
          <div className="grid grid-cols-2 gap-6 text-xs divide-x divide-slate-200">
            {compareCandidates.map((cand, idx) => (
              <div key={cand.id} className={`space-y-4 ${idx === 1 ? 'pl-6' : ''}`}>
                <div className="flex items-center gap-3">
                  <img
                    src={cand.candidateAvatar}
                    alt={cand.candidateName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cand.candidateName}</h4>
                    <p className="text-slate-500">{cand.jobTitle}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Overall AI Match</span>
                  <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                    {cand.aiAnalysis?.matchScore}%
                  </div>
                  <Badge variant="purple" size="sm" className="mt-1">
                    {cand.aiAnalysis?.verdict}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Technical Competence:</span>
                    <span>{cand.aiAnalysis?.technicalSkillsScore}%</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Experience Depth:</span>
                    <span>{cand.aiAnalysis?.experienceScore}% ({cand.aiAnalysis?.extractedExperienceYears} yrs)</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Education:</span>
                    <span>{cand.aiAnalysis?.highestEducation}</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">Demonstrated Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {(cand.aiAnalysis?.matchedSkills || []).map(s => (
                      <Badge key={s} variant="success" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">Missing Requirements:</span>
                  <div className="flex flex-wrap gap-1">
                    {(cand.aiAnalysis?.missingSkills || []).length === 0 ? (
                      <span className="text-slate-400">None detected</span>
                    ) : (
                      cand.aiAnalysis?.missingSkills.map(s => (
                        <Badge key={s} variant="danger" size="sm">
                          {s}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg text-slate-700 border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1">AI Verdict:</span>
                  <p className="leading-relaxed">{cand.aiAnalysis?.summary}</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleShortlist(cand)
                      setCompareModalOpen(false)
                    }}
                    className="w-full text-xs"
                  >
                    Shortlist {cand.candidateName.split(' ')[0]}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

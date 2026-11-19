import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch,
  Sparkles,
  ChevronRight,
  ArrowRight,
  XCircle,
  Clock,
  Briefcase,
  Search,
  X,
  History,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronLeft
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Modal } from '../components/ui/Modal'
import { ApplicationStatus, Application } from '../types'

interface StageConfig {
  id: ApplicationStatus;
  label: string;
  badgeColor: string;
  dotColor: string;
  headerBg: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'APPLIED',
    label: 'Applied',
    badgeColor: 'bg-slate-100 text-slate-700',
    dotColor: 'bg-slate-500',
    headerBg: 'border-slate-300'
  },
  {
    id: 'SCREENING',
    label: 'Resume Screening',
    badgeColor: 'bg-indigo-50 text-indigo-700',
    dotColor: 'bg-indigo-500',
    headerBg: 'border-indigo-300'
  },
  {
    id: 'SHORTLISTED',
    label: 'Shortlisted',
    badgeColor: 'bg-blue-50 text-blue-700',
    dotColor: 'bg-blue-500',
    headerBg: 'border-blue-300'
  },
  {
    id: 'INTERVIEW_SCHEDULED',
    label: 'Interview Scheduled',
    badgeColor: 'bg-purple-50 text-purple-700',
    dotColor: 'bg-purple-500',
    headerBg: 'border-purple-300'
  },
  {
    id: 'INTERVIEW_COMPLETED',
    label: 'Interview Completed',
    badgeColor: 'bg-violet-50 text-violet-700',
    dotColor: 'bg-violet-500',
    headerBg: 'border-violet-300'
  },
  {
    id: 'SELECTED',
    label: 'Selected',
    badgeColor: 'bg-emerald-50 text-emerald-700',
    dotColor: 'bg-emerald-500',
    headerBg: 'border-emerald-300'
  },
  {
    id: 'REJECTED',
    label: 'Rejected',
    badgeColor: 'bg-rose-50 text-rose-700',
    dotColor: 'bg-rose-500',
    headerBg: 'border-rose-300'
  }
]

const REJECTION_PRESETS = [
  'Missing required core technical skills',
  'Insufficient domain & production experience',
  'Salary expectations exceed requisition budget',
  'Did not meet minimum education benchmark',
  'Failed technical screening evaluation',
  'Location or relocation mismatch',
  'Culture / communication mismatch'
]

// Normalizes legacy statuses to the 7 canonical pipeline stages
const normalizeStage = (status: string): ApplicationStatus => {
  if (status === 'INTERVIEW') return 'INTERVIEW_SCHEDULED'
  if (status === 'OFFERED' || status === 'HIRED') return 'SELECTED'
  return status as ApplicationStatus
}

export const PipelinePage: React.FC = () => {
  const { applications, jobs, updateApplicationStatus, shortlistCandidate, rejectCandidate } = useApp()

  const [selectedJobId, setSelectedJobId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Drag and drop state
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<ApplicationStatus | null>(null)

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [targetRejectApp, setTargetRejectApp] = useState<Application | null>(null)
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>(REJECTION_PRESETS[0])
  const [customRejectReason, setCustomRejectReason] = useState<string>('')

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [targetHistoryApp, setTargetHistoryApp] = useState<Application | null>(null)

  // Move stage modal
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [targetMoveApp, setTargetMoveApp] = useState<Application | null>(null)
  const [selectedTargetStage, setSelectedTargetStage] = useState<ApplicationStatus>('SHORTLISTED')
  const [moveReason, setMoveReason] = useState<string>('')

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Filter candidates
  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      const matchesJob = selectedJobId === 'ALL' || a.jobId === selectedJobId
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        a.candidateName.toLowerCase().includes(q) ||
        a.candidateEmail.toLowerCase().includes(q) ||
        (a.aiAnalysis?.matchedSkills || []).some(s => s.toLowerCase().includes(q)) ||
        (a.candidateSkills || []).some(s => s.toLowerCase().includes(q))

      return matchesJob && matchesSearch
    })
  }, [applications, selectedJobId, searchQuery])

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId)
    setDraggingAppId(appId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: ApplicationStatus) => {
    e.preventDefault()
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId)
    }
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, stageId: ApplicationStatus) => {
    e.preventDefault()
    setDragOverStage(null)
    const appId = e.dataTransfer.getData('text/plain') || draggingAppId
    if (!appId) return

    const app = applications.find(a => a.id === appId)
    if (!app) return

    if (stageId === 'REJECTED') {
      openRejectModal(app)
      return
    }

    if (stageId === 'SHORTLISTED') {
      shortlistCandidate(app.id, 'Candidate dragged to Shortlisted stage in Kanban board.')
      showToast(`✔ ${app.candidateName} shortlisted!`)
    } else {
      updateApplicationStatus(app.id, stageId, `Moved to ${stageId} via Kanban drag & drop.`)
      showToast(`✔ Moved ${app.candidateName} to ${stageId.replace('_', ' ')}.`)
    }
    setDraggingAppId(null)
  }

  // Advance to next stage helper
  const getNextStage = (current: ApplicationStatus): ApplicationStatus | null => {
    const norm = normalizeStage(current)
    const order: ApplicationStatus[] = [
      'APPLIED',
      'SCREENING',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_COMPLETED',
      'SELECTED'
    ]
    const idx = order.indexOf(norm)
    if (idx >= 0 && idx < order.length - 1) {
      return order[idx + 1]
    }
    return null
  }

  const openRejectModal = (app: Application) => {
    setTargetRejectApp(app)
    setSelectedPresetReason(REJECTION_PRESETS[0])
    setCustomRejectReason('')
    setRejectModalOpen(true)
  }

  const handleConfirmReject = () => {
    if (!targetRejectApp) return
    const finalReason = customRejectReason.trim() || selectedPresetReason
    rejectCandidate(targetRejectApp.id, finalReason)
    showToast(`✖ ${targetRejectApp.candidateName} moved to Rejected with audit reason.`)
    setRejectModalOpen(false)
    setTargetRejectApp(null)
  }

  const openHistoryModal = (app: Application) => {
    setTargetHistoryApp(app)
    setHistoryModalOpen(true)
  }

  const openMoveModal = (app: Application) => {
    setTargetMoveApp(app)
    setSelectedTargetStage(normalizeStage(app.status))
    setMoveReason('')
    setMoveModalOpen(true)
  }

  const handleConfirmMove = () => {
    if (!targetMoveApp) return
    if (selectedTargetStage === 'REJECTED') {
      setMoveModalOpen(false)
      openRejectModal(targetMoveApp)
      return
    }
    updateApplicationStatus(
      targetMoveApp.id,
      selectedTargetStage,
      moveReason.trim() || `Moved to ${selectedTargetStage} by recruiter.`
    )
    showToast(`✔ Updated ${targetMoveApp.candidateName} to ${selectedTargetStage.replace('_', ' ')}.`)
    setMoveModalOpen(false)
    setTargetMoveApp(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Pipeline Board</h1>
            <Badge variant="purple" size="sm">
              <GitBranch className="w-3 h-3 mr-1" /> Interactive Kanban
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag & drop candidates across recruitment stages from ingestion to final selection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/ranking">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> AI Stack Rankings
            </Button>
          </Link>
        </div>
      </div>

      {/* Human in the loop Ethical AI banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-700">
        <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold text-slate-900">Recruiter Governance:</span> AI provides relevance scoring and skill match insights. Stage progression, shortlisting, and final hiring decisions are always made and logged by human recruiters.
        </p>
      </div>

      {/* Toolbar: Search and Filter by Opening */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate or skill in pipeline..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
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

        {/* Job Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Filter Opening:</span>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 w-full sm:w-72"
          >
            <option value="ALL">All Requisitions ({jobs.length})</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        {STAGES.map(stage => {
          const stageApps = filteredApps.filter(a => normalizeStage(a.status) === stage.id)
          const isOver = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={e => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage.id)}
              className={`w-72 shrink-0 rounded-2xl p-3 border transition-all flex flex-col max-h-[75vh] ${
                isOver
                  ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-300'
                  : 'bg-slate-100/70 border-slate-200/80'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                  <h3 className="font-bold text-slate-800 text-xs tracking-tight">{stage.label}</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards Scrollable Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
                {stageApps.length === 0 ? (
                  <div className="py-10 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                    Drop candidates here
                  </div>
                ) : (
                  stageApps.map(app => {
                    const nextStage = getNextStage(app.status)
                    const isShortlisted = app.status === 'SHORTLISTED' || app.isShortlisted

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={e => handleDragStart(e, app.id)}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all text-xs space-y-2.5 cursor-grab active:cursor-grabbing"
                      >
                        {/* Top row: Avatar + Name + ScoreBadge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={app.candidateAvatar}
                              alt={app.candidateName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{app.candidateName}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[125px]">{app.jobTitle}</p>
                            </div>
                          </div>
                          <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" showLabel={false} />
                        </div>

                        {/* Matched skills chips */}
                        <div className="flex flex-wrap gap-1">
                          {(app.aiAnalysis?.matchedSkills || []).slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-emerald-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Card Rejection reason if present */}
                        {app.rejectionReason && stage.id === 'REJECTED' && (
                          <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 text-[10px] text-rose-800">
                            <span className="font-bold block">Rejection Reason:</span>
                            <p className="line-clamp-2 mt-0.5">{app.rejectionReason}</p>
                          </div>
                        )}

                        {/* Card Footer Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {/* Scorecard link */}
                          <Link
                            to={`/screening?candidateId=${app.id}`}
                            className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Scorecard
                          </Link>

                          {/* Quick stage actions */}
                          <div className="flex items-center gap-1">
                            {/* View History Audit */}
                            <button
                              onClick={() => openHistoryModal(app)}
                              title="Audit Timeline"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Move stage modal picker */}
                            <button
                              onClick={() => openMoveModal(app)}
                              title="Move to any stage"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                            </button>

                            {/* Reject button */}
                            {stage.id !== 'REJECTED' && (
                              <button
                                onClick={() => openRejectModal(app)}
                                title="Reject with Recorded Reason"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Advance Next Button */}
                            {nextStage && (
                              <button
                                onClick={() => {
                                  updateApplicationStatus(
                                    app.id,
                                    nextStage,
                                    `Advanced to ${nextStage} via quick advance button.`
                                  )
                                  showToast(`Advanced ${app.candidateName} to ${nextStage.replace('_', ' ')}`)
                                }}
                                title={`Advance to ${nextStage.replace('_', ' ')}`}
                                className="flex items-center gap-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                              >
                                Next <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

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
                The reason you provide will be saved in PostgreSQL and logged in the candidate's recruitment stage history.
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

      {/* Move Stage Modal Picker */}
      {targetMoveApp && (
        <Modal
          isOpen={moveModalOpen}
          onClose={() => setMoveModalOpen(false)}
          title="Move Candidate Stage"
          description={`Update pipeline stage for ${targetMoveApp.candidateName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Select Target Stage:</label>
              <select
                value={selectedTargetStage}
                onChange={e => setSelectedTargetStage(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Transition Note / Reason (Optional):</label>
              <input
                type="text"
                value={moveReason}
                onChange={e => setMoveReason(e.target.value)}
                placeholder="e.g., Passed technical screening; advanced to interview."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setMoveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmMove}>
                Update Stage
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
          description={`Full pipeline progression for ${targetHistoryApp.candidateName} (${targetHistoryApp.jobTitle})`}
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
    </div>
  )
}

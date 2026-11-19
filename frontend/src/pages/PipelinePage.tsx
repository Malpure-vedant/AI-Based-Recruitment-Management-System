import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch,
  Sparkles,
  ChevronRight,
  ArrowRight,
  XCircle,
  Clock,
  Briefcase
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { ApplicationStatus, Application } from '../types'

const STAGES: { id: ApplicationStatus; label: string; color: string; border: string }[] = [
  { id: 'APPLIED', label: 'Applied', color: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { id: 'SCREENING', label: 'AI Screened', color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
  { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
  { id: 'INTERVIEW', label: 'Interview Round', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
  { id: 'OFFERED', label: 'Offer Extended', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  { id: 'HIRED', label: 'Hired', color: 'bg-teal-50 text-teal-700', border: 'border-teal-200' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' }
]

export const PipelinePage: React.FC = () => {
  const { applications, jobs, updateApplicationStatus } = useApp()
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL')

  const filteredApps = useMemo(() => {
    return applications.filter(a => selectedJobId === 'ALL' || a.jobId === selectedJobId)
  }, [applications, selectedJobId])

  const getNextStage = (current: ApplicationStatus): ApplicationStatus | null => {
    switch (current) {
      case 'APPLIED':
        return 'SCREENING'
      case 'SCREENING':
        return 'SHORTLISTED'
      case 'SHORTLISTED':
        return 'INTERVIEW'
      case 'INTERVIEW':
        return 'OFFERED'
      case 'OFFERED':
        return 'HIRED'
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Pipeline Board</h1>
            <Badge variant="purple" size="sm">
              <GitBranch className="w-3 h-3 mr-1" /> Dynamic Kanban
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual stage management from candidate application ingestion to offer sign-off.
          </p>
        </div>

        {/* Job Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Filter Opening:</span>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 w-full sm:w-72"
          >
            <option value="ALL">All Active Requisitions</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {STAGES.map(stage => {
          const stageApps = filteredApps.filter(a => a.status === stage.id)

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    stage.id === 'HIRED' || stage.id === 'OFFERED'
                      ? 'bg-emerald-500'
                      : stage.id === 'REJECTED'
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`} />
                  <h3 className="font-bold text-slate-800 text-xs">{stage.label}</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
                {stageApps.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No candidates in this stage
                  </div>
                ) : (
                  stageApps.map(app => {
                    const nextStage = getNextStage(app.status)

                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={app.candidateAvatar}
                              alt={app.candidateName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{app.candidateName}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{app.jobTitle}</p>
                            </div>
                          </div>
                          <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" showLabel={false} />
                        </div>

                        {/* Skills mini preview */}
                        <div className="flex flex-wrap gap-1">
                          {(app.aiAnalysis?.matchedSkills || []).slice(0, 2).map(skill => (
                            <span
                              key={skill}
                              className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium border border-slate-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            to={`/screening?candidateId=${app.id}`}
                            className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Scorecard
                          </Link>

                          <div className="flex items-center gap-1">
                            {stage.id !== 'REJECTED' && (
                              <button
                                onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                                title="Reject Candidate"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextStage && (
                              <button
                                onClick={() => updateApplicationStatus(app.id, nextStage)}
                                title={`Advance to ${nextStage}`}
                                className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-md transition-colors"
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
    </div>
  )
}

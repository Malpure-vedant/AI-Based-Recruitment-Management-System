import React, { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Layers
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { ApplicationStatus } from '../types'

export const ScreeningPage: React.FC = () => {
  const { applications, jobs, updateApplicationStatus } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const candidateIdParam = searchParams.get('candidateId')
  const defaultAppId = candidateIdParam || applications[0]?.id || ''
  const [selectedAppId, setSelectedAppId] = useState<string>(defaultAppId)
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null)

  const activeApp = useMemo(() => {
    return applications.find(a => a.id === selectedAppId) || applications[0]
  }, [applications, selectedAppId])

  const targetJob = useMemo(() => {
    if (!activeApp) return null
    return jobs.find(j => j.id === activeApp.jobId) || null
  }, [jobs, activeApp])

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedQuestion(index)
    setTimeout(() => setCopiedQuestion(null), 2000)
  }

  const handleStageAction = (newStatus: ApplicationStatus) => {
    if (!activeApp) return
    updateApplicationStatus(activeApp.id, newStatus)
  }

  if (!activeApp || !activeApp.aiAnalysis) {
    return (
      <div className="p-8 text-center text-slate-500">
        No candidate application selected for AI screening.
      </div>
    )
  }

  const { aiAnalysis } = activeApp

  return (
    <div className="space-y-6">
      {/* Top Header & Candidate Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Resume Screening & Scorecard</h1>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Gemini 1.5 Flash
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explainable AI rubric scoring, skill verification, and contextual interview probe generation.
          </p>
        </div>

        {/* Candidate Switcher dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Select Applicant:</span>
          <select
            value={activeApp.id}
            onChange={e => {
              setSelectedAppId(e.target.value)
              setSearchParams({ candidateId: e.target.value })
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
          >
            {applications.map(app => (
              <option key={app.id} value={app.id}>
                {app.candidateName} — {app.aiAnalysis?.matchScore}% ({app.jobTitle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Profile Overview Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={activeApp.candidateAvatar}
            alt={activeApp.candidateName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{activeApp.candidateName}</h2>
              <Badge
                variant={
                  activeApp.status === 'SHORTLISTED' || activeApp.status === 'OFFERED'
                    ? 'success'
                    : activeApp.status === 'REJECTED'
                    ? 'danger'
                    : activeApp.status === 'INTERVIEW'
                    ? 'purple'
                    : 'neutral'
                }
              >
                {activeApp.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Applying for <span className="font-semibold text-slate-900">{activeApp.jobTitle}</span> ({activeApp.jobDepartment})
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span>{activeApp.candidateEmail}</span>
              <span>·</span>
              <span>{aiAnalysis.extractedExperienceYears} Years Experience</span>
              <span>·</span>
              <span>{aiAnalysis.highestEducation}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleStageAction('SHORTLISTED')}
            disabled={activeApp.status === 'SHORTLISTED'}
          >
            <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Shortlist
          </Button>

          <Link to={`/interviews?candidate=${encodeURIComponent(activeApp.candidateName)}`}>
            <Button variant="primary" size="sm">
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule Round
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            onClick={() => handleStageAction('REJECTED')}
            disabled={activeApp.status === 'REJECTED'}
          >
            <ThumbsDown className="w-3.5 h-3.5 mr-1.5" /> Reject
          </Button>
        </div>
      </div>

      {/* Dimensional Scoring Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Match */}
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Overall AI Match
              </span>
              <div className="text-4xl font-extrabold text-white mt-2">
                {aiAnalysis.matchScore}%
              </div>
              <Badge variant="purple" size="sm" className="mt-2 bg-indigo-500/30 text-indigo-200 border-indigo-400/30">
                {aiAnalysis.verdict}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">
              Calibrated by custom requisition weights
            </p>
          </CardContent>
        </Card>

        {/* Technical Score */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Technical Skills</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{aiAnalysis.technicalSkillsScore}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${aiAnalysis.technicalSkillsScore}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">Weight: 40%</span>
          </CardContent>
        </Card>

        {/* Experience Score */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Relevant Experience</span>
              <Briefcase className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{aiAnalysis.experienceScore}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${aiAnalysis.experienceScore}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">Weight: 35%</span>
          </CardContent>
        </Card>

        {/* Education Score */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Education & Degrees</span>
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{aiAnalysis.educationScore}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${aiAnalysis.educationScore}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">Weight: 15%</span>
          </CardContent>
        </Card>

        {/* Domain Score */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Domain Fit</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{aiAnalysis.domainScore}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${aiAnalysis.domainScore}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">Weight: 10%</span>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Deep Dive: AI Summary & Skills Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Qualitative Evaluation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <CardTitle>Gemini Qualitative Assessment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {aiAnalysis.summary}
              </p>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Candidate Strengths
                </h4>
                <ul className="space-y-1.5 text-slate-600">
                  {aiAnalysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> Detected Areas of Concern / Gaps
                </h4>
                <ul className="space-y-1.5 text-slate-600">
                  {aiAnalysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-100">
                      <span className="text-rose-600 font-bold">!</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Skills Matrix & Resume Text */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Verification Matrix</CardTitle>
              <Badge variant="neutral" size="sm">
                Target Requisition Skills
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="block font-bold text-emerald-800 mb-2">
                  Verified Skills Demonstrated in Resume:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.matchedSkills.map(skill => (
                    <Badge key={skill} variant="success" size="md">
                      ✓ {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="block font-bold text-rose-800 mb-2">
                  Missing Skills Required by Job Requisition:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.missingSkills.length === 0 ? (
                    <span className="text-slate-400 italic">No missing requirements. 100% matched.</span>
                  ) : (
                    aiAnalysis.missingSkills.map(skill => (
                      <Badge key={skill} variant="danger" size="md">
                        ✕ {skill}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  PyMuPDF Extracted Resume Segment
                </span>
                <div className="p-3 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700 max-h-40 overflow-y-auto leading-relaxed border border-slate-200">
                  {activeApp.resumeRawTextSnippet}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Interview Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <CardTitle>AI Contextual Interview Questions</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">Tailored to Candidate Gaps</span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {aiAnalysis.suggestedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-800 leading-relaxed">
                      <span className="font-bold text-indigo-600 mr-1.5">Q{idx + 1}:</span>
                      {q}
                    </p>
                    <button
                      onClick={() => handleCopyQuestion(q, idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 shrink-0"
                      title="Copy Question to Clipboard"
                    >
                      {copiedQuestion === idx ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

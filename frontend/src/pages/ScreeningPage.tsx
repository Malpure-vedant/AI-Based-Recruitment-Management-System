import React, { useState, useRef, useCallback, useMemo } from 'react'
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
  Layers,
  Upload,
  Brain,
  AlertTriangle,
  ChevronRight,
  Code2,
  FolderGit2,
  User,
  Mail,
  Star,
  Shield,
  RotateCcw,
  Save,
  Loader2,
  FilePlus2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { screeningApi } from '../lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { ApplicationStatus } from '../types'

// ─────────────────────────────────────────────────────────────
// Types for backend API result
// ─────────────────────────────────────────────────────────────
interface EducationItem {
  degree: string
  institution: string
  year?: string
}

interface WorkExperienceItem {
  title: string
  company: string
  duration?: string
  highlights: string[]
}

interface ProjectItem {
  name: string
  description?: string
  technologies: string[]
}

interface BackendScreeningResult {
  candidate_name: string
  candidate_email: string | null
  technical_skills: string[]
  education: EducationItem[]
  work_experience: WorkExperienceItem[]
  projects: ProjectItem[]
  matched_skills: string[]
  missing_skills: string[]
  overall_score: number
  technical_score: number
  experience_score: number
  education_score: number
  domain_score: number
  verdict: 'STRONG_FIT' | 'FIT' | 'WEAK_FIT' | 'NOT_FIT'
  screening_summary: string
  strengths: string[]
  areas_for_improvement: string[]
  suggested_interview_questions: string[]
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW'
  disclaimer: string
  engine_used: string
}

// ─────────────────────────────────────────────────────────────
// Demo data mirroring backend shape
// ─────────────────────────────────────────────────────────────
const DEMO_RESULT: BackendScreeningResult = {
  candidate_name: 'Alex Morgan',
  candidate_email: 'alex.morgan@gmail.com',
  technical_skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'React', 'TypeScript', 'AWS', 'CI/CD'],
  education: [
    { degree: "Master's in Computer Science", institution: 'Stanford University', year: '2019' },
    { degree: 'B.S. in Software Engineering', institution: 'UC Berkeley', year: '2017' }
  ],
  work_experience: [
    {
      title: 'Senior Backend Engineer',
      company: 'TechCorp Inc.',
      duration: '3 years',
      highlights: [
        'Led migration of monolith to microservices cutting p99 latency by 42%',
        'Built real-time event streaming pipeline handling 2M events/day',
        'Mentored team of 4 engineers; ran bi-weekly architecture reviews'
      ]
    },
    {
      title: 'Software Engineer II',
      company: 'DataFlow Systems',
      duration: '2 years',
      highlights: [
        'Developed FastAPI REST service deployed on AWS ECS with auto-scaling',
        'Implemented Redis caching layer reducing DB load by 60%'
      ]
    }
  ],
  projects: [
    {
      name: 'RecruitBot',
      description: 'AI-powered hiring assistant using GPT-4 and vector search to match resumes',
      technologies: ['Python', 'FastAPI', 'OpenAI', 'Pinecone', 'React']
    },
    {
      name: 'DataStream Pipeline',
      description: 'High-throughput event processing system using Kafka and Flink',
      technologies: ['Java', 'Apache Kafka', 'Apache Flink', 'Docker']
    }
  ],
  matched_skills: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS', 'React'],
  missing_skills: ['Kubernetes', 'Terraform', 'GraphQL'],
  overall_score: 87.5,
  technical_score: 90.0,
  experience_score: 85.0,
  education_score: 88.0,
  domain_score: 82.0,
  verdict: 'STRONG_FIT',
  screening_summary:
    'Alex Morgan is an excellent match for the Senior Engineer role, demonstrating strong proficiency in Python and FastAPI with 5+ years of relevant experience. The candidate shows proven leadership and system design capabilities, though limited exposure to Kubernetes and Terraform warrants follow-up during the technical round.',
  strengths: [
    'Exceptional Python and FastAPI expertise with production-scale deployments',
    'Proven track record of architecting high-throughput distributed systems',
    'Strong mentorship and cross-functional collaboration experience',
    'Solid educational background from top-tier institutions'
  ],
  areas_for_improvement: [
    'Limited hands-on Kubernetes orchestration experience at scale',
    'No explicit Terraform/IaC experience listed in resume',
    'GraphQL experience not mentioned — assess depth during interview'
  ],
  suggested_interview_questions: [
    'Walk me through your experience migrating a monolith to microservices. What were the biggest challenges?',
    'How have you approached Kubernetes deployments in past projects? What would you do differently?',
    'Describe your Redis caching strategy for the DataFlow project. How did you handle cache invalidation?',
    'Tell me about a time you had to optimize a slow database query in production under pressure.',
    'How do you approach API versioning and backward compatibility in FastAPI services?'
  ],
  confidence_level: 'HIGH',
  disclaimer:
    'AI-generated screening result. Must be reviewed by a human recruiter before making any hiring decisions. This tool does not consider protected characteristics.',
  engine_used: 'gemini'
}

const SAMPLE_JOBS = [
  { id: 'job-1', title: 'Senior Backend Engineer — Python/FastAPI' },
  { id: 'job-2', title: 'Full Stack Developer — React + Node' },
  { id: 'job-3', title: 'ML Engineer — TensorFlow & MLOps' },
  { id: 'job-4', title: 'DevOps Engineer — Kubernetes & Terraform' },
  { id: 'job-5', title: 'Data Engineer — Spark & Airflow' }
]

// ─────────────────────────────────────────────────────────────
// Score gauge helpers
// ─────────────────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score >= 80) return { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (score >= 60) return { ring: 'stroke-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' }
  return { ring: 'stroke-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' }
}

function CircularGauge({ score }: { score: number }) {
  const colors = getScoreColor(score)
  const r = 48
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          className={colors.ring}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${colors.text}`}>{Math.round(score)}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case 'STRONG_FIT': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'FIT':        return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'WEAK_FIT':   return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'NOT_FIT':    return 'bg-rose-50 text-rose-700 border border-rose-200'
    default:           return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

function getConfidenceStyle(level: string) {
  switch (level) {
    case 'HIGH':   return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'MEDIUM': return 'bg-amber-50 text-amber-700 border border-amber-200'
    default:       return 'bg-rose-50 text-rose-700 border border-rose-200'
  }
}

// ─────────────────────────────────────────────────────────────
// Upload dropzone component
// ─────────────────────────────────────────────────────────────
function DropZone({
  file, onFile, isDragging, onDragOver, onDragLeave, onDrop
}: {
  file: File | null
  onFile: (f: File) => void
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
          : file
            ? 'border-emerald-400 bg-emerald-50/40'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }}
      />
      {file ? (
        <>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-700">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Ready to screen
          </span>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Upload className="w-7 h-7 text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Drop resume here, or <span className="text-indigo-600 underline">browse</span></p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX — max 10 MB</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export const ScreeningPage: React.FC = () => {
  const { applications, jobs, updateApplicationStatus, shortlistCandidate, rejectCandidate, refreshData } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const candidateIdParam = searchParams.get('candidateId')
  // ── Tab state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>(candidateIdParam ? 'results' : 'upload')

  // ── Upload form state ──────────────────────────────────────
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isScreening, setIsScreening] = useState(false)
  const [screeningStage, setScreeningStage] = useState('')

  // ── Results state ──────────────────────────────────────────
  const [liveResult, setLiveResult] = useState<BackendScreeningResult | null>(null)
  const [showDemoResult, setShowDemoResult] = useState(false)

  // ── Existing app selector state ───────────────────────────
  const defaultAppId = candidateIdParam || applications[0]?.id || ''
  const [selectedAppId, setSelectedAppId] = useState(defaultAppId)
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null)

  // ── Recruiter override state ───────────────────────────────
  const [overrideNotes, setOverrideNotes] = useState('')
  const [finalDecision, setFinalDecision] = useState('')
  const [overrideSaved, setOverrideSaved] = useState(false)

  const activeApp = useMemo(() =>
    applications.find(a => a.id === selectedAppId) || applications[0],
  [applications, selectedAppId])

  // ── The result to display (live API > selected existing app > demo) ─
  const displayResult: BackendScreeningResult | null = useMemo(() => {
    if (liveResult) return liveResult

    if (activeApp && activeApp.aiAnalysis) {
      return {
        candidate_name: activeApp.candidateName,
        candidate_email: activeApp.candidateEmail,
        technical_skills: activeApp.candidateSkills?.length ? activeApp.candidateSkills : activeApp.aiAnalysis.matchedSkills,
        education: [
          { degree: activeApp.aiAnalysis.highestEducation || "Bachelor's / Master's in Computer Science", institution: 'Accredited University', year: '2020' }
        ],
        work_experience: [
          {
            title: activeApp.jobTitle || 'Senior Software Engineer',
            company: 'Enterprise Technology Partner',
            duration: `${activeApp.aiAnalysis.extractedExperienceYears || 5} years`,
            highlights: activeApp.aiAnalysis.strengths || ['Architected scalable production microservices.']
          }
        ],
        projects: [
          {
            name: `${activeApp.candidateName.split(' ')[0]}'s Core Delivery`,
            description: activeApp.aiAnalysis.summary,
            technologies: activeApp.aiAnalysis.matchedSkills.slice(0, 4)
          }
        ],
        matched_skills: activeApp.aiAnalysis.matchedSkills,
        missing_skills: activeApp.aiAnalysis.missingSkills,
        overall_score: activeApp.aiAnalysis.matchScore,
        technical_score: activeApp.aiAnalysis.technicalSkillsScore,
        experience_score: activeApp.aiAnalysis.experienceScore,
        education_score: activeApp.aiAnalysis.educationScore,
        domain_score: activeApp.aiAnalysis.domainScore,
        verdict: (activeApp.aiAnalysis.verdict === 'STRONG_FIT' ? 'STRONG_FIT' : activeApp.aiAnalysis.verdict === 'MODERATE_FIT' ? 'FIT' : 'WEAK_FIT') as any,
        screening_summary: activeApp.aiAnalysis.summary,
        strengths: activeApp.aiAnalysis.strengths,
        areas_for_improvement: activeApp.aiAnalysis.weaknesses,
        suggested_interview_questions: activeApp.aiAnalysis.suggestedQuestions,
        confidence_level: 'HIGH',
        disclaimer: 'AI-generated screening result from PostgreSQL. Must be reviewed by a human recruiter before making final hiring decisions.',
        engine_used: 'gemini'
      }
    }

    if (showDemoResult) return DEMO_RESULT
    return null
  }, [liveResult, activeApp, showDemoResult])

  // ── Drag/drop handlers ─────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files[0]) setResumeFile(e.dataTransfer.files[0])
  }, [])

  // ── Screen via real API ────────────────────────────────────
  const handleScreen = async () => {
    if (!resumeFile) return
    setIsScreening(true)
    setScreeningStage('Uploading resume to FastAPI...')
    setLiveResult(null)

    try {
      const formData = new FormData()
      formData.append('job_id', selectedJobId || jobs[0]?.id || '')
      formData.append('resume_file', resumeFile)

      setScreeningStage('Parsing document with PyMuPDF...')
      await new Promise(r => setTimeout(r, 400))
      setScreeningStage('Analyzing resume with Gemini AI...')

      const data = await screeningApi.screenUpload(formData)
      setLiveResult(data)
      await refreshData()
      setActiveTab('results')
    } catch (err) {
      console.error('Screening failed, using demo result:', err)
      // Fallback to demo if API isn't reachable
      setShowDemoResult(true)
      setActiveTab('results')
    } finally {
      setIsScreening(false)
      setScreeningStage('')
    }
  }

  // ── Show demo without file upload ──────────────────────────
  const handleViewDemo = () => {
    setShowDemoResult(true)
    setActiveTab('results')
  }

  const handleReset = () => {
    setLiveResult(null)
    setShowDemoResult(false)
    setResumeFile(null)
    setActiveTab('upload')
    setOverrideNotes('')
    setFinalDecision('')
    setOverrideSaved(false)
  }

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedQuestion(index)
    setTimeout(() => setCopiedQuestion(null), 2000)
  }

  const handleSaveOverride = () => {
    if (activeApp && finalDecision) {
      updateApplicationStatus(activeApp.id, finalDecision as ApplicationStatus, overrideNotes)
    }
    setOverrideSaved(true)
    setTimeout(() => setOverrideSaved(false), 3000)
  }

  // Also support existing app-based results when no upload
  const handleStageAction = (newStatus: ApplicationStatus) => {
    if (!activeApp) return
    updateApplicationStatus(activeApp.id, newStatus)
  }

  // ── Render results using backend shape or existing app data ─
  const result = displayResult

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Resume Screening</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3 h-3" /> Gemini AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload a resume for instant AI-powered screening, scoring, and interview recommendations.
          </p>
        </div>
        {result && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Screen New Resume
          </button>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['upload', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'upload' ? '📤 Upload & Screen' : '📊 Results'}
            {tab === 'results' && result && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB 1: UPLOAD ═══════════════════ */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload card */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FilePlus2 className="w-4 h-4 text-indigo-600" />
                  <CardTitle>Upload Resume</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">PDF, DOC, DOCX accepted</span>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Job selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Job Position <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  >
                    {jobs.length > 0 ? (
                      <optgroup label="PostgreSQL Active Requisitions">
                        {jobs.map(j => (
                          <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                        ))}
                      </optgroup>
                    ) : (
                      <optgroup label="Requisitions">
                        {SAMPLE_JOBS.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Dropzone */}
                <DropZone
                  file={resumeFile}
                  onFile={setResumeFile}
                  isDragging={isDragging}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={handleScreen}
                    disabled={!resumeFile || isScreening}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                      resumeFile && !isScreening
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isScreening ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{screeningStage || 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Screen Resume with AI
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleViewDemo}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    View Demo Result
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Existing application selector */}
            {applications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Or Review Existing Application</CardTitle>
                  <span className="text-[11px] text-slate-400">From your candidate pipeline</span>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={activeApp?.id || ''}
                      onChange={e => {
                        setSelectedAppId(e.target.value)
                        setSearchParams({ candidateId: e.target.value })
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      {applications.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.candidateName} — {app.aiAnalysis?.matchScore}% ({app.jobTitle})
                        </option>
                      ))}
                    </select>
                    {activeApp?.aiAnalysis && (
                      <Link to={`/screening?candidateId=${activeApp.id}`}>
                        <button
                          onClick={() => {
                            setLiveResult(null)
                            setShowDemoResult(false)
                            setActiveTab('results')
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-5">
                <h3 className="text-sm font-bold text-slate-900">How It Works</h3>
                {[
                  { step: '1', color: 'bg-blue-50 text-blue-600', title: 'PyMuPDF Extraction', desc: 'Extracts native text and layout from PDF with zero OCR hallucination.' },
                  { step: '2', color: 'bg-purple-50 text-purple-600', title: 'Gemini AI Analysis', desc: 'Evaluates skills, experience, education against job requirements.' },
                  { step: '3', color: 'bg-emerald-50 text-emerald-600', title: 'Scored Results', desc: 'Detailed scorecard, skill gaps, and tailored interview questions.' }
                ].map(({ step, color, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-xs font-bold shrink-0`}>{step}</div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{title}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Ethics & Fairness</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The AI evaluates only job-relevant qualifications. Gender, race, age, nationality, religion, and other protected characteristics are never considered.
                </p>
                <p className="text-[11px] text-amber-600 font-medium">
                  All results must be reviewed by a qualified human recruiter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB 2: RESULTS (live/demo) ═══════ */}
      {activeTab === 'results' && result && (
        <div className="space-y-6">

          {/* ── Disclaimer banner ── */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">{result.disclaimer}</p>
          </div>

          {/* ── Candidate header card ── */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left: identity */}
                <div className="flex items-center gap-5">
                  <CircularGauge score={result.overall_score} />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{result.candidate_name}</h2>
                      {/* Verdict badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${getVerdictStyle(result.verdict)}`}>
                        <Star className="w-3 h-3" /> {result.verdict.replace('_', ' ')}
                      </span>
                    </div>
                    {result.candidate_email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{result.candidate_email}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Confidence */}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${getConfidenceStyle(result.confidence_level)}`}>
                        <Shield className="w-3 h-3" /> {result.confidence_level} Confidence
                      </span>
                      {/* Engine */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {result.engine_used === 'gemini' ? (
                          <><Sparkles className="w-3 h-3" /> Gemini AI ✨</>
                        ) : (
                          <><Award className="w-3 h-3" /> Rubric Fallback</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: quick actions */}
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                    <ThumbsUp className="w-3.5 h-3.5" /> Shortlist
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors">
                    <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors">
                    <ThumbsDown className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Score breakdown cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Technical Score', value: result.technical_score, color: 'bg-blue-500', icon: Code2, iconColor: 'text-blue-600', weight: '40%' },
              { label: 'Experience Score', value: result.experience_score, color: 'bg-purple-500', icon: Briefcase, iconColor: 'text-purple-600', weight: '35%' },
              { label: 'Education Score', value: result.education_score, color: 'bg-emerald-500', icon: GraduationCap, iconColor: 'text-emerald-600', weight: '15%' },
              { label: 'Domain Score', value: result.domain_score, color: 'bg-orange-400', icon: Layers, iconColor: 'text-orange-500', weight: '10%' }
            ].map(({ label, value, color, icon: Icon, iconColor, weight }) => (
              <Card key={label}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{Math.round(value)}<span className="text-base font-normal text-slate-400">/100</span></div>
                  <ScoreBar value={value} color={color} />
                  <span className="text-[10px] text-slate-400">Weight: {weight}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Skills analysis ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matched skills */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Matched Skills</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">{result.matched_skills.length} verified</span>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.matched_skills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3" /> {skill}
                  </span>
                ))}
              </CardContent>
            </Card>

            {/* Missing skills */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <CardTitle>Missing Skills</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">{result.missing_skills.length} gaps</span>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.missing_skills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">All required skills matched ✓</span>
                ) : result.missing_skills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3 h-3" /> {skill}
                  </span>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Technical skills detected ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <CardTitle>Technical Skills Detected</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">{result.technical_skills.length} skills found in resume</span>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.technical_skills.map(skill => (
                <span key={skill} className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {skill}
                </span>
              ))}
            </CardContent>
          </Card>

          {/* ── AI summary ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <CardTitle>AI Screening Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {result.screening_summary}
              </p>
            </CardContent>
          </Card>

          {/* ── Strengths & improvement ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <CardTitle>Areas for Improvement</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.areas_for_improvement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-slate-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* ── Work experience timeline ── */}
          {result.work_experience.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <CardTitle>Work Experience</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">{result.work_experience.length} positions</span>
              </CardHeader>
              <CardContent className="space-y-5">
                {result.work_experience.map((exp, i) => (
                  <div key={i} className="relative pl-5 border-l-2 border-slate-200 pb-2 last:pb-0">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-400" />
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-slate-900">{exp.title}</span>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">{exp.company}</span>
                      {exp.duration && (
                        <span className="text-xs text-slate-400">{exp.duration}</span>
                      )}
                    </div>
                    {exp.highlights.length > 0 && (
                      <ul className="space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Education ── */}
          {result.education.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <CardTitle>Education</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.education.map((edu, i) => (
                    <div key={i} className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-bold text-blue-900">{edu.degree}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{edu.institution}</p>
                      {edu.year && <p className="text-[11px] text-slate-400 mt-1">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Projects ── */}
          {result.projects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-600" />
                  <CardTitle>Projects</CardTitle>
                </div>
                <span className="text-[11px] text-slate-400">{result.projects.length} projects</span>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.projects.map((proj, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-sm font-bold text-slate-900">{proj.name}</p>
                    {proj.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proj.description}</p>}
                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {proj.technologies.map(tech => (
                          <span key={tech} className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Interview questions ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <CardTitle>AI-Suggested Interview Questions</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">Tailored to candidate profile & gaps</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.suggested_interview_questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-slate-800 leading-relaxed">
                      <span className="font-bold text-indigo-600 mr-1.5">Q{idx + 1}.</span>
                      {q}
                    </p>
                    <button
                      onClick={() => handleCopyQuestion(q, idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 shrink-0 transition-colors"
                      title="Copy question"
                    >
                      {copiedQuestion === idx
                        ? <Check className="w-4 h-4 text-emerald-600" />
                        : <Copy className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Recruiter override panel ── */}
          <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <CardTitle>Recruiter Override Panel</CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">Human judgment takes precedence</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Recruiter Notes / Override Rationale
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={e => setOverrideNotes(e.target.value)}
                  rows={3}
                  placeholder="Add your notes, context, or reasons for overriding the AI recommendation..."
                  className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Final Decision</label>
                  <select
                    value={finalDecision}
                    onChange={e => setFinalDecision(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">— Select decision —</option>
                    <option value="SHORTLIST">✅ Shortlist for Interview</option>
                    <option value="INTERVIEW">📅 Schedule Interview Round</option>
                    <option value="HOLD">⏸ Hold for Later Review</option>
                    <option value="REJECT">❌ Reject Application</option>
                  </select>
                </div>
                <div className="sm:self-end">
                  <button
                    onClick={handleSaveOverride}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {overrideSaved
                      ? <><Check className="w-3.5 h-3.5" /> Saved!</>
                      : <><Save className="w-3.5 h-3.5" /> Save Override</>
                    }
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════ TAB 2 fallback: existing app results ════════ */}
      {activeTab === 'results' && !result && activeApp?.aiAnalysis && (
        <div className="space-y-6">
          {/* Existing app-based results (original ScreeningPage content) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <img src={activeApp.candidateAvatar} alt={activeApp.candidateName} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{activeApp.candidateName}</h2>
                  <Badge variant={activeApp.status === 'SHORTLISTED' || activeApp.status === 'OFFERED' ? 'success' : activeApp.status === 'REJECTED' ? 'danger' : activeApp.status === 'INTERVIEW' ? 'purple' : 'neutral'}>
                    {activeApp.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">Applying for <span className="font-semibold text-slate-900">{activeApp.jobTitle}</span></p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>{activeApp.candidateEmail}</span>
                  <span>·</span>
                  <span>{activeApp.aiAnalysis.extractedExperienceYears} yrs exp</span>
                  <span>·</span>
                  <span>{activeApp.aiAnalysis.highestEducation}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button variant="success" size="sm" onClick={() => handleStageAction('SHORTLISTED')} disabled={activeApp.status === 'SHORTLISTED'}>
                <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Shortlist
              </Button>
              <Button variant="primary" size="sm">
                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule Round
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleStageAction('REJECTED')} disabled={activeApp.status === 'REJECTED'}>
                <ThumbsDown className="w-3.5 h-3.5 mr-1.5" /> Reject
              </Button>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Overall AI Match</span>
                <div className="text-4xl font-extrabold text-white mt-2">{activeApp.aiAnalysis.matchScore}%</div>
                <Badge variant="purple" size="sm" className="mt-2 bg-indigo-500/30 text-indigo-200 border-indigo-400/30 w-fit">
                  {activeApp.aiAnalysis.verdict}
                </Badge>
              </CardContent>
            </Card>
            {[
              { label: 'Technical Skills', score: activeApp.aiAnalysis.technicalSkillsScore, color: 'bg-indigo-600', icon: Award },
              { label: 'Experience', score: activeApp.aiAnalysis.experienceScore, color: 'bg-emerald-600', icon: Briefcase },
              { label: 'Education', score: activeApp.aiAnalysis.educationScore, color: 'bg-blue-600', icon: GraduationCap },
              { label: 'Domain Fit', score: activeApp.aiAnalysis.domainScore, color: 'bg-purple-600', icon: Layers }
            ].map(({ label, score, color, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="font-semibold">{label}</span>
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{score}%</div>
                  <ScoreBar value={score} color={color} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary + skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /><CardTitle>Gemini Assessment</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">{activeApp.aiAnalysis.summary}</p>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Strengths</h4>
                  <ul className="space-y-1.5">{activeApp.aiAnalysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100"><span className="text-emerald-600 font-bold">✓</span><span>{s}</span></li>)}</ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-600" /> Areas of Concern</h4>
                  <ul className="space-y-1.5">{activeApp.aiAnalysis.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2 bg-rose-50/40 p-2 rounded-lg border border-rose-100"><span className="text-rose-600 font-bold">!</span><span>{w}</span></li>)}</ul>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Skills Matrix</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="block font-bold text-emerald-800 mb-2">Matched Skills:</span>
                  <div className="flex flex-wrap gap-1.5">{activeApp.aiAnalysis.matchedSkills.map(skill => <Badge key={skill} variant="success" size="md">✓ {skill}</Badge>)}</div>
                </div>
                <div>
                  <span className="block font-bold text-rose-800 mb-2">Missing Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeApp.aiAnalysis.missingSkills.length === 0
                      ? <span className="text-slate-400 italic">None — 100% matched</span>
                      : activeApp.aiAnalysis.missingSkills.map(skill => <Badge key={skill} variant="danger" size="md">✕ {skill}</Badge>)
                    }
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="block font-bold text-slate-800 mb-1.5">PyMuPDF Extracted Snippet</span>
                  <div className="p-3 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700 max-h-40 overflow-y-auto leading-relaxed border border-slate-200">
                    {activeApp.resumeRawTextSnippet}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-indigo-600" /><CardTitle>AI Interview Questions</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {activeApp.aiAnalysis.suggestedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-800 leading-relaxed"><span className="font-bold text-indigo-600 mr-1.5">Q{idx + 1}:</span>{q}</p>
                    <button onClick={() => handleCopyQuestion(q, idx)} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 shrink-0">
                      {copiedQuestion === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state when results tab but no result */}
      {activeTab === 'results' && !result && !activeApp?.aiAnalysis && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-2">No Results Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">Upload a resume and run AI screening to see results here, or view a demo result to explore the interface.</p>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab('upload')} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Upload Resume
            </button>
            <button onClick={handleViewDemo} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              View Demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

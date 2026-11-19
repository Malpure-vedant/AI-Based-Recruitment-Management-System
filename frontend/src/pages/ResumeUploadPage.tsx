import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Application } from '../types'

interface UploadTask {
  id: string;
  fileName: string;
  fileSize: string;
  candidateName: string;
  targetJobId: string;
  progress: number;
  stage: 'UPLOADING' | 'PARSING_PYMUPDF' | 'AI_GEMINI_EVALUATION' | 'COMPLETED' | 'ERROR';
  score?: number;
  applicationId?: string;
}

export const ResumeUploadPage: React.FC = () => {
  const { jobs, addApplication } = useApp()
  const navigate = useNavigate()

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '')
  const [isDragging, setIsDragging] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])

  // Simulated multi-stage ingestion pipeline
  const processUploadSimulation = (fileName: string, candidateName: string, candidateEmail: string) => {
    const taskId = `task-${Date.now()}`
    const targetJob = jobs.find(j => j.id === selectedJobId) || jobs[0]

    const newTask: UploadTask = {
      id: taskId,
      fileName,
      fileSize: '1.8 MB',
      candidateName,
      targetJobId: targetJob.id,
      progress: 15,
      stage: 'UPLOADING'
    }

    setTasks(prev => [newTask, ...prev])

    // Stage 1: Uploading
    setTimeout(() => {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, progress: 40, stage: 'PARSING_PYMUPDF' } : t))
      )

      // Stage 2: PyMuPDF layout parsing
      setTimeout(() => {
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, progress: 75, stage: 'AI_GEMINI_EVALUATION' } : t))
        )

        // Stage 3: Gemini AI semantic matching
        setTimeout(() => {
          const generatedScore = Math.floor(Math.random() * 25) + 75
          const newAppId = `app-${Date.now()}`

          const newApplication: Application = {
            id: newAppId,
            candidateId: `cand-${Date.now()}`,
            candidateName,
            candidateEmail,
            candidateAvatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
            jobId: targetJob.id,
            jobTitle: targetJob.title,
            jobDepartment: targetJob.department,
            appliedDate: new Date().toISOString().split('T')[0],
            status: generatedScore >= 85 ? 'SHORTLISTED' : 'SCREENING',
            resumeFileName: fileName,
            resumeFileUrl: `/uploads/resumes/${fileName}`,
            resumeRawTextSnippet: `${candidateName} - Experience: 5+ years building production applications with ${targetJob.requiredSkills.slice(0, 3).join(', ')}. Demonstrated experience in scalable cloud architectures.`,
            notesCount: 0,
            aiAnalysis: {
              matchScore: generatedScore,
              technicalSkillsScore: generatedScore + 2 > 100 ? 100 : generatedScore + 2,
              experienceScore: generatedScore - 3,
              educationScore: 90,
              domainScore: 88,
              verdict: generatedScore >= 85 ? 'STRONG_FIT' : 'MODERATE_FIT',
              summary: `${candidateName} demonstrates robust alignment with the ${targetJob.title} opening, presenting proven technical experience with ${targetJob.requiredSkills.slice(0, 2).join(' and ')}.`,
              matchedSkills: targetJob.requiredSkills.slice(0, 4),
              missingSkills: targetJob.requiredSkills.slice(4, 5),
              strengths: [
                'Extracted 5+ years of verified software engineering experience',
                'Strong alignment on core framework requirements'
              ],
              weaknesses: ['Minor domain nuance differences'],
              suggestedQuestions: [
                'How do you approach performance profiling under high concurrent throughput?',
                'Can you walk through your CI/CD test automation framework?'
              ],
              extractedExperienceYears: 5.2,
              highestEducation: 'B.S. in Computer Science',
              processedAt: new Date().toLocaleString(),
              tokensUsed: 1340
            }
          }

          addApplication(newApplication)

          setTasks(prev =>
            prev.map(t =>
              t.id === taskId
                ? {
                    ...t,
                    progress: 100,
                    stage: 'COMPLETED',
                    score: generatedScore,
                    applicationId: newAppId
                  }
                : t
            )
          )
        }, 1200)
      }, 1000)
    }, 700)
  }

  const handleSimulatedDrop = (name: string, email: string, file: string) => {
    processUploadSimulation(file, name, email)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Ingestion & Parsing</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload applicant resumes in PDF format. The system automatically executes PyMuPDF text layout extraction and Gemini 1.5 Flash rubric scoring.
        </p>
      </div>

      {/* Target Requisition Selector */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800">Target Job Requisition for Ingestion:</label>
            <p className="text-[11px] text-slate-500">
              Resumes will be scored against this job's required skills and weighting rubric.
            </p>
          </div>

          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full sm:w-96 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          handleSimulatedDrop('Jordan Miller', 'jordan.miller@example.org', 'Jordan_Miller_CV.pdf')
        }}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Drag & Drop Candidate Resumes (PDF)
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
          Supports single or bulk batch uploads up to 10MB each. Layout preservation and multi-column parsing powered by PyMuPDF.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              handleSimulatedDrop(
                'Nathaniel Cole',
                'nathaniel.c@cloudops.dev',
                'Nathaniel_Cole_Cloud_Resume.pdf'
              )
            }
          >
            <FolderOpen className="w-4 h-4 mr-1.5" /> Select Local File (Simulate PDF)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleSimulatedDrop(
                'Samantha Reed',
                'samantha.reed@fullstack.io',
                'Samantha_Reed_Staff_Engineer.pdf'
              )
            }
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Test AI Extraction Pipeline
          </Button>
        </div>
      </div>

      {/* Processing Pipeline Cards */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <CardTitle>Active Ingestion Pipeline Tasks</CardTitle>
            </div>
            <span className="text-xs text-slate-500">{tasks.length} jobs in queue</span>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{task.fileName}</p>
                      <p className="text-[11px] text-slate-500">
                        Candidate: <span className="font-semibold text-slate-700">{task.candidateName}</span> · {task.fileSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {task.stage === 'UPLOADING' && (
                      <Badge variant="neutral" size="sm">
                        Uploading to secure storage...
                      </Badge>
                    )}
                    {task.stage === 'PARSING_PYMUPDF' && (
                      <Badge variant="purple" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> PyMuPDF Text Layout
                      </Badge>
                    )}
                    {task.stage === 'AI_GEMINI_EVALUATION' && (
                      <Badge variant="default" size="sm">
                        <Sparkles className="w-3 h-3 mr-1 animate-spin" /> Gemini Semantic Match
                      </Badge>
                    )}
                    {task.stage === 'COMPLETED' && (
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Match Score: {task.score}%
                        </Badge>
                        <Link to={`/screening?candidateId=${task.applicationId}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            View Scorecard <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      task.stage === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : task.stage === 'AI_GEMINI_EVALUATION'
                        ? 'bg-purple-600'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pipeline Technical Breakdown Informational Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="text-xs font-bold text-slate-800">PyMuPDF Document Extraction</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Extracts native text, coordinates, and bounding boxes from multi-column PDFs with zero OCR hallucination.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="text-xs font-bold text-slate-800">Gemini 1.5 Flash Rubric Scoring</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Evaluates contextual experience, parses skill depth, detects gaps, and verifies educational requirements via strict JSON schemas.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="text-xs font-bold text-slate-800">Candidate Ranking & Kanban</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Instant candidate insertion into the hiring pipeline sorted by weighted fit score, ready for recruiter review.
          </p>
        </div>
      </div>
    </div>
  )
}

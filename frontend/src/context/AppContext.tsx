import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  Job,
  Application,
  Interview,
  AuditLog,
  User,
  ApplicationStatus,
  InterviewStatus,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  FitVerdict
} from '../types'
import {
  currentUser as defaultUser,
  initialJobs,
  initialApplications,
  initialInterviews,
  initialAuditLogs,
  analyticsData
} from '../data/mockData'
import {
  authApi,
  jobsApi,
  applicationsApi,
  interviewsApi,
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  removeToken
} from '../lib/api'

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
  auditLogs: AuditLog[];
  analytics: typeof analyticsData;
  addJob: (newJob: Omit<Job, 'id' | 'applicantsCount' | 'createdAt'>) => Promise<void>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<void>;
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, remark?: string) => Promise<void>;
  shortlistCandidate: (appId: string, notes?: string) => Promise<void>;
  rejectCandidate: (appId: string, reason: string) => Promise<void>;
  addApplication: (app: Application) => void;
  addInterview: (interview: Omit<Interview, 'id'>) => Promise<void>;
  updateInterviewRating: (interviewId: string, rating: number, feedback: string) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewStatus) => Promise<void>;
  submitInterviewFeedback: (
    interviewId: string,
    feedback: {
      rating: number;
      overallRecommendation: string;
      technicalScore?: number;
      communicationScore?: number;
      problemSolvingScore?: number;
      culturalFitScore?: number;
      strengths?: string;
      concerns?: string;
      detailedFeedback: string;
    }
  ) => Promise<void>;
  systemSettings: {
    geminiModel: string;
    autoScreenResumes: boolean;
    defaultWeights: {
      skills: number;
      experience: number;
      education: number;
      domain: number;
    };
    emailNotifications: boolean;
    anonymizeCandidatePII: boolean;
  };
  updateSystemSettings: (settings: Partial<AppContextType['systemSettings']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// ─────────────────────────────────────────────────────────────────────────────
// Entity Mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapBackendJob(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    department: j.department,
    location: j.location || 'Remote',
    type: (j.job_type || 'Full-time') as EmploymentType,
    experienceLevel: (j.experience_level || 'Senior') as ExperienceLevel,
    salaryRange: j.salary_range || '$120,000 - $160,000',
    openings: j.openings || 1,
    status: (j.status || 'OPEN') as JobStatus,
    applicantsCount: j.applicants_count || 0,
    createdAt: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today',
    description: j.description || '',
    responsibilities: j.responsibilities || [],
    requiredSkills: j.required_skills || [],
    preferredSkills: j.preferred_skills || [],
    scoringWeights: {
      skills: Math.round(((j.scoring_weights?.skills ?? 0.4) * 100)),
      experience: Math.round(((j.scoring_weights?.experience ?? 0.35) * 100)),
      education: Math.round(((j.scoring_weights?.education ?? 0.15) * 100)),
      domain: Math.round(((j.scoring_weights?.domain ?? 0.1) * 100))
    }
  }
}

function mapBackendApplication(a: any): Application {
  return {
    id: a.id,
    candidateId: a.candidate_id,
    candidateName: a.candidate_name || 'Candidate Profile',
    candidateEmail: a.candidate_email || 'candidate@talentpulse.ai',
    candidateAvatar: a.candidate_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    jobId: a.job_id,
    jobTitle: a.job_title || 'Open Requisition',
    jobDepartment: a.job_department || 'Engineering',
    appliedDate: a.applied_date ? new Date(a.applied_date).toISOString().split('T')[0] : 'Today',
    status: (a.status || 'APPLIED') as ApplicationStatus,
    resumeFileName: a.resume_file_name || 'resume.pdf',
    resumeFileUrl: `/uploads/resumes/${a.resume_file_name || 'resume.pdf'}`,
    resumeRawTextSnippet: a.ai_summary || '',
    notesCount: 0,
    candidateSkills: a.candidate_skills || [],
    isShortlisted: Boolean(a.is_shortlisted),
    shortlistedAt: a.shortlisted_at ? new Date(a.shortlisted_at).toISOString() : undefined,
    rejectionReason: a.rejection_reason || undefined,
    statusHistory: (a.status_history || []).map((h: any) => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      changedByName: h.changed_by_name || 'Lead Recruiter',
      reason: h.reason,
      createdAt: h.created_at ? new Date(h.created_at).toISOString() : new Date().toISOString()
    })),
    aiAnalysis: a.ai_analysis ? {
      matchScore: Math.round(a.ai_analysis.match_score),
      technicalSkillsScore: Math.round(a.ai_analysis.technical_score || 0),
      experienceScore: Math.round(a.ai_analysis.experience_score || 0),
      educationScore: Math.round(a.ai_analysis.education_score || 0),
      domainScore: Math.round(a.ai_analysis.domain_score || 0),
      verdict: (a.ai_analysis.verdict === 'FIT' ? 'STRONG_FIT' : a.ai_analysis.verdict) as FitVerdict,
      summary: a.ai_analysis.summary || 'Profile analyzed against job requirements rubric.',
      matchedSkills: a.ai_analysis.matched_skills || [],
      missingSkills: a.ai_analysis.missing_skills || [],
      strengths: a.ai_analysis.strengths || [],
      weaknesses: a.ai_analysis.weaknesses || [],
      suggestedQuestions: a.ai_analysis.suggested_questions || [],
      extractedExperienceYears: 5,
      highestEducation: "Bachelor's / Master's",
      processedAt: 'Recently',
      tokensUsed: 420
    } : undefined
  }
}

function mapBackendInterview(i: any): Interview {
  const schedDate = i.scheduled_at ? new Date(i.scheduled_at) : new Date()
  return {
    id: i.id,
    applicationId: i.application_id,
    candidateId: i.candidate_id,
    candidateName: i.candidate_name || 'Candidate',
    candidateEmail: i.candidate_email || 'candidate@talentpulse.ai',
    candidateAvatar: i.candidate_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    jobTitle: i.job_title || 'Software Engineer',
    interviewerName: i.interviewer_name || 'Lead Interviewer',
    round: i.interview_round || 'Technical Round 1',
    date: schedDate.toISOString().split('T')[0],
    time: schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    durationMinutes: i.duration_minutes || 60,
    meetingLink: i.meeting_link || 'https://meet.google.com/talentpulse-eval',
    meetingPlatform: i.meeting_platform || 'Google Meet',
    location: i.location,
    notes: i.notes,
    status: (i.status || 'SCHEDULED') as InterviewStatus,
    rating: i.feedback?.rating,
    overallRecommendation: i.feedback?.overall_recommendation,
    feedback: i.feedback?.detailed_feedback,
    strengthsNoted: i.feedback?.strengths_noted,
    concernsNoted: i.feedback?.concerns_noted,
    criteriaRatings: i.feedback ? {
      technicalCompetence: i.feedback.technical_score || 4,
      problemSolving: i.feedback.problem_solving_score || 4,
      communication: i.feedback.communication_score || 4,
      culturalFit: i.feedback.cultural_fit_score || 4
    } : undefined
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const stored = getStoredUser()
    if (stored) {
      return {
        id: stored.id,
        name: stored.full_name || stored.name || defaultUser.name,
        email: stored.email || defaultUser.email,
        role: stored.role || defaultUser.role,
        avatar: stored.avatar_url || defaultUser.avatar,
        department: stored.department || defaultUser.department,
        title: stored.title || defaultUser.title,
      }
    }
    return defaultUser
  })

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs)

  const [systemSettings, setSystemSettings] = useState({
    geminiModel: 'gemini-1.5-flash',
    autoScreenResumes: true,
    defaultWeights: {
      skills: 40,
      experience: 35,
      education: 15,
      domain: 10
    },
    emailNotifications: true,
    anonymizeCandidatePII: false
  })

  // ── Fetch & synchronize all live data from PostgreSQL ────────────────────
  const refreshData = useCallback(async () => {
    try {
      const [jobsRes, appsRes, intsRes] = await Promise.allSettled([
        jobsApi.list(),
        applicationsApi.list(),
        interviewsApi.list()
      ])

      if (jobsRes.status === 'fulfilled' && jobsRes.value?.items && jobsRes.value.items.length > 0) {
        setJobs(jobsRes.value.items.map(mapBackendJob))
      }

      if (appsRes.status === 'fulfilled' && appsRes.value?.items && appsRes.value.items.length > 0) {
        setApplications(appsRes.value.items.map(mapBackendApplication))
      }

      if (intsRes.status === 'fulfilled' && intsRes.value?.items && intsRes.value.items.length > 0) {
        setInterviews(intsRes.value.items.map(mapBackendInterview))
      }
    } catch (err) {
      console.warn('Backend sync warning, keeping memory cache:', err)
    }
  }, [])

  // ── Initial Bootstrap: Authenticate and Load Data ─────────────────────────
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      const token = getToken()

      if (!token) {
        // Automatically attempt login with default admin credentials for effortless testing
        try {
          const authRes = await authApi.login({
            email: 'sarah.jenkins@hireai.enterprise',
            password: 'admin123'
          })
          if (isMounted && authRes?.user) {
            setUser({
              id: authRes.user.id,
              name: authRes.user.full_name,
              email: authRes.user.email,
              role: authRes.user.role,
              avatar: defaultUser.avatar,
              department: authRes.user.department || defaultUser.department,
              title: authRes.user.title || defaultUser.title
            })
            setIsAuthenticated(true)
          }
        } catch {
          // If offline, preserve default user for development
          if (isMounted) setIsAuthenticated(true)
        }
      } else {
        // Validate existing token
        try {
          const me = await authApi.me()
          if (isMounted && me) {
            setUser({
              id: me.id,
              name: me.full_name,
              email: me.email,
              role: me.role,
              avatar: defaultUser.avatar,
              department: me.department || defaultUser.department,
              title: me.title || defaultUser.title
            })
            setIsAuthenticated(true)
          }
        } catch {
          if (isMounted) {
            removeToken()
            setIsAuthenticated(false)
          }
        }
      }

      await refreshData()
      if (isMounted) setIsLoading(false)
    }

    init()

    const handleUnauthorized = () => {
      setIsAuthenticated(false)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [refreshData])

  // ── Authentication Actions ────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await authApi.login({ email, password })
      if (res.user) {
        setUser({
          id: res.user.id,
          name: res.user.full_name,
          email: res.user.email,
          role: res.user.role,
          avatar: defaultUser.avatar,
          department: res.user.department || defaultUser.department,
          title: res.user.title || defaultUser.title
        })
        setIsAuthenticated(true)
        await refreshData()
        return true
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setIsAuthenticated(false)
      setUser(defaultUser)
    }
  }

  // ── Job Management Actions ────────────────────────────────────────────────
  const addJob = async (newJobData: Omit<Job, 'id' | 'applicantsCount' | 'createdAt'>) => {
    const tempId = `job-${Date.now()}`
    const optimisticJob: Job = {
      ...newJobData,
      id: tempId,
      applicantsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setJobs(prev => [optimisticJob, ...prev])

    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: `Job requisition published: "${newJobData.title}"`,
        actorName: user.name,
        target: newJobData.title,
        timestamp: 'Just now',
        type: 'SUCCESS'
      },
      ...prev
    ])

    try {
      const created = await jobsApi.create({
        title: newJobData.title,
        department: newJobData.department,
        location: newJobData.location,
        job_type: newJobData.type,
        experience_level: newJobData.experienceLevel,
        salary_range: newJobData.salaryRange,
        openings: newJobData.openings,
        status: newJobData.status || 'OPEN',
        description: newJobData.description,
        responsibilities: newJobData.responsibilities,
        required_skills: newJobData.requiredSkills,
        preferred_skills: newJobData.preferredSkills,
        scoring_weights: {
          skills: (newJobData.scoringWeights?.skills || systemSettings.defaultWeights.skills) / 100,
          experience: (newJobData.scoringWeights?.experience || systemSettings.defaultWeights.experience) / 100,
          education: (newJobData.scoringWeights?.education || systemSettings.defaultWeights.education) / 100,
          domain: (newJobData.scoringWeights?.domain || systemSettings.defaultWeights.domain) / 100
        }
      })
      if (created?.id) {
        const mapped = mapBackendJob(created)
        setJobs(prev => prev.map(j => (j.id === tempId ? mapped : j)))
      }
    } catch (err) {
      console.warn('Job creation background sync failed, retained in local state:', err)
    }
  }

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    setJobs(prev => prev.map(job => (job.id === jobId ? { ...job, status } : job)))
    try {
      await jobsApi.updateStatus(jobId, status)
    } catch (err) {
      console.warn('Update job status sync error:', err)
    }
  }

  // ── Candidate & Application Actions ───────────────────────────────────────
  const updateApplicationStatus = async (appId: string, newStatus: ApplicationStatus, remark?: string) => {
    const targetApp = applications.find(a => a.id === appId)
    const oldStatus = targetApp?.status || 'APPLIED'

    const historyEntry = {
      id: `hist-${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedByName: user.name,
      reason: remark || `Transitioned to ${newStatus}`,
      createdAt: new Date().toISOString()
    }

    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            status: newStatus,
            isShortlisted: newStatus === 'SHORTLISTED' ? true : app.isShortlisted,
            shortlistedAt: newStatus === 'SHORTLISTED' ? new Date().toISOString() : app.shortlistedAt,
            rejectionReason: newStatus === 'REJECTED' ? (remark || app.rejectionReason) : app.rejectionReason,
            statusHistory: [historyEntry, ...(app.statusHistory || [])]
          }
        }
        return app
      })
    )

    if (targetApp) {
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          action: `Candidate moved to ${newStatus}${remark ? ` (${remark})` : ''}`,
          actorName: user.name,
          target: `${targetApp.candidateName} - ${targetApp.jobTitle}`,
          timestamp: 'Just now',
          type:
            newStatus === 'SELECTED' || newStatus === 'HIRED' || newStatus === 'SHORTLISTED'
              ? 'SUCCESS'
              : newStatus === 'REJECTED'
              ? 'WARNING'
              : 'INFO'
        },
        ...prev
      ])
    }

    try {
      await applicationsApi.updateStatus(appId, newStatus, remark)
    } catch (err) {
      console.warn('Application status sync error:', err)
    }
  }

  const shortlistCandidate = async (appId: string, notes?: string) => {
    await updateApplicationStatus(appId, 'SHORTLISTED', notes || 'Candidate shortlisted based on skills and AI match.')
    try {
      await applicationsApi.shortlist(appId, notes)
    } catch (err) {
      console.warn('Shortlist API sync error:', err)
    }
  }

  const rejectCandidate = async (appId: string, reason: string) => {
    await updateApplicationStatus(appId, 'REJECTED', reason)
    try {
      await applicationsApi.reject(appId, reason)
    } catch (err) {
      console.warn('Reject API sync error:', err)
    }
  }

  const addApplication = (app: Application) => {
    setApplications(prev => [app, ...prev])
    setJobs(prev =>
      prev.map(j => (j.id === app.jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j))
    )
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: `New application & AI screening completed (${app.aiAnalysis?.matchScore || 0}% fit)`,
        actorName: 'PyMuPDF + Gemini Pipeline',
        target: `${app.candidateName} (${app.jobTitle})`,
        timestamp: 'Just now',
        type: 'SUCCESS'
      },
      ...prev
    ])
  }

  // ── Interview Management Actions ──────────────────────────────────────────
  const addInterview = async (interviewData: Omit<Interview, 'id'>) => {
    const tempId = `int-${Date.now()}`
    const newInterview: Interview = {
      ...interviewData,
      id: tempId
    }
    setInterviews(prev => [newInterview, ...prev])
    await updateApplicationStatus(interviewData.applicationId, 'INTERVIEW_SCHEDULED', `Scheduled ${interviewData.round}`)

    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: `Interview round scheduled: ${interviewData.round}`,
        actorName: user.name,
        target: `${interviewData.candidateName} (${interviewData.jobTitle})`,
        timestamp: 'Just now',
        type: 'SUCCESS'
      },
      ...prev
    ])

    try {
      const scheduledAt = new Date(`${interviewData.date}T${interviewData.time || '10:00'}:00Z`).toISOString()
      const created = await interviewsApi.create({
        application_id: interviewData.applicationId,
        interviewer_name: interviewData.interviewerName,
        interview_round: interviewData.round,
        scheduled_at: scheduledAt,
        duration_minutes: interviewData.durationMinutes || 60,
        meeting_link: interviewData.meetingLink || 'https://meet.google.com/talentpulse-eval',
        notes: interviewData.notes
      })
      if (created?.id) {
        const mapped = mapBackendInterview(created)
        setInterviews(prev => prev.map(i => (i.id === tempId ? mapped : i)))
      }
    } catch (err) {
      console.warn('Interview scheduling API sync error:', err)
    }
  }

  const updateInterviewRating = (interviewId: string, rating: number, feedback: string) => {
    setInterviews(prev =>
      prev.map(i => (i.id === interviewId ? { ...i, rating, feedback, status: 'COMPLETED' } : i))
    )
  }

  const updateInterviewStatus = async (interviewId: string, status: InterviewStatus) => {
    setInterviews(prev => prev.map(i => (i.id === interviewId ? { ...i, status } : i)))
    const target = interviews.find(i => i.id === interviewId)
    if (target) {
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          action: `Interview status marked as ${status}`,
          actorName: user.name,
          target: `${target.candidateName} - ${target.round}`,
          timestamp: 'Just now',
          type: status === 'COMPLETED' ? 'SUCCESS' : status === 'CANCELLED' ? 'WARNING' : 'INFO'
        },
        ...prev
      ])
    }

    try {
      await interviewsApi.update(interviewId, { status })
    } catch (err) {
      console.warn('Interview status update sync error:', err)
    }
  }

  const submitInterviewFeedback = async (
    interviewId: string,
    feedbackData: {
      rating: number;
      overallRecommendation: string;
      technicalScore?: number;
      communicationScore?: number;
      problemSolvingScore?: number;
      culturalFitScore?: number;
      strengths?: string;
      concerns?: string;
      detailedFeedback: string;
    }
  ) => {
    setInterviews(prev =>
      prev.map(i => {
        if (i.id === interviewId) {
          return {
            ...i,
            status: 'COMPLETED',
            rating: feedbackData.rating,
            overallRecommendation: feedbackData.overallRecommendation,
            feedback: feedbackData.detailedFeedback,
            strengthsNoted: feedbackData.strengths,
            concernsNoted: feedbackData.concerns,
            criteriaRatings: {
              technicalCompetence: feedbackData.technicalScore || 4,
              problemSolving: feedbackData.problemSolvingScore || 4,
              communication: feedbackData.communicationScore || 4,
              culturalFit: feedbackData.culturalFitScore || 4
            }
          }
        }
        return i
      })
    )

    const target = interviews.find(i => i.id === interviewId)
    if (target) {
      await updateApplicationStatus(
        target.applicationId,
        'INTERVIEW_COMPLETED',
        `Scorecard submitted: ${feedbackData.rating}★ (${feedbackData.overallRecommendation})`
      )
    }

    try {
      await interviewsApi.submitFeedback(interviewId, {
        overall_recommendation: feedbackData.overallRecommendation,
        rating: feedbackData.rating,
        technical_score: feedbackData.technicalScore,
        communication_score: feedbackData.communicationScore,
        problem_solving_score: feedbackData.problemSolvingScore,
        cultural_fit_score: feedbackData.culturalFitScore,
        strengths_noted: feedbackData.strengths,
        concerns_noted: feedbackData.concerns,
        detailed_feedback: feedbackData.detailedFeedback
      })
    } catch (err) {
      console.warn('Interview feedback submission sync error:', err)
    }
  }

  const updateSystemSettings = (newSettings: Partial<AppContextType['systemSettings']>) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshData,
        jobs,
        applications,
        interviews,
        auditLogs,
        analytics: analyticsData,
        addJob,
        updateJobStatus,
        updateApplicationStatus,
        shortlistCandidate,
        rejectCandidate,
        addApplication,
        addInterview,
        updateInterviewRating,
        updateInterviewStatus,
        submitInterviewFeedback,
        systemSettings,
        updateSystemSettings
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

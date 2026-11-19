import React, { createContext, useContext, useState } from 'react'
import { Job, Application, Interview, AuditLog, User, ApplicationStatus, InterviewStatus } from '../types'
import {
  currentUser as defaultUser,
  initialJobs,
  initialApplications,
  initialInterviews,
  initialAuditLogs,
  analyticsData
} from '../data/mockData'

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
  auditLogs: AuditLog[];
  analytics: typeof analyticsData;
  addJob: (newJob: Omit<Job, 'id' | 'applicantsCount' | 'createdAt'>) => void;
  updateJobStatus: (jobId: string, status: Job['status']) => void;
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, remark?: string) => void;
  shortlistCandidate: (appId: string, notes?: string) => void;
  rejectCandidate: (appId: string, reason: string) => void;
  addApplication: (app: Application) => void;
  addInterview: (interview: Omit<Interview, 'id'>) => void;
  updateInterviewRating: (interviewId: string, rating: number, feedback: string) => void;
  updateInterviewStatus: (interviewId: string, status: InterviewStatus) => void;
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
  ) => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser)
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

  const addJob = (newJobData: Omit<Job, 'id' | 'applicantsCount' | 'createdAt'>) => {
    const newJob: Job = {
      ...newJobData,
      id: `job-${Date.now()}`,
      applicantsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setJobs(prev => [newJob, ...prev])
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: `Job requisition published: "${newJob.title}"`,
        actorName: user.name,
        target: newJob.title,
        timestamp: 'Just now',
        type: 'SUCCESS'
      },
      ...prev
    ])
  }

  const updateJobStatus = (jobId: string, status: Job['status']) => {
    setJobs(prev => prev.map(job => (job.id === jobId ? { ...job, status } : job)))
  }

  const updateApplicationStatus = (appId: string, newStatus: ApplicationStatus, remark?: string) => {
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
          type: newStatus === 'SELECTED' || newStatus === 'HIRED' || newStatus === 'SHORTLISTED' ? 'SUCCESS' : newStatus === 'REJECTED' ? 'WARNING' : 'INFO'
        },
        ...prev
      ])
    }

    // Attempt backend sync in background (fails gracefully if backend offline)
    try {
      fetch(`/api/v1/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: remark })
      }).catch(() => {})
    } catch {
      // Ignored for offline/demo resilience
    }
  }

  const shortlistCandidate = (appId: string, notes?: string) => {
    updateApplicationStatus(appId, 'SHORTLISTED', notes || 'Candidate shortlisted based on skills and AI match.')
  }

  const rejectCandidate = (appId: string, reason: string) => {
    updateApplicationStatus(appId, 'REJECTED', reason)
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

  const addInterview = (interviewData: Omit<Interview, 'id'>) => {
    const newInterview: Interview = {
      ...interviewData,
      id: `int-${Date.now()}`
    }
    setInterviews(prev => [newInterview, ...prev])
    updateApplicationStatus(interviewData.applicationId, 'INTERVIEW_SCHEDULED', `Scheduled ${interviewData.round}`)

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

    // Background sync to backend
    try {
      fetch('/api/v1/interviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: interviewData.applicationId,
          interviewer_name: interviewData.interviewerName,
          interview_round: interviewData.round,
          scheduled_at: new Date(`${interviewData.date}T10:00:00Z`).toISOString(),
          duration_minutes: interviewData.durationMinutes || 60,
          meeting_link: interviewData.meetingLink,
          notes: interviewData.notes
        })
      }).catch(() => {})
    } catch {
      // Ignored for offline/demo resilience
    }
  }

  const updateInterviewRating = (interviewId: string, rating: number, feedback: string) => {
    setInterviews(prev =>
      prev.map(i => (i.id === interviewId ? { ...i, rating, feedback, status: 'COMPLETED' } : i))
    )
  }

  const updateInterviewStatus = (interviewId: string, status: InterviewStatus) => {
    setInterviews(prev =>
      prev.map(i => (i.id === interviewId ? { ...i, status } : i))
    )
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
  }

  const submitInterviewFeedback = (
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
      updateApplicationStatus(
        target.applicationId,
        'INTERVIEW_COMPLETED',
        `Scorecard submitted: ${feedbackData.rating}★ (${feedbackData.overallRecommendation})`
      )
    }

    // Sync to backend
    try {
      fetch(`/api/v1/interviews/${interviewId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      }).catch(() => {})
    } catch {
      // Ignored for offline/demo resilience
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

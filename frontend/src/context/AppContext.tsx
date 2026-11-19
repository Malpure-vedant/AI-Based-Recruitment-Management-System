import React, { createContext, useContext, useState } from 'react'
import { Job, Application, Interview, AuditLog, User, ApplicationStatus } from '../types'
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
  addApplication: (app: Application) => void;
  addInterview: (interview: Omit<Interview, 'id'>) => void;
  updateInterviewRating: (interviewId: string, rating: number, feedback: string) => void;
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
    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          return { ...app, status: newStatus }
        }
        return app
      })
    )

    const targetApp = applications.find(a => a.id === appId)
    if (targetApp) {
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          action: `Candidate moved to ${newStatus}${remark ? ` (${remark})` : ''}`,
          actorName: user.name,
          target: `${targetApp.candidateName} - ${targetApp.jobTitle}`,
          timestamp: 'Just now',
          type: newStatus === 'OFFERED' || newStatus === 'HIRED' ? 'SUCCESS' : newStatus === 'REJECTED' ? 'WARNING' : 'INFO'
        },
        ...prev
      ])
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

  const addInterview = (interviewData: Omit<Interview, 'id'>) => {
    const newInterview: Interview = {
      ...interviewData,
      id: `int-${Date.now()}`
    }
    setInterviews(prev => [newInterview, ...prev])
    updateApplicationStatus(interviewData.applicationId, 'INTERVIEW', `Scheduled ${interviewData.round}`)
  }

  const updateInterviewRating = (interviewId: string, rating: number, feedback: string) => {
    setInterviews(prev =>
      prev.map(i => (i.id === interviewId ? { ...i, rating, feedback, status: 'COMPLETED' } : i))
    )
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
        addApplication,
        addInterview,
        updateInterviewRating,
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

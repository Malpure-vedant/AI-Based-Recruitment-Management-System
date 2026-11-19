import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage, RegisterPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { CandidatesPage } from '../pages/CandidatesPage'
import { JobsPage } from '../pages/JobsPage'
import { ResumeUploadPage } from '../pages/ResumeUploadPage'
import { ScreeningPage } from '../pages/ScreeningPage'
import { RankingPage } from '../pages/RankingPage'
import { InterviewsPage } from '../pages/InterviewsPage'
import { PipelinePage } from '../pages/PipelinePage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SettingsPage } from '../pages/SettingsPage'
import { useApp } from '../context/AppContext'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">Connecting to TalentPulse Engine...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected SaaS App Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/resumes/upload" element={<ResumeUploadPage />} />
        <Route path="/screening" element={<ScreeningPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import React, { useState, useMemo } from 'react'
import {
  CalendarDays,
  Plus,
  Clock,
  Video,
  CheckCircle2,
  Star,
  Users,
  Search,
  MessageSquare,
  History,
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  XCircle,
  ExternalLink,
  MapPin,
  FileText,
  X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Interview, InterviewRound, InterviewStatus } from '../types'

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    title: 'Interview Scheduled: Jasmine Patel',
    message: 'Technical Round 1 scheduled with Priya Sharma for Senior AI Engineer.',
    type: 'SUCCESS',
    timestamp: '10 mins ago',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Scorecard Submitted: Alex Morgan',
    message: 'Sarah Jenkins submitted feedback (4★ HIRE) for System Design Round.',
    type: 'INFO',
    timestamp: '1 hour ago',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Upcoming Interview Reminder',
    message: 'Technical Round with Alex Morgan is scheduled tomorrow at 14:00 UTC.',
    type: 'WARNING',
    timestamp: '2 hours ago',
    isRead: true
  }
]

export const InterviewsPage: React.FC = () => {
  const {
    interviews,
    applications,
    addInterview,
    updateInterviewStatus,
    submitInterviewFeedback
  } = useApp()

  // View state: 'list' or 'calendar'
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Calendar month navigation (defaults to November 2026 / current date)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date('2026-11-01'))

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null)
  const [historyCandidateId, setHistoryCandidateId] = useState<string | null>(null)

  // In-app notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>(INITIAL_NOTIFICATIONS)

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Form states for scheduling
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '')
  const [interviewerName, setInterviewerName] = useState('Sarah Jenkins')
  const [round, setRound] = useState<string>('Technical Round 1')
  const [date, setDate] = useState('2026-11-24')
  const [time, setTime] = useState('14:00 - 15:00')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [meetingPlatform, setMeetingPlatform] = useState('Google Meet')
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hiring-sync')
  const [notes, setNotes] = useState('')

  // Form states for scorecard
  const [overallRecommendation, setOverallRecommendation] = useState<string>('HIRE')
  const [rating, setRating] = useState<number>(4)
  const [technicalScore, setTechnicalScore] = useState<number>(4)
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(4)
  const [communicationScore, setCommunicationScore] = useState<number>(4)
  const [culturalFitScore, setCulturalFitScore] = useState<number>(4)
  const [strengths, setStrengths] = useState<string>('')
  const [concerns, setConcerns] = useState<string>('')
  const [detailedFeedback, setDetailedFeedback] = useState<string>('')

  // Filtered interviews list
  const filteredInterviews = useMemo(() => {
    return interviews.filter(i => {
      const matchesStatus = filterStatus === 'ALL' || i.status === filterStatus
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        i.candidateName.toLowerCase().includes(q) ||
        i.interviewerName.toLowerCase().includes(q) ||
        i.jobTitle.toLowerCase().includes(q) ||
        i.round.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [interviews, filterStatus, searchQuery])

  // Stats calculation
  const stats = useMemo(() => {
    const total = interviews.length
    const scheduled = interviews.filter(i => i.status === 'SCHEDULED').length
    const completed = interviews.filter(i => i.status === 'COMPLETED').length
    const cancelled = interviews.filter(i => i.status === 'CANCELLED' || i.status === 'NO_SHOW').length
    return { total, scheduled, completed, cancelled }
  }, [interviews])

  // Calendar generation helpers
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear()
    const month = currentCalendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() // 0 = Sun

    const days = []
    // Padding for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, dateStr: null, isCurrentMonth: false })
    }
    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0')
      const dStr = String(d).padStart(2, '0')
      const dateStr = `${year}-${mStr}-${dStr}`
      days.push({ day: d, dateStr, isCurrentMonth: true })
    }
    return days
  }, [currentCalendarDate])

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Form submission: schedule interview
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const app = applications.find(a => a.id === selectedAppId)
    if (!app) return

    addInterview({
      applicationId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      candidateEmail: app.candidateEmail,
      candidateAvatar: app.candidateAvatar,
      jobTitle: app.jobTitle,
      interviewerName,
      interviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      round,
      date,
      time,
      durationMinutes: Number(durationMinutes),
      meetingLink,
      meetingPlatform,
      notes,
      status: 'SCHEDULED'
    })

    // Add In-App notification
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      title: `Interview Scheduled: ${app.candidateName}`,
      message: `${round} with ${interviewerName} on ${date} (${time}).`,
      type: 'SUCCESS',
      timestamp: 'Just now',
      isRead: false
    }
    setNotifications(prev => [newNotif, ...prev])

    showToast(`✔ Interview scheduled for ${app.candidateName}! Notification sent.`)
    setScheduleModalOpen(false)
  }

  // Open Scorecard Modal
  const openScorecardModal = (interview: Interview) => {
    setActiveInterview(interview)
    setOverallRecommendation(interview.overallRecommendation || 'HIRE')
    setRating(interview.rating || 4)
    setTechnicalScore(interview.criteriaRatings?.technicalCompetence || 4)
    setProblemSolvingScore(interview.criteriaRatings?.problemSolving || 4)
    setCommunicationScore(interview.criteriaRatings?.communication || 4)
    setCulturalFitScore(interview.criteriaRatings?.culturalFit || 4)
    setStrengths(interview.strengthsNoted || '')
    setConcerns(interview.concernsNoted || '')
    setDetailedFeedback(interview.feedback || '')
    setScorecardModalOpen(true)
  }

  // Submit Scorecard
  const handleScorecardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeInterview) return

    submitInterviewFeedback(activeInterview.id, {
      rating,
      overallRecommendation,
      technicalScore,
      problemSolvingScore,
      communicationScore,
      culturalFitScore,
      strengths,
      concerns,
      detailedFeedback: detailedFeedback.trim() || 'Evaluated candidate competencies; scorecard recorded.'
    })

    // In-app notification for scorecard
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      title: `Scorecard Recorded: ${activeInterview.candidateName}`,
      message: `Feedback submitted: ${rating}★ (${overallRecommendation}) by ${activeInterview.interviewerName}.`,
      type: 'SUCCESS',
      timestamp: 'Just now',
      isRead: false
    }
    setNotifications(prev => [newNotif, ...prev])

    showToast(`✔ Scorecard submitted for ${activeInterview.candidateName}! Candidate status updated.`)
    setScorecardModalOpen(false)
    setActiveInterview(null)
  }

  // Candidate history modal
  const openHistoryModal = (candidateId?: string) => {
    if (!candidateId) return
    setHistoryCandidateId(candidateId)
    setHistoryModalOpen(true)
  }

  const candidateHistoryInterviews = useMemo(() => {
    if (!historyCandidateId) return []
    return interviews.filter(i => i.candidateId === historyCandidateId || i.candidateName === historyCandidateId)
  }, [interviews, historyCandidateId])

  const targetCandidateApp = applications.find(
    a => a.candidateId === historyCandidateId || a.candidateName === historyCandidateId
  )

  const unreadCount = notifications.filter(n => !n.isRead).length

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Management & Calendar</h1>
            <Badge variant="purple" size="sm">
              <CalendarDays className="w-3 h-3 mr-1" /> Multi-Round Orchestration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schedule evaluations, assign interview panels, capture structured scorecards, and review candidate history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications button */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title="In-App Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Schedule button */}
          <Button variant="primary" size="sm" onClick={() => setScheduleModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule New Interview
          </Button>
        </div>
      </div>

      {/* In-App Notifications Drawer / Popover */}
      {notificationsOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs">In-App Activity Notifications</h3>
            </div>
            <button
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
              }}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                  n.isRead ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{n.title}</span>
                  <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rounds</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Upcoming</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-0.5">{stats.scheduled}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-0.5">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Cancelled / No-Show</p>
              <h3 className="text-2xl font-extrabold text-rose-700 mt-0.5">{stats.cancelled}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Switch View (List / Calendar) + Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          {/* View toggle buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Interactive Calendar
            </button>
          </div>

          {/* Status filters in list view */}
          {activeView === 'list' && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              {(['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    filterStatus === st
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate, round, interviewer..."
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
      </div>

      {/* VIEW 1: INTERACTIVE CALENDAR VIEW */}
      {activeView === 'calendar' && (
        <Card className="p-4 space-y-4">
          {/* Calendar Header with Month Selector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">
                {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCalendarDate(new Date('2026-11-01'))}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-slate-50 p-2 text-center text-[11px] font-bold text-slate-600">
                {d}
              </div>
            ))}

            {calendarDays.map((cd, index) => {
              if (!cd.isCurrentMonth || !cd.dateStr) {
                return <div key={`empty-${index}`} className="bg-slate-50/50 min-h-[110px] p-1.5" />
              }

              // Find interviews on this date
              const dayInterviews = interviews.filter(
                i => i.date === cd.dateStr || (i.date && i.date.startsWith(cd.dateStr!))
              )

              return (
                <div
                  key={cd.dateStr}
                  className="bg-white min-h-[110px] p-2 flex flex-col justify-between hover:bg-indigo-50/20 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">{cd.day}</span>
                    {dayInterviews.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center">
                        {dayInterviews.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto">
                    {dayInterviews.map(di => (
                      <div
                        key={di.id}
                        onClick={() => openScorecardModal(di)}
                        className={`p-1 rounded text-[10px] font-semibold border cursor-pointer truncate ${
                          di.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : di.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                        }`}
                        title={`${di.candidateName} — ${di.round} (${di.time})`}
                      >
                        {di.time.split(' ')[0]} {di.candidateName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* VIEW 2: CARDS & LIST VIEW */}
      {activeView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInterviews.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No interview sessions match the specified filters.
            </div>
          ) : (
            filteredInterviews.map(int => (
              <Card key={int.id} className="hover:border-indigo-300 transition-all flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  {/* Card Header: Candidate avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={int.candidateAvatar}
                        alt={int.candidateName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{int.candidateName}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{int.jobTitle}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        int.status === 'COMPLETED'
                          ? 'success'
                          : int.status === 'SCHEDULED'
                          ? 'purple'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {int.status}
                    </Badge>
                  </div>

                  {/* Interview Session Details */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{int.round}</span>
                      <span className="text-slate-400 font-medium">{int.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{int.date} · {int.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Panel: {int.interviewerName}</span>
                    </div>
                    {int.notes && (
                      <div className="flex items-start gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{int.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Completed Scorecard Preview */}
                  {int.status === 'COMPLETED' && (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-emerald-800 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Rating: {int.rating} / 5</span>
                        </div>
                        {int.overallRecommendation && (
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                            {int.overallRecommendation}
                          </span>
                        )}
                      </div>
                      {int.feedback && (
                        <p className="text-[11px] text-slate-600 italic">"{int.feedback}"</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Meeting link */}
                    <a
                      href={int.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" /> Join Call
                    </a>

                    <div className="flex items-center gap-1.5">
                      {/* View candidate history */}
                      <button
                        onClick={() => openHistoryModal(int.candidateId || int.candidateName)}
                        title="View Candidate Full Interview History"
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      {/* Status actions */}
                      {int.status === 'SCHEDULED' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => openScorecardModal(int)}
                          >
                            Scorecard
                          </Button>
                          <button
                            onClick={() => {
                              updateInterviewStatus(int.id, 'CANCELLED')
                              showToast(`Interview with ${int.candidateName} marked CANCELLED.`)
                            }}
                            title="Cancel Interview"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Interview Round"
        description="Select candidate, interviewer panel, round topic, and calendar invitation link"
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Candidate *</label>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.candidateName} — {app.jobTitle} (Fit Score: {app.aiAnalysis?.matchScore}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Round *</label>
              <select
                value={round}
                onChange={e => setRound(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="Phone Screening">Phone Screening</option>
                <option value="Technical Round 1">Technical Round 1</option>
                <option value="System Design">System Design</option>
                <option value="Cultural Fit">Cultural Fit</option>
                <option value="Final Executive">Final Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Interviewer *</label>
              <input
                type="text"
                value={interviewerName}
                onChange={e => setInterviewerName(e.target.value)}
                placeholder="e.g. Sarah Jenkins or Priya Sharma"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Window *</label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 14:00 - 15:00 UTC"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (minutes)</label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
                <option value={120}>120 mins</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Platform</label>
              <select
                value={meetingPlatform}
                onChange={e => setMeetingPlatform(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="In-Person">In-Person Office</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link / Room</label>
              <input
                type="text"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Agenda / Focus Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Focus on distributed systems, concurrency, and FastAPI architecture..."
              rows={2}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Schedule & Dispatch Notification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Structured Scorecard Feedback Modal */}
      {activeInterview && (
        <Modal
          isOpen={scorecardModalOpen}
          onClose={() => setScorecardModalOpen(false)}
          title={`Interviewer Scorecard: ${activeInterview.candidateName}`}
          description={`${activeInterview.round} for ${activeInterview.jobTitle}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleScorecardSubmit} className="space-y-4 text-xs">
            {/* Overall Decision Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Overall Recommendation *</label>
                <select
                  value={overallRecommendation}
                  onChange={e => setOverallRecommendation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="STRONG_HIRE">STRONG HIRE (Exceptional)</option>
                  <option value="HIRE">HIRE (Meets All Benchmarks)</option>
                  <option value="NO_HIRE">NO HIRE (Does Not Meet Bar)</option>
                  <option value="STRONG_NO_HIRE">STRONG NO HIRE</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Overall Rating (1 - 5 Stars) *</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="font-extrabold text-sm ml-2 text-slate-800">{rating} / 5</span>
                </div>
              </div>
            </div>

            {/* 4 Dimension Score Sliders */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Technical Competence:</span>
                  <span className="text-indigo-600 font-bold">{technicalScore} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={technicalScore}
                  onChange={e => setTechnicalScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Problem Solving:</span>
                  <span className="text-indigo-600 font-bold">{problemSolvingScore} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={problemSolvingScore}
                  onChange={e => setProblemSolvingScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Communication:</span>
                  <span className="text-indigo-600 font-bold">{communicationScore} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={communicationScore}
                  onChange={e => setCommunicationScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Culture & Values:</span>
                  <span className="text-indigo-600 font-bold">{culturalFitScore} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={culturalFitScore}
                  onChange={e => setCulturalFitScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-emerald-800 block mb-1">Key Strengths Observed:</label>
                <textarea
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  placeholder="e.g. Deep architectural clarity, fast coding, clear trade-off analysis..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-rose-800 block mb-1">Gaps / Areas of Concern:</label>
                <textarea
                  value={concerns}
                  onChange={e => setConcerns(e.target.value)}
                  placeholder="e.g. Limited experience with Kubernetes production troubleshooting..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Detailed Feedback */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Detailed Narrative Feedback *</label>
              <textarea
                value={detailedFeedback}
                onChange={e => setDetailedFeedback(e.target.value)}
                placeholder="Comprehensive feedback notes justifying the hiring decision..."
                rows={3}
                required
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setScorecardModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Scorecard & Advance Stage
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Candidate Full Interview History Modal */}
      {historyModalOpen && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Candidate Cross-Round Interview History"
          description={`Complete evaluation trajectory across all interview stages`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {targetCandidateApp && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <img
                    src={targetCandidateApp.candidateAvatar}
                    alt={targetCandidateApp.candidateName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{targetCandidateApp.candidateName}</h4>
                    <p className="text-[11px] text-slate-500">{targetCandidateApp.jobTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">AI Screening Match</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {targetCandidateApp.aiAnalysis?.matchScore}%
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {candidateHistoryInterviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No previous interview rounds recorded for this candidate.
                </div>
              ) : (
                candidateHistoryInterviews.map((ci, idx) => (
                  <div
                    key={ci.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{ci.round}</span>
                      </div>
                      <Badge
                        variant={ci.status === 'COMPLETED' ? 'success' : 'purple'}
                        size="sm"
                      >
                        {ci.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <div>Date: {ci.date} ({ci.time})</div>
                      <div>Interviewer: {ci.interviewerName}</div>
                    </div>

                    {ci.status === 'COMPLETED' && (
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            Rating: {ci.rating} / 5 ★
                          </span>
                          {ci.overallRecommendation && (
                            <span className="font-bold px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800">
                              {ci.overallRecommendation}
                            </span>
                          )}
                        </div>
                        {ci.feedback && (
                          <p className="text-[11px] text-slate-600 italic">"{ci.feedback}"</p>
                        )}
                      </div>
                    )}
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

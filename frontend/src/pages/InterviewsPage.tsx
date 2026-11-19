import React, { useState } from 'react'
import {
  CalendarDays,
  Plus,
  Clock,
  Video,
  CheckCircle2,
  Star,
  Users,
  Search,
  MessageSquare
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Interview, InterviewRound, InterviewStatus } from '../types'

export const InterviewsPage: React.FC = () => {
  const { interviews, applications, addInterview, updateInterviewRating } = useApp()

  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false)
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null)

  // Form states for scheduling
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || '')
  const [interviewerName, setInterviewerName] = useState('Sarah Jenkins')
  const [round, setRound] = useState<InterviewRound>('Technical Round 1')
  const [date, setDate] = useState('2026-11-23')
  const [time, setTime] = useState('14:00 - 15:00')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hiring-sync')

  // Form states for feedback scorecard
  const [feedbackRating, setFeedbackRating] = useState(4)
  const [feedbackNotes, setFeedbackNotes] = useState('')

  const filteredInterviews = interviews.filter(i => {
    return filterStatus === 'ALL' || i.status === filterStatus
  })

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const app = applications.find(a => a.id === selectedAppId)
    if (!app) return

    addInterview({
      applicationId: app.id,
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
      status: 'SCHEDULED'
    })

    setScheduleModalOpen(false)
  }

  const handleScorecardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeInterview) return

    updateInterviewRating(activeInterview.id, feedbackRating, feedbackNotes)
    setScorecardModalOpen(false)
    setActiveInterview(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Coordination & Scorecards</h1>
          <p className="text-xs text-slate-500 mt-1">
            Coordinate evaluation rounds, dispatch calendar invites, and capture structured interviewer scorecards.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setScheduleModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Schedule New Interview
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Interviews ({interviews.length})
        </button>
        <button
          onClick={() => setFilterStatus('SCHEDULED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'SCHEDULED'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Scheduled ({interviews.filter(i => i.status === 'SCHEDULED').length})
        </button>
        <button
          onClick={() => setFilterStatus('COMPLETED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'COMPLETED'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed ({interviews.filter(i => i.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInterviews.map(int => (
          <Card key={int.id} className="hover:border-indigo-300 transition-all flex flex-col justify-between">
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={int.candidateAvatar}
                    alt={int.candidateName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{int.candidateName}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{int.jobTitle}</p>
                  </div>
                </div>
                <Badge
                  variant={int.status === 'COMPLETED' ? 'success' : int.status === 'SCHEDULED' ? 'purple' : 'neutral'}
                  size="sm"
                >
                  {int.status}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{int.round}</span>
                  <span className="text-slate-400 font-medium">{int.durationMinutes} mins</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{int.date} · {int.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Interviewer: {int.interviewerName}</span>
                </div>
              </div>

              {/* Scorecard Feedback Result if completed */}
              {int.status === 'COMPLETED' && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Rating: {int.rating} / 5</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">"{int.feedback}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={int.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                >
                  <Video className="w-3.5 h-3.5 mr-1" /> Meeting Link
                </a>

                {int.status === 'SCHEDULED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setActiveInterview(int)
                      setScorecardModalOpen(true)
                    }}
                  >
                    Submit Feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Interview Round"
        description="Select candidate, interviewer, round topic, and calendar invitation link"
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
                  {app.candidateName} — {app.jobTitle} (Score: {app.aiAnalysis?.matchScore}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Interview Round"
              value={round}
              onChange={e => setRound(e.target.value as InterviewRound)}
              options={[
                { label: 'Phone Screening', value: 'Phone Screening' },
                { label: 'Technical Round 1', value: 'Technical Round 1' },
                { label: 'System Design', value: 'System Design' },
                { label: 'Cultural Fit', value: 'Cultural Fit' },
                { label: 'Final Executive', value: 'Final Executive' }
              ]}
            />
            <Input
              label="Assigned Interviewer"
              value={interviewerName}
              onChange={e => setInterviewerName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
            <Input
              label="Time Range"
              placeholder="e.g. 14:00 - 15:00"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
            <Select
              label="Duration"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              options={[
                { label: '30 Minutes', value: 30 },
                { label: '45 Minutes', value: 45 },
                { label: '60 Minutes', value: 60 },
                { label: '90 Minutes', value: 90 }
              ]}
            />
          </div>

          <Input
            label="Video Conference URL (Meet / Teams / Zoom)"
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Dispatch Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Scorecard Modal */}
      {activeInterview && (
        <Modal
          isOpen={scorecardModalOpen}
          onClose={() => setScorecardModalOpen(false)}
          title={`Interviewer Scorecard: ${activeInterview.candidateName}`}
          description={`${activeInterview.round} for ${activeInterview.jobTitle}`}
          maxWidth="lg"
        >
          <form onSubmit={handleScorecardSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Overall Candidate Rating (1 to 5 Stars):
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 rounded hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= feedbackRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-bold text-slate-700 text-sm">
                  {feedbackRating} / 5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interviewer Qualitative Evaluation & Notes
              </label>
              <textarea
                rows={4}
                required
                value={feedbackNotes}
                onChange={e => setFeedbackNotes(e.target.value)}
                placeholder="Detail technical problem solving, coding test performance, communication clarity, and recommendation..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setScorecardModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Completed Scorecard
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

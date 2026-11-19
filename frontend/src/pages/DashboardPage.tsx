import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  UserCheck,
  UserX,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'

export const DashboardPage: React.FC = () => {
  const { jobs, applications, interviews, analytics } = useApp()

  // Key metrics calculation
  const totalCandidates = applications.length
  const activeJobs = jobs.filter(j => j.status === 'OPEN').length
  const shortlisted = applications.filter(a => a.status === 'SHORTLISTED').length
  const rejected = applications.filter(a => a.status === 'REJECTED').length
  const scheduledInterviews = interviews.filter(i => i.status === 'SCHEDULED').length
  const avgAiScore = Math.round(
    applications.reduce((acc, curr) => acc + (curr.aiAnalysis?.matchScore || 0), 0) / (applications.length || 1)
  )

  const stats = [
    {
      label: 'Total Candidates',
      value: totalCandidates,
      trend: '+18.4% vs last mo',
      trendUp: true,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      link: '/candidates'
    },
    {
      label: 'Active Job Openings',
      value: activeJobs,
      trend: '4 departments',
      trendUp: true,
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/jobs'
    },
    {
      label: 'Shortlisted Candidates',
      value: shortlisted,
      trend: 'Qualified for rounds',
      trendUp: true,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/candidates?status=SHORTLISTED'
    },
    {
      label: 'Rejected Candidates',
      value: rejected,
      trend: 'Screened out by criteria',
      trendUp: false,
      icon: UserX,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      link: '/candidates?status=REJECTED'
    },
    {
      label: 'Scheduled Interviews',
      value: scheduledInterviews,
      trend: 'Next: Today 2:00 PM',
      trendUp: true,
      icon: CalendarDays,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      link: '/interviews'
    },
    {
      label: 'Avg AI Match Score',
      value: `${avgAiScore}%`,
      trend: 'Gemini 1.5 Flash',
      trendUp: true,
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      link: '/screening'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> AI Engine Active · Gemini 1.5 Flash
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recruitment Intelligence Hub</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time candidate telemetry, automated resume parsing, and semantic match scoring across your open requisitions.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Link to="/resumes/upload">
            <Button variant="primary" size="sm" className="bg-white text-slate-900 hover:bg-slate-100 shadow-md">
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Upload & Parse Resumes
            </Button>
          </Link>
          <Link to="/pipeline">
            <Button variant="secondary" size="sm" className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700">
              View Kanban Board &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">{stat.label}</span>
                    <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      {stat.trendUp && <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />}
                      <span className="truncate">{stat.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Velocity Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recruitment Pipeline Velocity</CardTitle>
              <p className="text-xs text-slate-500">Monthly inbound volume vs. AI screened & interviewed candidates</p>
            </div>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Automated AI Telemetry
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyHiringTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorScreened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApplications)"
                  />
                  <Area
                    type="monotone"
                    dataKey="screened"
                    name="AI Screened"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScreened)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Score Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>AI Match Score Spread</CardTitle>
              <p className="text-xs text-slate-500">Applicant distribution by match bracket</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scoreDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="range" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications & Scheduled Interviews Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <CardTitle>Recent Applications & AI Screening</CardTitle>
            </div>
            <Link to="/candidates" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center">
              View All ({applications.length}) <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Target Requisition</th>
                  <th className="px-5 py-3">AI Match Score</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 5).map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={app.candidateAvatar}
                          alt={app.candidateName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{app.candidateName}</p>
                          <p className="text-[11px] text-slate-400">{app.candidateEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{app.jobTitle}</p>
                      <span className="text-[10px] text-slate-500">{app.jobDepartment}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          app.status === 'SHORTLISTED' || app.status === 'OFFERED'
                            ? 'success'
                            : app.status === 'REJECTED'
                            ? 'danger'
                            : app.status === 'INTERVIEW'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/screening?candidateId=${app.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                          Review AI <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Scheduled Interviews Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <CardTitle>Upcoming Interviews</CardTitle>
            </div>
            <Link to="/interviews" className="text-xs text-indigo-600 font-semibold hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {interviews.filter(i => i.status === 'SCHEDULED').length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No pending interviews scheduled.</p>
            ) : (
              interviews
                .filter(i => i.status === 'SCHEDULED')
                .slice(0, 3)
                .map(int => (
                  <div key={int.id} className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={int.candidateAvatar}
                          alt={int.candidateName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{int.candidateName}</p>
                          <p className="text-[11px] text-slate-500">{int.round}</p>
                        </div>
                      </div>
                      <Badge variant="purple" size="sm">
                        {int.durationMinutes}m
                      </Badge>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {int.date} · {int.time}
                      </span>
                      <a
                        href={int.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Join Call &rarr;
                      </a>
                    </div>
                  </div>
                ))
            )}

            <Link to="/interviews" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                + Schedule Next Interview
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

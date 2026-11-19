import React, { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export const AnalyticsPage: React.FC = () => {
  const { analytics, auditLogs } = useApp()
  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleExport = () => {
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Analytics & Executive Reports</h1>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quantify pipeline velocity, hiring funnel drop-offs, AI match distribution, and team throughput.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Year to Date">Year to Date (2026)</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" />
            {downloadSuccess ? 'Report Exported!' : 'Export CSV / PDF'}
          </Button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Average Time-to-Hire</span>
            <div className="text-2xl font-bold text-slate-900">18.4 Days</div>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> -42% faster with Gemini AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Offer Acceptance Rate</span>
            <div className="text-2xl font-bold text-slate-900">89.2%</div>
            <p className="text-[11px] text-indigo-600 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> 23 of 26 accepted offers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Avg AI Screening Latency</span>
            <div className="text-2xl font-bold text-slate-900">4.18 Seconds</div>
            <p className="text-[11px] text-slate-500 font-medium">
              PyMuPDF + Gemini 1.5 Flash
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Screening Quality Accuracy</span>
            <div className="text-2xl font-bold text-slate-900">96.4%</div>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Interviewer agreement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Pipeline Progression Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Inbound Flow vs. Hiring Conversions</CardTitle>
              <p className="text-xs text-slate-500">Monthly breakdown of candidate volume progressing through funnel</p>
            </div>
            <Badge variant="neutral" size="sm">
              Monthly Trend
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyHiringTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Applications Received"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gradApps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interviewed"
                    name="Interviews Conducted"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#gradInterviews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown Bar Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Candidates by Department</CardTitle>
              <p className="text-xs text-slate-500">Applicant volume distribution</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={9} angle={-25} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="candidates" name="Candidates" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Score Spread & Applicant Sourcing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Distribution Breakdown */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>AI Match Score Breakdown</CardTitle>
              <p className="text-xs text-slate-500">Candidate qualification brackets</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.scoreDistribution.map(bracket => (
              <div key={bracket.range} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{bracket.range}</span>
                  <span className="font-bold">{bracket.count} applicants</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(bracket.count / 445) * 100}%`,
                      backgroundColor: bracket.color
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Applicant Sourcing Channels */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Application Source Channels</CardTitle>
              <p className="text-xs text-slate-500">Inbound candidate origin telemetry</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.sourceBreakdown.map(src => (
              <div key={src.source} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{src.source}</span>
                  <span className="text-indigo-600 font-bold">{src.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <CardTitle>Platform Operational Audit Trail</CardTitle>
          </div>
          <span className="text-xs text-slate-500">Real-time event logging</span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Event / Action</th>
                <th className="px-5 py-3">Target Subject</th>
                <th className="px-5 py-3">Initiated By</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-900">{log.action}</td>
                  <td className="px-5 py-3 text-slate-600">{log.target}</td>
                  <td className="px-5 py-3 text-slate-500">{log.actorName}</td>
                  <td className="px-5 py-3 text-slate-400">{log.timestamp}</td>
                  <td className="px-5 py-3 text-right">
                    <Badge
                      variant={
                        log.type === 'SUCCESS' ? 'success' : log.type === 'WARNING' ? 'warning' : 'neutral'
                      }
                      size="sm"
                    >
                      {log.type}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

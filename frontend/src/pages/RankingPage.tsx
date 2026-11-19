import React, { useState, useMemo } from 'react'
import {
  Trophy,
  Medal,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Sliders,
  Scale,
  X,
  ExternalLink
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/ui/ScoreBadge'
import { Modal } from '../components/ui/Modal'
import { Application } from '../types'
import { Link } from 'react-router-dom'

export const RankingPage: React.FC = () => {
  const { applications, jobs } = useApp()

  const [selectedJobId, setSelectedJobId] = useState<string>('ALL')
  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(60)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  // Filter and sort candidates by AI Match Score
  const rankedCandidates = useMemo(() => {
    return applications
      .filter(app => {
        const matchesJob = selectedJobId === 'ALL' || app.jobId === selectedJobId
        const matchesScore = (app.aiAnalysis?.matchScore || 0) >= minScoreThreshold
        return matchesJob && matchesScore
      })
      .sort((a, b) => (b.aiAnalysis?.matchScore || 0) - (a.aiAnalysis?.matchScore || 0))
  }, [applications, selectedJobId, minScoreThreshold])

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== id))
    } else {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, id])
      } else {
        setSelectedForCompare([selectedForCompare[1], id])
      }
    }
  }

  const compareCandidates = useMemo(() => {
    return selectedForCompare
      .map(id => applications.find(a => a.id === id))
      .filter((a): a is Application => !!a)
  }, [applications, selectedForCompare])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Candidate Ranking Leaderboard</h1>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" /> Dynamic Scoring
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic candidate stack-ranking based on custom job rubrics and Gemini semantic match scores.
          </p>
        </div>

        {selectedForCompare.length === 2 && (
          <Button variant="primary" size="sm" onClick={() => setCompareModalOpen(true)}>
            <Scale className="w-4 h-4 mr-1.5" /> Compare 2 Selected Candidates
          </Button>
        )}
      </div>

      {/* Filter and Score Slider Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Filter by Opening:</span>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 w-full sm:w-80"
            >
              <option value="ALL">All Requisitions ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-72 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Sliders className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Cutoff Threshold:</span>
                <span className="text-indigo-600 font-bold">{minScoreThreshold}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                step={5}
                value={minScoreThreshold}
                onChange={e => setMinScoreThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium Highlights (when filtered to a specific job or all) */}
      {rankedCandidates.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 (Silver) */}
          <Card className="order-2 md:order-1 border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <CardContent className="p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold shadow-xs">
                #2
              </div>
              <img
                src={rankedCandidates[1].candidateAvatar}
                alt={rankedCandidates[1].candidateName}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-300"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{rankedCandidates[1].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[1].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[1].aiAnalysis?.matchScore} size="md" />
              <div className="pt-2">
                <Link to={`/screening?candidateId=${rankedCandidates[1].id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Inspect AI Scorecard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rank 1 (Gold) */}
          <Card className="order-1 md:order-2 border-amber-300 bg-gradient-to-b from-amber-50/50 via-white to-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-extrabold shadow-sm">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <img
                src={rankedCandidates[0].candidateAvatar}
                alt={rankedCandidates[0].candidateName}
                className="w-20 h-20 rounded-full object-cover mx-auto border-3 border-amber-400 shadow-md"
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wider">
                  Top Recommended Fit
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{rankedCandidates[0].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[0].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[0].aiAnalysis?.matchScore} size="lg" />
              <div className="pt-2">
                <Link to={`/screening?candidateId=${rankedCandidates[0].id}`}>
                  <Button variant="primary" size="sm" className="w-full text-xs bg-amber-600 hover:bg-amber-700">
                    Review #1 Candidate
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rank 3 (Bronze) */}
          <Card className="order-3 border-slate-200 bg-gradient-to-b from-orange-50/30 to-white">
            <CardContent className="p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold shadow-xs">
                #3
              </div>
              <img
                src={rankedCandidates[2].candidateAvatar}
                alt={rankedCandidates[2].candidateName}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-orange-200"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{rankedCandidates[2].candidateName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{rankedCandidates[2].jobTitle}</p>
              </div>
              <ScoreBadge score={rankedCandidates[2].aiAnalysis?.matchScore} size="md" />
              <div className="pt-2">
                <Link to={`/screening?candidateId=${rankedCandidates[2].id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Inspect AI Scorecard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Ranked Candidates Directory</CardTitle>
            <Badge variant="neutral" size="sm">
              {rankedCandidates.length} Meeting Criteria
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Tip: Select checkboxes to perform side-by-side comparison
          </p>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10">Compare</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Applicant Profile</th>
                <th className="px-4 py-3">Target Requisition</th>
                <th className="px-4 py-3">Overall Fit</th>
                <th className="px-4 py-3">Technical</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedCandidates.map((app, index) => {
                const isSelected = selectedForCompare.includes(app.id)
                return (
                  <tr key={app.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCompare(app.id)}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800'
                          : index === 1
                          ? 'bg-slate-200 text-slate-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-slate-400'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={app.candidateAvatar}
                          alt={app.candidateName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{app.candidateName}</p>
                          <p className="text-[11px] text-slate-400">{app.candidateEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{app.jobTitle}</p>
                      <span className="text-[10px] text-slate-400">{app.jobDepartment}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={app.aiAnalysis?.matchScore} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {app.aiAnalysis?.technicalSkillsScore}%
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {app.aiAnalysis?.experienceScore}%
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="neutral" size="sm">
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link to={`/screening?candidateId=${app.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          View AI <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side-by-Side Candidate Comparison Modal */}
      {compareCandidates.length === 2 && (
        <Modal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          title="Head-to-Head Candidate AI Evaluation"
          description="Side-by-side comparison of competencies, experience, and Gemini fit verdicts"
          maxWidth="4xl"
        >
          <div className="grid grid-cols-2 gap-6 text-xs divide-x divide-slate-200">
            {compareCandidates.map((cand, idx) => (
              <div key={cand.id} className={`space-y-4 ${idx === 1 ? 'pl-6' : ''}`}>
                <div className="flex items-center gap-3">
                  <img
                    src={cand.candidateAvatar}
                    alt={cand.candidateName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cand.candidateName}</h4>
                    <p className="text-slate-500">{cand.jobTitle}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Overall AI Match</span>
                  <div className="text-3xl font-extrabold text-indigo-600 mt-1">
                    {cand.aiAnalysis?.matchScore}%
                  </div>
                  <Badge variant="purple" size="sm" className="mt-1">
                    {cand.aiAnalysis?.verdict}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Technical Competence:</span>
                    <span>{cand.aiAnalysis?.technicalSkillsScore}%</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Experience Depth:</span>
                    <span>{cand.aiAnalysis?.experienceScore}% ({cand.aiAnalysis?.extractedExperienceYears} yrs)</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Education:</span>
                    <span>{cand.aiAnalysis?.highestEducation}</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">Demonstrated Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {cand.aiAnalysis?.matchedSkills.map(s => (
                      <Badge key={s} variant="success" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">Missing Requirements:</span>
                  <div className="flex flex-wrap gap-1">
                    {cand.aiAnalysis?.missingSkills.length === 0 ? (
                      <span className="text-slate-400">None detected</span>
                    ) : (
                      cand.aiAnalysis?.missingSkills.map(s => (
                        <Badge key={s} variant="danger" size="sm">
                          {s}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg text-slate-700 border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1">AI Verdict:</span>
                  <p className="leading-relaxed">{cand.aiAnalysis?.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import {
  Settings as SettingsIcon,
  Sparkles,
  Shield,
  Bell,
  Users,
  CheckCircle2,
  Save,
  Sliders,
  Lock,
  Plus
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'

export const SettingsPage: React.FC = () => {
  const { systemSettings, updateSystemSettings } = useApp()

  const [geminiModel, setGeminiModel] = useState(systemSettings.geminiModel)
  const [autoScreen, setAutoScreen] = useState(systemSettings.autoScreenResumes)
  const [anonymizePII, setAnonymizePII] = useState(systemSettings.anonymizeCandidatePII)
  const [emailNotifs, setEmailNotifs] = useState(systemSettings.emailNotifications)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Default weights
  const [weights, setWeights] = useState({
    skills: systemSettings.defaultWeights.skills,
    experience: systemSettings.defaultWeights.experience,
    education: systemSettings.defaultWeights.education,
    domain: systemSettings.defaultWeights.domain
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateSystemSettings({
      geminiModel,
      autoScreenResumes: autoScreen,
      anonymizeCandidatePII: anonymizePII,
      emailNotifications: emailNotifs,
      defaultWeights: weights
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const teamMembers = [
    { name: 'Sarah Jenkins', email: 'sarah.jenkins@hireai.enterprise', role: 'RECRUITER', status: 'ACTIVE' },
    { name: 'Dr. Michael Chen', email: 'mchen@hireai.enterprise', role: 'INTERVIEWER', status: 'ACTIVE' },
    { name: 'David Kross', email: 'dkross@hireai.enterprise', role: 'SUPER_ADMIN', status: 'ACTIVE' },
    { name: 'Rachel Vance', email: 'rvance@hireai.enterprise', role: 'RECRUITER', status: 'INVITED' }
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & AI Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Tune Google Gemini model parameters, default scoring weights, blind screening rules, and member permissions.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Platform settings updated successfully!</span>
          </div>
        )}

        {/* AI Engine Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <CardTitle>Google Gemini AI Engine Configuration</CardTitle>
            </div>
            <Badge variant="purple" size="sm">
              Inference Parameters
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Reasoning Model
                </label>
                <select
                  value={geminiModel}
                  onChange={e => setGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Fastest & Cost-Effective)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Contextual Reasoning)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen High Throughput)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  All prompts utilize strict JSON output schema validation for predictable scoring.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Automatic Resume Scoring</span>
                  <p className="text-[11px] text-slate-500">
                    Immediately trigger PyMuPDF extraction and Gemini scoring upon resume file upload.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoScreen}
                  onChange={e => setAutoScreen(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Default Scoring Weights */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Global Default Scoring Rubric Weights (%)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Skills: {weights.skills}%
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={weights.skills}
                    onChange={e => setWeights({ ...weights, skills: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Experience: {weights.experience}%
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={weights.experience}
                    onChange={e => setWeights({ ...weights, experience: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Education: {weights.education}%
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={weights.education}
                    onChange={e => setWeights({ ...weights, education: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Domain: {weights.domain}%
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={weights.domain}
                    onChange={e => setWeights({ ...weights, domain: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy, Bias-Reduction & Blind Screening */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <CardTitle>Blind Hiring & Bias Mitigation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">
                  Anonymize Candidate PII During Initial Screening
                </span>
                <p className="text-[11px] text-slate-500 max-w-xl">
                  Automatically redact candidate names, profile photos, addresses, and phone numbers during preliminary screening rounds to eliminate unconscious bias.
                </p>
              </div>
              <input
                type="checkbox"
                checked={anonymizePII}
                onChange={e => setAnonymizePII(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Collaboration & RBAC */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <CardTitle>Hiring Team Members & RBAC</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1" /> Invite Colleague
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Team Member</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map(m => (
                  <tr key={m.email} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="purple" size="sm">
                        {m.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" className="text-indigo-600 hover:underline font-semibold">
                        Edit Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md">
            <Save className="w-4 h-4 mr-1.5" /> Save Platform Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}

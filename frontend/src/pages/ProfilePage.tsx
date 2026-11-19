import React, { useState } from 'react'
import {
  UserCheck,
  Mail,
  Building,
  Shield,
  Key,
  Save,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

export const ProfilePage: React.FC = () => {
  const { user, setUser, auditLogs } = useApp()

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [title, setTitle] = useState(user.title)
  const [department, setDepartment] = useState(user.department)
  const [bio, setBio] = useState(
    'Leading talent acquisition strategy for engineering and artificial intelligence. Championing automated semantic resume screening and bias-free hiring workflows.'
  )
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setUser(prev => ({
      ...prev,
      name,
      email,
      title,
      department
    }))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruiter Profile & Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your enterprise talent identity, workstation notifications, and role permissions.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-200 shadow-md"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <Badge variant="purple" size="sm">
              <Shield className="w-3 h-3 mr-1" /> {user.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">{user.title}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> {user.department}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm">
          Change Avatar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal & Professional Details</CardTitle>
            <span className="text-xs text-slate-400">Updates live across the platform</span>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <Input
                  label="Work Email *"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Job Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <Input
                  label="Department"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm">
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Roles & Security Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <CardTitle>Role Access Privileges</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Requisitions & Weighting:</span>
                <span className="font-bold text-emerald-600">Full Access</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Resume Ingestion & Parsing:</span>
                <span className="font-bold text-emerald-600">Full Access</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Gemini AI Model Configuration:</span>
                <span className="font-bold text-emerald-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Candidate Pipeline Decisions:</span>
                <span className="font-bold text-emerald-600">Authorized</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <CardTitle>Security & Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-500">
                Password last changed 14 days ago. Two-Factor Authentication (2FA) is enforced.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

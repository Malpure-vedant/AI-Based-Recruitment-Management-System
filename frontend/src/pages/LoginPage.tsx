import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useApp } from '../context/AppContext'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('sarah.jenkins@hireai.enterprise')
  const [password, setPassword] = useState('••••••••••••')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useApp()
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-950 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">TalentPulse AI</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Recruitment Intelligence Platform</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your work credentials to access your talent portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" defaultChecked className="rounded accent-indigo-600" />
                <span>Remember this workstation</span>
              </label>
              <a href="#forgot" className="text-indigo-600 font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Demo Account Credentials</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Role: <span className="font-semibold text-slate-700">{user.role}</span> ({user.name})
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Sign In" directly to explore the dashboard.</p>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Create an organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-950 px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white shadow-lg mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-white">Create Enterprise Organization</h1>
          <p className="text-xs text-slate-400 mt-0.5">Supercharge your hiring pipeline with Gemini AI</p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-3.5 text-xs">
          <Input
            label="Full Name *"
            placeholder="Sarah Jenkins"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Company / Organization *"
            placeholder="Acme Global Inc."
            value={company}
            onChange={e => setCompany(e.target.value)}
            required
          />
          <Input
            label="Work Email *"
            type="email"
            placeholder="sarah@acme.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Create Secure Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className="space-y-1 pt-1 text-slate-600 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Gemini 1.5/2.0 API integration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>PyMuPDF automated resume parsing engine</span>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-4">
            Initialize Platform Workspace
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

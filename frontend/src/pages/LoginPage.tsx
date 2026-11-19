import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Building2, User } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useApp } from '../context/AppContext'
import { authApi } from '../lib/api'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('sarah.jenkins@hireai.enterprise')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { login } = useApp()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const ok = await login(email, password)
      if (ok) {
        navigate('/')
      } else {
        setErrorMessage('Authentication failed. Please verify your credentials.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authentication server. Please check your network.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setEmail('sarah.jenkins@hireai.enterprise')
    setPassword('admin123')
    setErrorMessage(null)
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

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

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
          <div
            onClick={fillDemoAdmin}
            className="mt-6 p-3 bg-slate-50 hover:bg-indigo-50/50 cursor-pointer transition-colors border border-slate-200/80 rounded-xl text-xs text-slate-600"
            title="Click to autofill seeded credentials"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Seeded Administrator Credentials</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                Autofill
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">sarah.jenkins@hireai.enterprise / admin123</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Stored in PostgreSQL with encrypted password.</p>
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
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { login } = useApp()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      await authApi.register({
        email,
        password,
        full_name: name,
        role: 'RECRUITER',
        department: company,
        title: 'Talent Acquisition Partner'
      })

      // Immediately sign in with the created account
      const ok = await login(email, password)
      if (ok) {
        navigate('/')
      } else {
        navigate('/login')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. The email address may already be in use.')
    } finally {
      setIsLoading(false)
    }
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

        {errorMessage && (
          <div className="mx-8 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="p-8 space-y-3.5 text-xs">
          <Input
            label="Full Name *"
            icon={<User className="w-4 h-4" />}
            placeholder="Sarah Jenkins"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            label="Company / Department *"
            icon={<Building2 className="w-4 h-4" />}
            placeholder="Acme Global Inc."
            value={company}
            onChange={e => setCompany(e.target.value)}
            required
          />
          <Input
            label="Work Email *"
            type="email"
            icon={<Mail className="w-4 h-4" />}
            placeholder="sarah@acme.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Create Secure Password *"
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="Minimum 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className="space-y-1 pt-1 text-slate-600 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Gemini 1.5/2.0 AI screening engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>PyMuPDF automated resume parsing engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>PostgreSQL persistent candidate & interview tracking</span>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-4" isLoading={isLoading}>
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

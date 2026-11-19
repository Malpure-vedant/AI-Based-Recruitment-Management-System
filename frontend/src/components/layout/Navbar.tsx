import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Plus,
  UploadCloud,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button } from '../ui/Button'

export interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenCreateJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenCreateJob }) => {
  const { user, auditLogs, logout } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleLogout = async () => {
    setShowProfileMenu(false)
    await logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/candidates?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates, skills, jobs (press Enter)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-100/80 border border-transparent placeholder:text-slate-400 text-slate-800 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
          />
        </form>
      </div>

      {/* Right section: Quick Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Upload Resumes CTA */}
        <Link to="/resumes/upload">
          <Button variant="outline" size="sm" className="hidden md:inline-flex border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50">
            <UploadCloud className="w-4 h-4 mr-1 text-indigo-600" /> Upload Resume
          </Button>
        </Link>

        {/* Quick Post Job Modal trigger */}
        <Button variant="primary" size="sm" onClick={onOpenCreateJob}>
          <Plus className="w-4 h-4 mr-1" /> Post Job
        </Button>

        {/* Live Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-up">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Recruitment Activity Stream</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                    {log.type === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : log.type === 'WARNING' ? (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs flex-1">
                      <p className="font-medium text-slate-800">{log.action}</p>
                      <p className="text-[11px] text-slate-500">{log.target}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{log.timestamp} · by {log.actorName}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <Link to="/analytics" onClick={() => setShowNotifications(false)} className="text-xs text-indigo-600 font-medium hover:underline">
                  View Full Audit Logs & Reports &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
              <span className="block text-[10px] text-slate-500 font-medium">{user.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-up text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                View Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              >
                Platform Settings
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

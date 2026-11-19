import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UploadCloud,
  FileSearch,
  Trophy,
  CalendarDays,
  GitBranch,
  BarChart3,
  UserCheck,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cn } from '../../lib/utils'

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, applications, interviews, jobs, logout } = useApp()

  const navItems = [
    { label: 'Main Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Candidate Management', path: '/candidates', icon: Users, badge: applications.length },
    { label: 'Job Management', path: '/jobs', icon: Briefcase, badge: jobs.filter(j => j.status === 'OPEN').length },
    { label: 'Resume Upload', path: '/resumes/upload', icon: UploadCloud, highlight: true },
    { label: 'AI Resume Screening', path: '/screening', icon: FileSearch },
    { label: 'Candidate Ranking', path: '/ranking', icon: Trophy },
    { label: 'Interview Scheduling', path: '/interviews', icon: CalendarDays, badge: interviews.filter(i => i.status === 'SCHEDULED').length },
    { label: 'Recruitment Pipeline', path: '/pipeline', icon: GitBranch },
    { label: 'Reports & Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'User Profile', path: '/profile', icon: UserCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">TalentPulse</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Recruitment OS</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group select-none',
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900',
                    item.highlight && !location.pathname.includes(item.path) && 'border border-indigo-500/30 bg-indigo-950/20 text-indigo-300'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 text-slate-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

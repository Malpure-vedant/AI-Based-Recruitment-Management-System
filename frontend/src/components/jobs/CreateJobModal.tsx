import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Plus, X, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { EmploymentType, ExperienceLevel } from '../../types'

export interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose }) => {
  const { addJob, systemSettings } = useApp()

  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('Core Engineering')
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)')
  const [type, setType] = useState<EmploymentType>('Full-time')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Senior')
  const [salaryRange, setSalaryRange] = useState('$140,000 - $180,000')
  const [openings, setOpenings] = useState(1)
  const [description, setDescription] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'TypeScript', 'FastAPI'])
  
  // Scoring weights (normalized to 100)
  const [weights, setWeights] = useState({
    skills: systemSettings.defaultWeights.skills,
    experience: systemSettings.defaultWeights.experience,
    education: systemSettings.defaultWeights.education,
    domain: systemSettings.defaultWeights.domain
  })

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    e.preventDefault()
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addJob({
      title,
      department,
      location,
      type,
      experienceLevel,
      salaryRange,
      openings: Number(openings),
      status: 'OPEN',
      description: description || `We are looking for a talented ${title} to join our high-performing team.`,
      responsibilities: [
        `Deliver high quality engineering and architecture for ${department}`,
        'Participate in code reviews, technical designs, and sprint ceremonies',
        'Collaborate cross-functionally with product and design leads'
      ],
      requiredSkills,
      preferredSkills: ['Cloud Platforms', 'Agile/Scrum'],
      scoringWeights: {
        skills: weights.skills / 100,
        experience: weights.experience / 100,
        education: weights.education / 100,
        domain: weights.domain / 100
      }
    })

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Job Requisition"
      description="Define requirements, must-have skills, and custom AI evaluation weights"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title *"
            placeholder="e.g. Senior Machine Learning Engineer"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Select
            label="Department"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            options={[
              { label: 'Artificial Intelligence', value: 'Artificial Intelligence' },
              { label: 'Core Engineering', value: 'Core Engineering' },
              { label: 'Infrastructure & SRE', value: 'Infrastructure & SRE' },
              { label: 'Product & Design', value: 'Product & Design' },
              { label: 'Product Management', value: 'Product Management' },
              { label: 'Sales & Marketing', value: 'Sales & Marketing' }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Location"
            placeholder="e.g. Remote or Austin, TX"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <Select
            label="Employment Type"
            value={type}
            onChange={e => setType(e.target.value as EmploymentType)}
            options={[
              { label: 'Full-time', value: 'Full-time' },
              { label: 'Part-time', value: 'Part-time' },
              { label: 'Contract', value: 'Contract' },
              { label: 'Remote', value: 'Remote' }
            ]}
          />
          <Select
            label="Experience Level"
            value={experienceLevel}
            onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)}
            options={[
              { label: 'Entry', value: 'Entry' },
              { label: 'Mid-Level', value: 'Mid-Level' },
              { label: 'Senior', value: 'Senior' },
              { label: 'Lead', value: 'Lead' },
              { label: 'Executive', value: 'Executive' }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Compensation Band"
            placeholder="e.g. $150,000 - $190,000"
            value={salaryRange}
            onChange={e => setSalaryRange(e.target.value)}
          />
          <Input
            label="Target Openings"
            type="number"
            min={1}
            max={50}
            value={openings}
            onChange={e => setOpenings(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Job Description & Overview
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe role mission, team goals, and expectations..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
          />
        </div>

        {/* Required Skills input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Required Technical Skills (Tags)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Type skill & press Enter (e.g. Docker, PyTorch)"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 rounded-lg border border-slate-200">
            {requiredSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-white border border-slate-300 px-2 py-0.5 rounded text-xs font-medium text-slate-700 shadow-2xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* AI Scoring Rubric Configuration */}
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2.5">
          <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Resume Matching Weights (%)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="block text-[11px] text-slate-600 font-medium">Tech Skills ({weights.skills}%)</span>
              <input
                type="range"
                min={10}
                max={70}
                value={weights.skills}
                onChange={e => setWeights({ ...weights, skills: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <span className="block text-[11px] text-slate-600 font-medium">Experience ({weights.experience}%)</span>
              <input
                type="range"
                min={10}
                max={70}
                value={weights.experience}
                onChange={e => setWeights({ ...weights, experience: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <span className="block text-[11px] text-slate-600 font-medium">Education ({weights.education}%)</span>
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
              <span className="block text-[11px] text-slate-600 font-medium">Domain ({weights.domain}%)</span>
              <input
                type="range"
                min={5}
                max={40}
                value={weights.domain}
                onChange={e => setWeights({ ...weights, domain: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Publish Job Requisition
          </Button>
        </div>
      </form>
    </Modal>
  )
}

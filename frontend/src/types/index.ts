export type UserRole = 'SUPER_ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  title: string;
}

export type JobStatus = 'OPEN' | 'DRAFT' | 'PAUSED' | 'CLOSED';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
export type ExperienceLevel = 'Entry' | 'Mid-Level' | 'Senior' | 'Lead' | 'Executive';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange: string;
  openings: number;
  applicantsCount: number;
  status: JobStatus;
  createdAt: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  scoringWeights: {
    skills: number;
    experience: number;
    education: number;
    domain: number;
  };
}

export type ApplicationStatus = 
  | 'APPLIED' 
  | 'SCREENING' 
  | 'SHORTLISTED' 
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'SELECTED'
  | 'REJECTED'
  | 'INTERVIEW' 
  | 'OFFERED' 
  | 'HIRED';

export interface StatusHistoryItem {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  changedByName?: string | null;
  reason?: string | null;
  createdAt: string;
}

export type FitVerdict = 'STRONG_FIT' | 'MODERATE_FIT' | 'LOW_FIT' | 'NO_FIT';

export interface AIAnalysis {
  matchScore: number;
  technicalSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  domainScore: number;
  verdict: FitVerdict;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestedQuestions: string[];
  extractedExperienceYears: number;
  highestEducation: string;
  processedAt: string;
  tokensUsed: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  headline: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  totalExperienceYears: number;
  highestEducation: string;
  skills: string[];
  applications: Application[];
}

export interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobId: string;
  jobTitle: string;
  jobDepartment: string;
  appliedDate: string;
  status: ApplicationStatus;
  resumeFileName: string;
  resumeFileUrl: string;
  resumeRawTextSnippet: string;
  aiAnalysis?: AIAnalysis;
  notesCount: number;
  candidateSkills?: string[];
  isShortlisted?: boolean;
  shortlistedAt?: string;
  rejectionReason?: string;
  statusHistory?: StatusHistoryItem[];
}

export type InterviewRound = 'Phone Screening' | 'Technical Round 1' | 'System Design' | 'Cultural Fit' | 'Final Executive';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Interview {
  id: string;
  applicationId: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  jobTitle: string;
  interviewerName: string;
  interviewerAvatar?: string;
  interviewerId?: string;
  round: InterviewRound | string;
  date: string;
  time: string;
  durationMinutes: number;
  meetingLink: string;
  meetingPlatform?: string;
  location?: string;
  notes?: string;
  status: InterviewStatus;
  rating?: number;
  overallRecommendation?: string;
  feedback?: string;
  strengthsNoted?: string;
  concernsNoted?: string;
  criteriaRatings?: {
    technicalCompetence: number;
    problemSolving: number;
    communication: number;
    culturalFit: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  actorName: string;
  target: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
}

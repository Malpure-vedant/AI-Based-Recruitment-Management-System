import { User, Job, Application, Interview, AuditLog } from '../types'

export const currentUser: User = {
  id: 'usr-1',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@hireai.enterprise',
  role: 'RECRUITER',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  department: 'Talent Acquisition',
  title: 'Lead Talent Partner & AI Hiring Manager'
}

export const initialJobs: Job[] = [
  {
    id: 'job-101',
    title: 'Senior AI / Machine Learning Engineer',
    department: 'Artificial Intelligence',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$165,000 - $210,000',
    openings: 2,
    applicantsCount: 42,
    status: 'OPEN',
    createdAt: '2026-11-02',
    description: 'We are seeking an experienced AI/ML Engineer to architect, fine-tune, and deploy large language models and agentic workflow systems.',
    responsibilities: [
      'Architect scalable inference pipelines using FastAPI, Triton, and vLLM',
      'Fine-tune state-of-the-art open models (Llama 3, Mistral) and integrate Gemini 1.5/2.0 API',
      'Optimize vector similarity search using pgvector, Qdrant, or Milvus',
      'Collaborate with product teams to build agentic memory and tool-calling systems'
    ],
    requiredSkills: ['Python', 'PyTorch', 'FastAPI', 'LLMs', 'Vector Databases', 'LangChain', 'Docker'],
    preferredSkills: ['Kubernetes', 'MLOps', 'CUDA Optimization', 'PostgreSQL'],
    scoringWeights: {
      skills: 0.40,
      experience: 0.35,
      education: 0.15,
      domain: 0.10
    }
  },
  {
    id: 'job-102',
    title: 'Staff Full-Stack Software Architect',
    department: 'Core Engineering',
    location: 'New York, NY (Remote Friendly)',
    type: 'Full-time',
    experienceLevel: 'Lead',
    salaryRange: '$180,000 - $235,000',
    openings: 1,
    applicantsCount: 68,
    status: 'OPEN',
    createdAt: '2026-10-28',
    description: 'Lead the architecture of our next-generation cloud recruiting platform using React, TypeScript, FastAPI, and distributed databases.',
    responsibilities: [
      'Own end-to-end frontend and backend architectural blueprints and code quality standards',
      'Design event-driven data streaming pipelines and caching strategies',
      'Mentor senior engineers and conduct architecture design reviews'
    ],
    requiredSkills: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'System Design', 'Redis'],
    preferredSkills: ['Tailwind CSS', 'Next.js', 'Kafka', 'GraphQL'],
    scoringWeights: {
      skills: 0.45,
      experience: 0.35,
      education: 0.10,
      domain: 0.10
    }
  },
  {
    id: 'job-103',
    title: 'Senior Cloud DevOps & Platform Engineer',
    department: 'Infrastructure & SRE',
    location: 'Austin, TX (Remote)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$150,000 - $190,000',
    openings: 1,
    applicantsCount: 29,
    status: 'OPEN',
    createdAt: '2026-11-08',
    description: 'Drive zero-downtime automated cloud deployments, Kubernetes cluster scaling, and CI/CD security tooling.',
    responsibilities: [
      'Manage multi-region AWS/GCP Kubernetes clusters with Terraform & ArgoCD',
      'Implement zero-trust security policies, secrets management, and automated vulnerability scanning',
      'Design automated disaster recovery and distributed database backup systems'
    ],
    requiredSkills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD Pipelines', 'Linux', 'Prometheus'],
    preferredSkills: ['Go', 'Helm', 'Istio', 'PostgreSQL Admin'],
    scoringWeights: {
      skills: 0.50,
      experience: 0.30,
      education: 0.10,
      domain: 0.10
    }
  },
  {
    id: 'job-104',
    title: 'Lead UI/UX Product Designer',
    department: 'Product & Design',
    location: 'San Francisco, CA (On-site)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salaryRange: '$140,000 - $175,000',
    openings: 1,
    applicantsCount: 54,
    status: 'OPEN',
    createdAt: '2026-10-15',
    description: 'Craft intuitive, aesthetically pristine enterprise SaaS interfaces, design systems, and rapid interactive prototypes.',
    responsibilities: [
      'Design comprehensive Figma component design systems mapped to Shadcn UI',
      'Conduct user interviews with HR leaders and translate friction points into slick workflows',
      'Collaborate closely with React engineers for pixel-perfect implementation'
    ],
    requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Information Architecture'],
    preferredSkills: ['HTML/CSS basics', 'Motion Design', 'Micro-interactions'],
    scoringWeights: {
      skills: 0.40,
      experience: 0.30,
      education: 0.15,
      domain: 0.15
    }
  },
  {
    id: 'job-105',
    title: 'Technical Product Manager - AI Solutions',
    department: 'Product Management',
    location: 'Seattle, WA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Mid-Level',
    salaryRange: '$135,000 - $165,000',
    openings: 1,
    applicantsCount: 37,
    status: 'PAUSED',
    createdAt: '2026-09-20',
    description: 'Define the roadmap for generative AI workflow automation features and intelligent candidate matching engines.',
    responsibilities: [
      'Bridge engineering, design, and executive stakeholders with crisp PRDs',
      'Analyze funnel drop-offs and drive feature adoption analytics',
      'Coordinate beta test cohorts with pilot enterprise recruiting teams'
    ],
    requiredSkills: ['Product Strategy', 'Agile/Scrum', 'Data Analytics', 'Generative AI Concepts', 'Roadmapping'],
    preferredSkills: ['SQL', 'Jira', 'API Product Management'],
    scoringWeights: {
      skills: 0.35,
      experience: 0.35,
      education: 0.15,
      domain: 0.15
    }
  }
]

export const initialApplications: Application[] = [
  {
    id: 'app-501',
    candidateId: 'cand-1',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@devmail.io',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-101',
    jobTitle: 'Senior AI / Machine Learning Engineer',
    jobDepartment: 'Artificial Intelligence',
    appliedDate: '2026-11-14',
    status: 'INTERVIEW',
    resumeFileName: 'Alex_Rivera_AI_Lead_Resume.pdf',
    resumeFileUrl: '/uploads/resumes/Alex_Rivera_AI_Lead_Resume.pdf',
    resumeRawTextSnippet: 'Alex Rivera - Senior AI Research & Machine Learning Engineer with 6.5 years experience building distributed LLM applications, fine-tuning Llama models, and serving PyTorch models via FastAPI & Triton. Published 2 IEEE conference papers on semantic similarity search.',
    notesCount: 4,
    aiAnalysis: {
      matchScore: 94,
      technicalSkillsScore: 96,
      experienceScore: 92,
      educationScore: 95,
      domainScore: 90,
      verdict: 'STRONG_FIT',
      summary: 'Exceptional candidate exhibiting exact alignment with the technical requirements. Alex brings hands-on production expertise in fine-tuning open-source LLMs, building FastAPI microservices, and implementing low-latency vector databases.',
      matchedSkills: ['Python', 'PyTorch', 'FastAPI', 'LLMs', 'Vector Databases', 'Docker', 'Kubernetes', 'PostgreSQL'],
      missingSkills: ['CUDA Optimization'],
      strengths: [
        '6.5 years of verifiable production AI/ML engineering experience',
        'Direct experience deploying Gemini & vLLM inference pipelines',
        'Master’s degree in Computer Science from Georgia Tech',
        'Strong open-source contributions to LangChain integrations'
      ],
      weaknesses: [
        'Limited direct bare-metal GPU kernel / CUDA level tuning experience'
      ],
      suggestedQuestions: [
        'Can you walk us through the memory optimization techniques you applied when serving 70B parameter models under high concurrency?',
        'How do you prevent hallucinations in multi-step agentic tool-calling workflows?',
        'Describe your strategy for benchmarking embedding models in domain-specific retrieval tasks.'
      ],
      extractedExperienceYears: 6.5,
      highestEducation: 'M.S. in Computer Science',
      processedAt: '2026-11-14 14:22:10',
      tokensUsed: 1420
    }
  },
  {
    id: 'app-502',
    candidateId: 'cand-2',
    candidateName: 'Marcus Vance',
    candidateEmail: 'marcus.vance@techvault.org',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-102',
    jobTitle: 'Staff Full-Stack Software Architect',
    jobDepartment: 'Core Engineering',
    appliedDate: '2026-11-12',
    status: 'SHORTLISTED',
    resumeFileName: 'Marcus_Vance_Staff_Architect.pdf',
    resumeFileUrl: '/uploads/resumes/Marcus_Vance_Staff_Architect.pdf',
    resumeRawTextSnippet: 'Marcus Vance - 9+ years experience as Lead Full-Stack Architect. Designed multi-tenant platforms processing $400M in GMV. Deep mastery of React 19, TypeScript, Python FastAPI, SQLAlchemy 2.0, PostgreSQL partitioning, and Redis caching clusters.',
    notesCount: 2,
    aiAnalysis: {
      matchScore: 91,
      technicalSkillsScore: 93,
      experienceScore: 95,
      educationScore: 85,
      domainScore: 88,
      verdict: 'STRONG_FIT',
      summary: 'Distinguished engineering leader with extensive production experience architecting complex web platforms. Demonstrates master-level comprehension of modern decoupled React architectures, async FastAPI backend patterns, and relational data modeling.',
      matchedSkills: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'System Design', 'Redis', 'Tailwind CSS'],
      missingSkills: ['Kafka'],
      strengths: [
        '9 years leading distributed engineering squads and microservices architecture',
        'Authored robust CI/CD pipelines reducing deployment friction by 70%',
        'Extensive database tuning and query profiling in PostgreSQL'
      ],
      weaknesses: [
        'Primarily used RabbitMQ/Redis Streams rather than Apache Kafka for enterprise message streaming'
      ],
      suggestedQuestions: [
        'How do you handle distributed transactional consistency across decoupled microservices?',
        'What strategies do you adopt for optimistic UI updates in high-volume collaborative applications?'
      ],
      extractedExperienceYears: 9.0,
      highestEducation: 'B.S. in Software Engineering',
      processedAt: '2026-11-12 09:15:44',
      tokensUsed: 1350
    }
  },
  {
    id: 'app-503',
    candidateId: 'cand-3',
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.rostova@cloudsphere.net',
    candidateAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-103',
    jobTitle: 'Senior Cloud DevOps & Platform Engineer',
    jobDepartment: 'Infrastructure & SRE',
    appliedDate: '2026-11-15',
    status: 'OFFERED',
    resumeFileName: 'Elena_Rostova_SRE_Cloud.pdf',
    resumeFileUrl: '/uploads/resumes/Elena_Rostova_SRE_Cloud.pdf',
    resumeRawTextSnippet: 'Elena Rostova, CKA and AWS Solutions Architect Professional certified. 7 years experience administering EKS and GKE Kubernetes clusters, writing modular Terraform modules, and building automated canary deployments with ArgoCD.',
    notesCount: 6,
    aiAnalysis: {
      matchScore: 96,
      technicalSkillsScore: 98,
      experienceScore: 94,
      educationScore: 90,
      domainScore: 95,
      verdict: 'STRONG_FIT',
      summary: 'Top-tier DevOps engineer with dual AWS & CKA certifications. Elena has executed cloud migrations for Tier-1 financial platforms and engineered resilient multi-cloud disaster recovery architectures.',
      matchedSkills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD Pipelines', 'Linux', 'Prometheus', 'Helm', 'Go'],
      missingSkills: [],
      strengths: [
        '100% skill checklist coverage including all preferred competencies',
        'Active contributor to open-source Terraform AWS providers',
        'Demonstrated track record of 99.99% uptime maintenance'
      ],
      weaknesses: [
        'Salary expectation is near the top of the allocated band'
      ],
      suggestedQuestions: [
        'How do you manage secret rotation inside Kubernetes pods without downtime?',
        'Describe a scenario where Terraform state drifted in production and how you reconciled it safely.'
      ],
      extractedExperienceYears: 7.2,
      highestEducation: 'B.S. in Computer Systems',
      processedAt: '2026-11-15 11:40:22',
      tokensUsed: 1280
    }
  },
  {
    id: 'app-504',
    candidateId: 'cand-4',
    candidateName: 'Devon Zhao',
    candidateEmail: 'devon.zhao@designstudio.co',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-104',
    jobTitle: 'Lead UI/UX Product Designer',
    jobDepartment: 'Product & Design',
    appliedDate: '2026-11-10',
    status: 'SCREENING',
    resumeFileName: 'Devon_Zhao_Portfolio_Resume.pdf',
    resumeFileUrl: '/uploads/resumes/Devon_Zhao_Portfolio_Resume.pdf',
    resumeRawTextSnippet: 'Devon Zhao - Staff Product Designer with 6 years experience crafting design systems in Figma and tokens for React/Tailwind frontend teams. Specialized in B2B enterprise dashboards, complex data visualizations, and accessible component hierarchies.',
    notesCount: 1,
    aiAnalysis: {
      matchScore: 88,
      technicalSkillsScore: 90,
      experienceScore: 86,
      educationScore: 85,
      domainScore: 90,
      verdict: 'STRONG_FIT',
      summary: 'Versatile product designer with an outstanding portfolio of data-dense enterprise applications. Demonstrates high empathy for user experience combined with technical understanding of Tailwind CSS and design tokens.',
      matchedSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Information Architecture', 'HTML/CSS basics'],
      missingSkills: ['Micro-interactions'],
      strengths: [
        'Deep fluency in Shadcn UI component design tokens and Tailwind ergonomics',
        'Proven user-research methodology reducing onboarding time by 35%'
      ],
      weaknesses: [
        'Portfolio focuses heavily on web desktop with fewer mobile native examples'
      ],
      suggestedQuestions: [
        'How do you bridge design handoff between Figma tokens and React Tailwind CSS components?',
        'Describe your approach to designing complex data tables with 50+ columns and sorting filters.'
      ],
      extractedExperienceYears: 6.0,
      highestEducation: 'B.F.A. in Interaction Design',
      processedAt: '2026-11-10 16:05:12',
      tokensUsed: 1190
    }
  },
  {
    id: 'app-505',
    candidateId: 'cand-5',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@mlresearch.in',
    candidateAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-101',
    jobTitle: 'Senior AI / Machine Learning Engineer',
    jobDepartment: 'Artificial Intelligence',
    appliedDate: '2026-11-16',
    status: 'APPLIED',
    resumeFileName: 'Priya_Sharma_ML_Engineer.pdf',
    resumeFileUrl: '/uploads/resumes/Priya_Sharma_ML_Engineer.pdf',
    resumeRawTextSnippet: 'Priya Sharma - Machine Learning Engineer with 3.5 years experience in Computer Vision, PyTorch, Scikit-learn, OpenCV, and Flask API deployment. Looking to transition into Generative AI and LLM agent engineering.',
    notesCount: 0,
    aiAnalysis: {
      matchScore: 71,
      technicalSkillsScore: 68,
      experienceScore: 72,
      educationScore: 90,
      domainScore: 65,
      verdict: 'MODERATE_FIT',
      summary: 'Competent machine learning engineer with a solid PyTorch foundation, but background is primarily centered in computer vision rather than generative LLM architectures and vector search.',
      matchedSkills: ['Python', 'PyTorch', 'Docker'],
      missingSkills: ['FastAPI', 'LLMs', 'Vector Databases', 'LangChain'],
      strengths: [
        'Strong mathematical foundation in deep learning backpropagation',
        'Published research in real-time object detection models'
      ],
      weaknesses: [
        'Missing core Generative AI toolchain: Vector databases, LangChain, and FastAPI',
        'Experience is 3.5 years against a senior target of 5+ years'
      ],
      suggestedQuestions: [
        'What personal projects or self-study have you undertaken in transformer attention mechanisms and LLM prompting?',
        'How would you transition your computer vision inference pipelines to handle streaming text generation?'
      ],
      extractedExperienceYears: 3.5,
      highestEducation: 'M.Tech in Artificial Intelligence',
      processedAt: '2026-11-16 13:10:04',
      tokensUsed: 1310
    }
  },
  {
    id: 'app-506',
    candidateId: 'cand-6',
    candidateName: 'Liam O’Connor',
    candidateEmail: 'liam.oc@devflow.org',
    candidateAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-102',
    jobTitle: 'Staff Full-Stack Software Architect',
    jobDepartment: 'Core Engineering',
    appliedDate: '2026-11-09',
    status: 'REJECTED',
    resumeFileName: 'Liam_OConnor_Resume.pdf',
    resumeFileUrl: '/uploads/resumes/Liam_OConnor_Resume.pdf',
    resumeRawTextSnippet: 'Liam O’Connor - Junior Frontend Developer with 1.5 years experience building WordPress themes, jQuery plugins, and basic React components.',
    notesCount: 1,
    aiAnalysis: {
      matchScore: 38,
      technicalSkillsScore: 35,
      experienceScore: 25,
      educationScore: 65,
      domainScore: 40,
      verdict: 'NO_FIT',
      summary: 'Significant experience mismatch. Candidate possesses 1.5 years in entry-level frontend scripting, whereas the role requires a Staff Software Architect with 8+ years of distributed system design and async backend mastery.',
      matchedSkills: ['React'],
      missingSkills: ['TypeScript', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'System Design', 'Redis'],
      strengths: [
        'Eager learner with enthusiastic portfolio demonstrations'
      ],
      weaknesses: [
        'Severe seniority gap (1.5 yrs vs 8+ yrs required)',
        'No Python or relational database architecture experience'
      ],
      suggestedQuestions: [],
      extractedExperienceYears: 1.5,
      highestEducation: 'Coding Bootcamp Diploma',
      processedAt: '2026-11-09 10:20:18',
      tokensUsed: 1040
    }
  },
  {
    id: 'app-507',
    candidateId: 'cand-7',
    candidateName: 'Zoe Martinez',
    candidateEmail: 'zoe.martinez@agenticlabs.io',
    candidateAvatar: 'https://images.unsplash.com/photo-1534751516642-a171ed292022?w=150&auto=format&fit=crop&q=80',
    jobId: 'job-101',
    jobTitle: 'Senior AI / Machine Learning Engineer',
    jobDepartment: 'Artificial Intelligence',
    appliedDate: '2026-11-17',
    status: 'SHORTLISTED',
    resumeFileName: 'Zoe_Martinez_AI_Specialist.pdf',
    resumeFileUrl: '/uploads/resumes/Zoe_Martinez_AI_Specialist.pdf',
    resumeRawTextSnippet: 'Zoe Martinez - 5.5 years in AI/ML. Built multi-agent simulation environments using LangGraph, FastAPI, and Milvus. Implemented retrieval-augmented generation (RAG) pipelines for legal document summarization.',
    notesCount: 3,
    aiAnalysis: {
      matchScore: 92,
      technicalSkillsScore: 94,
      experienceScore: 90,
      educationScore: 90,
      domainScore: 92,
      verdict: 'STRONG_FIT',
      summary: 'High-caliber candidate with directly transferable skills in agent orchestration, RAG architectures, and vector indexing with Milvus and FastAPI.',
      matchedSkills: ['Python', 'PyTorch', 'FastAPI', 'LLMs', 'Vector Databases', 'LangChain', 'Docker'],
      missingSkills: ['Kubernetes'],
      strengths: [
        'Designed production RAG pipelines handling 2M queries monthly',
        'Clear understanding of semantic chunking and reranking models'
      ],
      weaknesses: [
        'Kubernetes orchestration is minimal; relies on managed serverless platforms'
      ],
      suggestedQuestions: [
        'How do you evaluate retrieval precision vs recall in your RAG pipelines?',
        'Describe how you handle state and tool recovery in long-running agent loops.'
      ],
      extractedExperienceYears: 5.5,
      highestEducation: 'B.S. in Computer Science & Applied Math',
      processedAt: '2026-11-17 15:45:30',
      tokensUsed: 1390
    }
  }
]

export const initialInterviews: Interview[] = [
  {
    id: 'int-301',
    applicationId: 'app-501',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@devmail.io',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    jobTitle: 'Senior AI / Machine Learning Engineer',
    interviewerName: 'Dr. Michael Chen',
    interviewerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    round: 'Technical Round 1',
    date: '2026-11-21',
    time: '14:00 - 15:00',
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/xyz-recruiter-round',
    status: 'SCHEDULED'
  },
  {
    id: 'int-302',
    applicationId: 'app-502',
    candidateName: 'Marcus Vance',
    candidateEmail: 'marcus.vance@techvault.org',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    jobTitle: 'Staff Full-Stack Software Architect',
    interviewerName: 'Sarah Jenkins',
    interviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    round: 'Phone Screening',
    date: '2026-11-22',
    time: '11:00 - 11:45',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/abc-screening-round',
    status: 'SCHEDULED'
  },
  {
    id: 'int-303',
    applicationId: 'app-503',
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.rostova@cloudsphere.net',
    candidateAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    jobTitle: 'Senior Cloud DevOps & Platform Engineer',
    interviewerName: 'David Kross (VP Engineering)',
    interviewerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    round: 'Final Executive',
    date: '2026-11-18',
    time: '16:00 - 17:00',
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/def-exec-offer',
    status: 'COMPLETED',
    rating: 5,
    feedback: 'Phenomenal candidate. Unanimous thumbs up across the board. Prepared an offer package for $185k base + equity.',
    criteriaRatings: {
      technicalCompetence: 5,
      problemSolving: 5,
      communication: 4,
      culturalFit: 5
    }
  }
]

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'Candidate moved to INTERVIEW',
    actorName: 'Sarah Jenkins',
    target: 'Alex Rivera (Sr AI Engineer)',
    timestamp: '10 minutes ago',
    type: 'INFO'
  },
  {
    id: 'log-2',
    action: 'AI Screening Completed (Score: 94%)',
    actorName: 'Gemini 1.5 Flash Engine',
    target: 'Alex Rivera Resume Ingestion',
    timestamp: '25 minutes ago',
    type: 'SUCCESS'
  },
  {
    id: 'log-3',
    action: 'Offer Letter Dispatched',
    actorName: 'David Kross',
    target: 'Elena Rostova (DevOps Lead)',
    timestamp: '2 hours ago',
    type: 'SUCCESS'
  },
  {
    id: 'log-4',
    action: 'Job Opening Status changed to PAUSED',
    actorName: 'Sarah Jenkins',
    target: 'Technical Product Manager',
    timestamp: '1 day ago',
    type: 'WARNING'
  }
]

export const analyticsData = {
  monthlyHiringTrends: [
    { month: 'Jun', applications: 120, screened: 95, interviewed: 28, hired: 4 },
    { month: 'Jul', applications: 165, screened: 130, interviewed: 36, hired: 6 },
    { month: 'Aug', applications: 210, screened: 175, interviewed: 48, hired: 9 },
    { month: 'Sep', applications: 190, screened: 155, interviewed: 42, hired: 7 },
    { month: 'Oct', applications: 285, screened: 240, interviewed: 62, hired: 11 },
    { month: 'Nov', applications: 230, screened: 198, interviewed: 51, hired: 8 }
  ],
  departmentBreakdown: [
    { department: 'Artificial Intelligence', candidates: 94, openJobs: 2, fill: '#3b82f6' },
    { department: 'Core Engineering', candidates: 124, openJobs: 1, fill: '#8b5cf6' },
    { department: 'Infrastructure & SRE', candidates: 58, openJobs: 1, fill: '#10b981' },
    { department: 'Product & Design', candidates: 72, openJobs: 1, fill: '#f59e0b' },
    { department: 'Product Management', candidates: 45, openJobs: 1, fill: '#ec4899' }
  ],
  scoreDistribution: [
    { range: '0 - 40% (No Fit)', count: 42, color: '#ef4444' },
    { range: '41 - 60% (Low Fit)', count: 68, color: '#f97316' },
    { range: '61 - 75% (Moderate)', count: 112, color: '#eab308' },
    { range: '76 - 89% (Strong Fit)', count: 145, color: '#3b82f6' },
    { range: '90 - 100% (Exceptional)', count: 78, color: '#10b981' }
  ],
  sourceBreakdown: [
    { source: 'LinkedIn Talent Solutions', percentage: 46 },
    { source: 'Internal Employee Referral', percentage: 24 },
    { source: 'Company Careers Portal', percentage: 18 },
    { source: 'Direct Inbound / GitHub', percentage: 12 }
  ]
}

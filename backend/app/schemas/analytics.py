from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPIMetrics(BaseModel):
    total_applications: int
    total_jobs: int
    active_jobs: int
    shortlisted_candidates: int
    selected_candidates: int
    rejected_candidates: int
    interviews_scheduled: int
    interviews_total: int
    average_time_to_hire_days: float
    conversion_rate_percent: float

class ApplicationsOverTimeItem(BaseModel):
    period: str
    applications: int
    screened: int
    interviews: int

class StatusDistributionItem(BaseModel):
    status: str
    count: int
    color: str

class JobApplicationsItem(BaseModel):
    job_title: str
    department: str
    applications: int
    shortlisted: int
    openings: int

class RecruitmentFunnelItem(BaseModel):
    stage: str
    count: int
    conversion_rate: float
    color: str

class InterviewOutcomeItem(BaseModel):
    outcome: str
    count: int
    color: str

class AnalyticsDashboardResponse(BaseModel):
    kpis: KPIMetrics
    applications_over_time: List[ApplicationsOverTimeItem]
    status_distribution: List[StatusDistributionItem]
    job_wise_applications: List[JobApplicationsItem]
    recruitment_funnel: List[RecruitmentFunnelItem]
    interview_outcomes: List[InterviewOutcomeItem]

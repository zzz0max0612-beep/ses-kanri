export type Engineer = {
  id: string
  name: string
  affiliation: string | null
  age: number | null
  gender: string | null
  skills: string[]
  certifications: string[]
  processes: string[]
  experience_years: number | null
  available_date: string | null
  prefecture: string | null
  nearest_station: string | null
  work_style: 'remote' | 'onsite' | 'hybrid'
  rate_min: number | null
  rate_max: number | null
  desired_rate: number | null
  source_company: string | null
  sales_status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  project_name: string
  client_name: string | null
  provider_company: string | null
  required_skills: string[]
  start_date: string | null
  end_date: string | null
  prefecture: string | null
  nearest_station: string | null
  work_style: string | null
  budget_min: number | null
  budget_max: number | null
  headcount: number | null
  contract_type: string | null
  work_hours: string | null
  interview_count: string | null
  age_limit: string | null
  nationality: string | null
  freelancer: string | null
  supply_chain: string | null
  status: string
  description: string | null
  created_at: string
  updated_at: string
}

export type SkillSheet = {
  id: string
  engineer_id: string
  file_name: string
  storage_path: string
  uploaded_at: string
}

export type ProposalStatus = '提案中' | '面談調整中' | '面談済' | '成約' | '見送り'

export type Proposal = {
  id: string
  engineer_id: string
  project_id: string
  proposed_date: string
  affiliation: string | null
  client_name: string | null
  status: ProposalStatus
  created_at: string
  updated_at: string
  engineers?: { name: string; affiliation: string | null }
  projects?: { project_name: string; client_name: string | null }
}

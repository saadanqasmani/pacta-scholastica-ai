// Core database types for IARSMS

export interface University {
  id: string;
  name: string;
  country: string;
  region: string;
  type: 'public' | 'private';
  size: 'small' | 'medium' | 'large';
  internationalization_maturity: 'low' | 'medium' | 'high';
  ranking?: number;
  educational_union?: string;
  journals?: string[];
  research_strengths?: string[];
  accreditations?: string[];
  founded_year?: number;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  university_id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  name: string;
  created_at: string;
}

export interface MOU {
  id: string;
  initiator_university_id: string;
  partner_university_id: string;
  status: 'draft' | 'pending' | 'revised' | 'counter_proposed' | 'accepted' | 'rejected';
  cooperation_scope: string[];
  clauses: MOUClause[];
  created_at: string;
  updated_at: string;
}

export interface MOUClause {
  id: string;
  title: string;
  content: string;
  proposed_by: string;
}

export interface MOUHistory {
  id: string;
  mou_id: string;
  action: string;
  actor_university_id: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface MobilityRecord {
  id: string;
  university_id: string;
  partner_university_id: string;
  department_id: string;
  program_type: 'erasmus' | 'bilateral' | 'exchange' | 'joint_degree';
  direction: 'incoming' | 'outgoing';
  student_count: number;
  academic_year: string;
  completion_status: 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface PartnerROI {
  id: string;
  university_id: string;
  partner_university_id: string;
  partnership_year: number;
  student_exchange_count: number;
  research_collaborations: number;
  joint_publications: number;
  grant_funding_usd: number;
  satisfaction_score: number;
  created_at: string;
}

export interface PartnerRequest {
  id: string;
  from_university_id: string;
  to_university_id: string;
  request_type: string;
  subject: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  responded_at?: string;
}

export interface PartnerProject {
  id: string;
  university_id: string;
  partner_university_id: string;
  project_name: string;
  project_type: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  start_date?: string;
  end_date?: string;
  budget_usd?: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerMessage {
  id: string;
  from_university_id: string;
  to_university_id: string;
  subject: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export interface AIEvaluation {
  id: string;
  university_id: string;
  evaluation_type: string;
  evaluation_data: InstitutionalHealthIndex | StrengthsWeaknesses | PartnerRecommendation[];
  created_at: string;
  expires_at: string;
}

// AI-Generated Data Structures
export interface InstitutionalHealthIndex {
  overall_score: number;
  recruitment_efficiency: number;
  offer_to_enrollment_quality: number;
  retention_stability: number;
  internationalization_impact: number;
  mobility_participation: number;
  partner_performance: number;
  summary: string;
  generated_at: string;
}

export interface StrengthsWeaknesses {
  strengths: DepartmentAnalysis[];
  weaknesses: DepartmentAnalysis[];
  recommendations: string[];
  generated_at: string;
}

export interface DepartmentAnalysis {
  department_name: string;
  faculty_name: string;
  score: number;
  analysis: string;
  action_required?: 'structural_reform' | 'strategic_partnership' | 'capacity_adjustment' | 'scale' | 'none';
}

export interface PartnerRecommendation {
  university_id: string;
  university_name: string;
  country: string;
  match_score: number;
  reasoning: {
    departmental_complementarity: string;
    geographic_diversification: string;
    mobility_balance: string;
    strategic_alignment: string;
  };
}

export interface MarketIntelligence {
  markets: MarketAnalysis[];
  recommendations: MarketRecommendation[];
  generated_at: string;
}

export interface MarketAnalysis {
  country: string;
  region: string;
  conversion_efficiency: number;
  over_offering_indicator: number;
  application_waste_ratio: number;
  agent_driven_ratio: number;
}

export interface MarketRecommendation {
  country: string;
  action: 'scale' | 'maintain' | 'pause' | 'exit';
  reason: string;
}

export interface DepartmentROI {
  department_id: string;
  department_name: string;
  faculty_name: string;
  international_recruitment_roi: number;
  cost_outcome_ratio: number;
  market_program_fit: number;
  brand_contribution: number;
  category: 'scale' | 'correct' | 'pause' | 'exit';
  analysis: string;
}

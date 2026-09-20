export type DomainTheme =
  | 'agriculture'
  | 'water_resources'
  | 'healthcare'
  | 'education'
  | 'environment_forest'
  | 'renewable_energy'
  | 'sanitation'
  | 'rural_livelihoods'
  | 'urban_infrastructure'
  | 'accessibility'
  | 'public_administration';

export type District =
  | 'Ranchi'
  | 'Dhanbad'
  | 'East Singhbhum'
  | 'Bokaro'
  | 'Hazaribagh'
  | 'Palamu'
  | 'Deoghar'
  | 'Dumka'
  | 'West Singhbhum'
  | 'Giridih'
  | 'Ramgarh'
  | 'Khunti'
  | 'Gumla'
  | 'Simdega'
  | 'Latehar'
  | 'Garhwa'
  | 'Chatra'
  | 'Koderma'
  | 'Jamtara'
  | 'Godda'
  | 'Sahibganj'
  | 'Pakur'
  | 'Saraikela Kharsawan'
  | 'Lohardaga';

export type ProblemStatus =
  | 'submitted'
  | 'ai_validated'
  | 'assigned_to_hei'
  | 'team_formed'
  | 'proposal_submitted'
  | 'industry_partnered'
  | 'prototyping'
  | 'field_testing'
  | 'deployed'
  | 'closed';

export type SubmitterType =
  | 'citizen'
  | 'community_group'
  | 'gram_panchayat'
  | 'urban_local_body'
  | 'govt_agency';

export interface LocationCoords {
  lat: number;
  lng: number;
  address?: string;
}

export interface MatchedHEI {
  universityId: string;
  universityName: string;
  department: string;
  matchScore: number; // 0 - 100
  reason: string;
}

export interface DuplicateMatch {
  problemId: string;
  title: string;
  similarity: number; // 0 - 100
  district: string;
}

export interface AIAnalysisResult {
  category: DomainTheme;
  subCategory: string;
  priorityScore: number; // 1 - 100
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  thematicTags: string[];
  matchedHeis: MatchedHEI[];
  duplicateMatches: DuplicateMatch[];
  recommendedTech: string[];
  nepRelevance: string;
  estimatedBudgetBand: string;
  socialImpactPotential: string;
  embedding?: number[];
}

export interface ProblemStatement {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  domain: DomainTheme;
  district: District;
  blockOrPanchayat: string;
  locationCoords: LocationCoords;
  submittedBy: {
    name: string;
    type: SubmitterType;
    contact: string;
    email: string;
    organization?: string;
  };
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedPopulation: number;
  mediaUrls: string[];
  videoUrl?: string;
  aiAnalysis: AIAnalysisResult;
  assignedHeiId?: string;
  assignedHeiName?: string;
  assignedDepartment?: string;
  assignedTeamId?: string;
  partnerOrgId?: string;
  partnerOrgName?: string;
  fundingAmount?: number;
  createdAt: string;
  updatedAt: string;
  status: ProblemStatus;
  socialImpactMetric: string;
  viewsCount: number;
  upvotesCount: number;
}

export interface FacultyMentor {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  specialization: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  district: District;
  type: 'Central University' | 'Institute of National Importance' | 'State University' | 'Deemed / Autonomous';
  specializationDomains: DomainTheme[];
  departments: string[];
  incubationCenter: string;
  facultyMentors: FacultyMentor[];
  activeProjectsCount: number;
  studentResearchersCount: number;
  rating: number;
  logoUrl?: string;
  establishedYear: number;
  website: string;
  locationCoords: LocationCoords;
  domains: string[];
}

export interface Organization {
  id: string;
  name: string;
  type: 'Industry' | 'Startup' | 'MSME' | 'CSR Foundation' | 'Research Lab';
  focusDomains: DomainTheme[];
  headquarters: string;
  csrBudgetCommitted: number; // In INR Lakhs
  availableMentors: number;
  activeCollaborations: number;
  description: string;
  pilotTestSites: string[];
  contactPerson: string;
  locationCoords: LocationCoords;
}

export type IndustryPartner = Organization;
export type Role = 'CITIZEN' | 'STUDENT' | 'FACULTY' | 'INDUSTRY_REP' | 'UNIVERSITY_ADMIN' | 'GOVERNMENT_ADMIN' | 'GOVERNMENT_OFFICIAL' | 'SUPER_ADMIN';
export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ProjectMilestone {
  id: string;
  title: string;
  stage: 'Ideation & Design' | 'Lab Prototype' | 'Field Testing' | 'Community Pilot' | 'Scale & Deployment';
  durationWeeks: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  deliverable: string;
  verificationEvidence?: string;
  completedDate?: string;
}

export interface SolutionProposal {
  id: string;
  problemId: string;
  problemTitle: string;
  heiId: string;
  heiName: string;
  projectTitle: string;
  abstract: string;
  technologyMethodology: string;
  facultyMentor: {
    name: string;
    department: string;
    email: string;
  };
  studentTeam: {
    leadName: string;
    leadEmail: string;
    membersCount: number;
    departments: string[];
  };
  nepExperientialCredits: number;
  budgetBreakdown: {
    hardwareEquip: number;
    fieldTesting: number;
    prototyping: number;
    travelAndLogistics: number;
    contingency: number;
    totalAmount: number; // INR
  };
  milestones: ProjectMilestone[];
  ipPotential: 'Patentable Technology' | 'Open-Source Public Good' | 'Process Copyright' | 'Grassroots Spinoff';
  partnerOrgId?: string;
  partnerOrgName?: string;
  status: 'draft' | 'submitted' | 'faculty_approved' | 'industry_partnered' | 'pilot_approved';
  createdAt: string;
}

export type SubmitterRole = 'Citizen' | 'Student Researcher' | 'Faculty Mentor' | 'Industry Guide' | 'Government Admin';
export type InnovationStage = 'Ideation' | 'Lab Prototype' | 'Field Testing' | 'Community Pilot' | 'Deployment & Scale';

export interface SystemNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: SubmitterRole | 'All';
  actionUrl?: string;
}

export interface DiscussionMessage {
  id: string;
  problemId: string;
  senderName: string;
  senderRole: SubmitterRole;
  message: string;
  timestamp: string;
  avatarColor?: string;
}

export interface AnalyticsSummary {
  totalChallengesReceived: number;
  totalValidated: number;
  totalAssignedToHEIs: number;
  activePrototypes: number;
  fieldPilotsDeployed: number;
  patentsFiledCount: number;
  startupsIncubatedCount: number;
  totalFundingPledgedLakhs: number;
  studentsParticipating: number;
  facultyMentorsEngaged: number;
  districtStats: { district: District; challengesCount: number; activeProjects: number }[];
  domainStats: { domain: DomainTheme; count: number; solvedCount: number }[];
  heiParticipation: { heiName: string; assignedCount: number; prototypesCount: number }[];
  measurableOutcomes: {
    livesImpacted: number;
    panchayatsCovered: number;
    waterSavedLitersDaily: string;
    cropYieldIncreasePct: number;
    ruralClinicsSupported: number;
  };
}

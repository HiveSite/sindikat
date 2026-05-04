export type UserRole = "guest" | "candidate" | "company" | "admin";

export type JobStatus = "draft" | "pending_review" | "active" | "paused" | "rejected" | "expired";

export type ApplicationStage = "applied" | "review" | "interview" | "shortlist" | "offer" | "hired" | "rejected";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  cv_data?: CvData | null;
  cv_updated_at?: string | null;
};

export type CvData = {
  fullName?: string;
  title?: string;
  city?: string;
  phone?: string;
  email?: string;
  summary?: string;
  skills?: string;
  languages?: string;
  experience?: string;
  education?: string;
  certificates?: string;
  availability?: string;
};

export type Company = {
  id: number;
  owner_id?: string;
  name: string;
  slug: string;
  city: string | null;
  industry: string | null;
  description: string | null;
  approved: boolean;
};

export type LookupItem = {
  id: number;
  name: string;
  slug: string;
};

export type Job = {
  id: number;
  title: string;
  slug: string;
  description: string;
  contract_type: string | null;
  salary_text: string | null;
  deadline: string | null;
  status: JobStatus;
  featured: boolean;
  company_id: number;
  companies?: Pick<Company, "id" | "name" | "slug"> | null;
  categories?: { id: number; name: string } | null;
  cities?: { id: number; name: string } | null;
};

export type JobApplication = {
  id: number;
  job_id: number;
  candidate_id: string;
  stage: ApplicationStage;
  cover_letter: string | null;
  reference_code: string | null;
  created_at: string;
  jobs?: Pick<Job, "id" | "title" | "company_id"> & { companies?: Pick<Company, "name"> | null };
  profiles?: Profile | null;
};

export type Plan = {
  id: number;
  name: string;
  price_eur: number;
  active_jobs: number;
  unlock_credits: number;
  features: string[];
};

export type Order = {
  id: number;
  company_id: number;
  plan_id: number | null;
  status: "pending" | "paid" | "rejected" | "cancelled";
  amount_eur: number;
  payment_reference: string;
  activation_code: string | null;
  created_at: string;
  plans?: Pick<Plan, "name"> | null;
  companies?: Pick<Company, "name"> | null;
};

export type PaymentProof = {
  id: number;
  order_id: number;
  company_id: number;
  uploaded_by: string;
  amount_eur: number | null;
  file_path: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  orders?: Order | null;
  companies?: Pick<Company, "name"> | null;
};

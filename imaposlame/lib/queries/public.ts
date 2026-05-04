import { createPublicSupabase } from "@/lib/supabase/server";
import type { Company, Job, Plan } from "@/types/domain";

const jobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities(id,name)";
const cityJobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities!inner(id,name)";
const categoryJobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories!inner(id,name),cities(id,name)";

export async function getPublicJobs(limit?: number) {
  const db = createPublicSupabase();
  let query = db.from("jobs").select(jobSelect).eq("status", "active").order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCity(cityName: string) {
  const db = createPublicSupabase();
  const { data } = await db
    .from("jobs")
    .select(cityJobSelect)
    .eq("status", "active")
    .eq("cities.name", cityName)
    .order("created_at", { ascending: false });
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCategory(categoryName: string) {
  const db = createPublicSupabase();
  const { data } = await db
    .from("jobs")
    .select(categoryJobSelect)
    .eq("status", "active")
    .eq("categories.name", categoryName)
    .order("created_at", { ascending: false });
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCompany(companyId: number) {
  const db = createPublicSupabase();
  const { data } = await db
    .from("jobs")
    .select(jobSelect)
    .eq("status", "active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data || []) as unknown as Job[];
}

export async function getJobById(id: number) {
  const db = createPublicSupabase();
  const { data } = await db.from("jobs").select(jobSelect).eq("id", id).eq("status", "active").maybeSingle();
  return data as unknown as Job | null;
}

export async function getCompanies(limit?: number) {
  const db = createPublicSupabase();
  let query = db.from("companies").select("*").eq("approved", true).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data || []) as Company[];
}

export async function getCompanyById(id: number) {
  const db = createPublicSupabase();
  const { data } = await db.from("companies").select("*").eq("id", id).eq("approved", true).maybeSingle();
  return data as Company | null;
}

export async function getLookups() {
  const db = createPublicSupabase();
  const [cities, categories] = await Promise.all([
    db.from("cities").select("id,name,slug").order("name"),
    db.from("categories").select("id,name,slug").order("name")
  ]);
  return {
    cities: cities.data || [],
    categories: categories.data || []
  };
}

export async function getPlans() {
  const db = createPublicSupabase();
  const { data } = await db.from("plans").select("*").order("price_eur");
  return (data || []) as Plan[];
}

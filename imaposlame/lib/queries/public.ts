import { createPublicSupabase } from "@/lib/supabase/server";
import type { Company, Job, Plan } from "@/types/domain";

const jobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities(id,name)";
const cityJobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities!inner(id,name)";
const categoryJobSelect = "id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories!inner(id,name),cities(id,name)";

export async function getPublicJobs(limit?: number): Promise<Job[]> {
  const db = createPublicSupabase();
  let query = db.from("jobs").select(jobSelect).eq("status", "active").order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) console.error("[getPublicJobs]", error.message);
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCity(cityName: string): Promise<Job[]> {
  const db = createPublicSupabase();
  const { data, error } = await db
    .from("jobs")
    .select(cityJobSelect)
    .eq("status", "active")
    .eq("cities.name", cityName)
    .order("created_at", { ascending: false });
  if (error) console.error("[getPublicJobsByCity]", error.message);
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCategory(categoryName: string): Promise<Job[]> {
  const db = createPublicSupabase();
  const { data, error } = await db
    .from("jobs")
    .select(categoryJobSelect)
    .eq("status", "active")
    .eq("categories.name", categoryName)
    .order("created_at", { ascending: false });
  if (error) console.error("[getPublicJobsByCategory]", error.message);
  return (data || []) as unknown as Job[];
}

export async function getPublicJobsByCompany(companyId: number): Promise<Job[]> {
  const db = createPublicSupabase();
  const { data, error } = await db
    .from("jobs")
    .select(jobSelect)
    .eq("status", "active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) console.error("[getPublicJobsByCompany]", error.message);
  return (data || []) as unknown as Job[];
}

export async function getJobById(id: number): Promise<Job | null> {
  const db = createPublicSupabase();
  const { data, error } = await db.from("jobs").select(jobSelect).eq("id", id).eq("status", "active").maybeSingle();
  if (error) console.error("[getJobById]", error.message);
  return data as unknown as Job | null;
}

export async function getCompanies(limit?: number): Promise<Company[]> {
  const db = createPublicSupabase();
  let query = db.from("companies").select("*").eq("approved", true).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) console.error("[getCompanies]", error.message);
  return (data || []) as Company[];
}

export async function getCompanyById(id: number): Promise<Company | null> {
  const db = createPublicSupabase();
  const { data, error } = await db.from("companies").select("*").eq("id", id).eq("approved", true).maybeSingle();
  if (error) console.error("[getCompanyById]", error.message);
  return data as Company | null;
}

export async function getLookups() {
  const db = createPublicSupabase();
  const [cities, categories] = await Promise.all([
    db.from("cities").select("id,name,slug").order("name"),
    db.from("categories").select("id,name,slug").order("name")
  ]);
  if (cities.error) console.error("[getLookups:cities]", cities.error.message);
  if (categories.error) console.error("[getLookups:categories]", categories.error.message);
  return {
    cities: cities.data || [],
    categories: categories.data || []
  };
}

export async function getPlans(): Promise<Plan[]> {
  const db = createPublicSupabase();
  const { data, error } = await db.from("plans").select("*").order("price_eur");
  if (error) console.error("[getPlans]", error.message);
  return (data || []) as Plan[];
}

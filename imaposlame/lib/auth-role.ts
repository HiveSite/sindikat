import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/domain";

const validRoles: UserRole[] = ["guest", "candidate", "company", "admin"];

export function normalizeRole(value: unknown): UserRole {
  return typeof value === "string" && validRoles.includes(value as UserRole) ? (value as UserRole) : "guest";
}

export async function loadCurrentRole(supabase: SupabaseClient): Promise<UserRole> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return "guest";

  const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const profileRole = normalizeRole(profile.data?.role);

  if (profileRole !== "guest") return profileRole;

  return normalizeRole(user.user_metadata?.role);
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { roleHomes } from "@/lib/labels";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import type { UserRole } from "@/types/domain";

const protectedRoots: Array<{ prefix: string; role: Exclude<UserRole, "guest"> }> = [
  { prefix: "/profil", role: "candidate" },
  { prefix: "/firma", role: "company" },
  { prefix: "/admin", role: "admin" }
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const match = protectedRoots.find((item) => request.nextUrl.pathname.startsWith(item.prefix));
  if (!match) return response;

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = (profile?.role || "guest") as UserRole;
  if (role === "admin" || role === match.role) return response;

  const url = request.nextUrl.clone();
  url.pathname = role === "guest" ? "/" : roleHomes[role as Exclude<UserRole, "guest">] || "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/profil/:path*", "/firma/:path*", "/admin/:path*"]
};

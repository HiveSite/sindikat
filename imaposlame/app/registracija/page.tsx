import Link from "next/link";
import { RegisterForm } from "@/components/auth-form";
import { PageLabel } from "@/components/ui";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const selectedRole = params.role === "company" ? "company" : "candidate";

  return (
    <section className="auth-shell auth-two">
      <div>
        <PageLabel>Registracija</PageLabel>
        <h1>Novi nalog</h1>
        <p>Izaberi ulogu prije popunjavanja forme. Kandidat traži posao, firma objavljuje oglase i pregleda prijave.</p>
        <div className="auth-role-grid compact">
          <Link className="auth-role-card" href="/registracija?role=candidate"><span>Kandidat</span><h2>Tražim posao</h2><p>Za prijave, biografiju i praćenje statusa.</p></Link>
          <Link className="auth-role-card" href="/registracija?role=company"><span>Firma</span><h2>Zapošljavam</h2><p>Za objavu oglasa, profil firme i selekciju.</p></Link>
        </div>
      </div>
      <RegisterForm selectedRole={selectedRole} />
    </section>
  );
}

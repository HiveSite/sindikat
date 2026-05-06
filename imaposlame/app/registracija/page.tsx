import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-form";
import { PageLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Registracija",
  description: "Kreiraj nalog na imaposla.me kao kandidat ili firma."
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const role = params.role === "company" ? "company" : "candidate";
  return (
    <section className="auth-shell auth-two">
      <div>
        <PageLabel>Registracija</PageLabel>
        <h1>Napravi nalog.</h1>
        <p>{role === "company" ? "Objavljuješ oglase i vodiš selekciju kandidata." : "Tražiš posao, praviš biografiju i šalješ prijave."}</p>
        <div className="auth-actions">
          <Link className={`btn ${role === "candidate" ? "blue" : "ghost"}`} href="/registracija?role=candidate">Tražim posao</Link>
          <Link className={`btn ${role === "company" ? "blue" : "ghost"}`} href="/registracija?role=company">Zapošljavam</Link>
        </div>
        <div className="auth-actions"><Link className="btn ghost" href="/login">Već imam nalog</Link></div>
      </div>
      <RegisterForm selectedRole={role} />
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-form";
import { PageLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavi se na imaposla.me kao kandidat, firma ili admin."
};

function loginErrorMessage(error?: string) {
  if (error === "missing") return "Upiši e-postu i lozinku.";
  if (error === "credentials") return "E-posta ili lozinka nijesu tačni.";
  return null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return (
    <section className="auth-shell auth-two">
      <div>
        <PageLabel>Prijava</PageLabel>
        <h1>Uđi na svoj nalog.</h1>
        <p>Unesi e-postu i lozinku. Sistem sam otvara pregled koji pripada tvojoj ulozi: kandidat, firma ili upravljanje.</p>
        <div className="auth-actions"><Link className="btn lime" href="/registracija">Kreiraj nalog</Link></div>
      </div>
      <LoginForm nextPath={params.next || null} errorMessage={loginErrorMessage(params.error)} />
    </section>
  );
}

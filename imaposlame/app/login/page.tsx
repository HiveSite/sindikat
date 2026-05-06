import Link from "next/link";
import { LoginForm } from "@/components/auth-form";
import { PageLabel } from "@/components/ui";

function loginErrorMessage(error?: string) {
  if (error === "missing") return "Upisi e-postu i lozinku.";
  if (error === "credentials") return "E-posta ili lozinka nijesu tacni.";
  return null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;

  return (
    <section className="auth-shell auth-two">
      <div>
        <PageLabel>Prijava</PageLabel>
        <h1>Udji na svoj nalog.</h1>
        <p>Unesi e-postu i lozinku. Sistem sam otvara pregled koji pripada tvojoj ulozi: kandidat, firma ili upravljanje.</p>
        <div className="auth-actions"><Link className="btn lime" href="/registracija">Kreiraj nalog</Link></div>
      </div>
      <LoginForm nextPath={params.next || null} errorMessage={loginErrorMessage(params.error)} />
    </section>
  );
}

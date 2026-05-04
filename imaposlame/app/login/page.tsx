import Link from "next/link";
import { LoginForm } from "@/components/auth-form";
import { PageLabel } from "@/components/ui";

export default function LoginPage() {
  return (
    <section className="auth-shell auth-two">
      <div>
        <PageLabel>Prijava</PageLabel>
        <h1>Uđi na svoj nalog.</h1>
        <p>Unesi e-poštu i lozinku. Sistem sam otvara pregled koji pripada tvojoj ulozi: kandidat, firma ili upravljanje.</p>
        <div className="auth-actions"><Link className="btn lime" href="/registracija">Kreiraj nalog</Link></div>
      </div>
      <LoginForm />
    </section>
  );
}

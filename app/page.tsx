import { CompanyCard } from "@/components/company-card";
import { JobCard } from "@/components/job-card";
import { Button, EmptyState, PageLabel } from "@/components/ui";
import { getCompanies, getPublicJobs } from "@/lib/queries/public";

export default async function HomePage() {
  const [jobs, companies] = await Promise.all([getPublicJobs(3), getCompanies(4)]);

  return (
    <section className="live-home">
      <div className="live-hero">
        <PageLabel>imaposla.me</PageLabel>
        <h1>Posao i zapošljavanje u Crnoj Gori, jasno od prvog klika.</h1>
        <p>Kandidat pretražuje oglase, pravi biografiju i šalje prijavu. Firma objavljuje oglas, prati prijave i vodi selekciju. Javni prikaz prolazi provjeru.</p>
        <form className="live-search" action="/oglasi">
          <input className="field" name="q" placeholder="Naziv posla, firma ili vještina" />
          <button className="btn blue">Traži posao</button>
        </form>
        <div className="live-actions">
          <Button href="/oglasi" tone="lime">Tražim posao</Button>
          <Button href="/registracija?role=company" tone="blue">Zapošljavam</Button>
          <Button href="/login" tone="ghost">Prijava</Button>
        </div>
      </div>

      <div className="live-paths">
        <a className="live-path" href="/oglasi">
          <span>Kandidat</span>
          <h2>Pronađi posao</h2>
          <p>Otvori oglas, pročitaj uslove, dopuni biografiju i pošalji prijavu bez upload fajlova.</p>
          <strong>Otvori oglase</strong>
        </a>
        <a className="live-path" href="/registracija?role=company">
          <span>Firma</span>
          <h2>Objavi oglas</h2>
          <p>Napravi profil firme, pošalji oglas na pregled i vodi kandidate kroz selekciju.</p>
          <strong>Kreni kao firma</strong>
        </a>
      </div>

      <div className="live-section-head">
        <div>
          <span className="kicker">Aktivno</span>
          <h2>Najnoviji oglasi</h2>
          <p>Prikazuju se samo oglasi koji su odobreni i aktivni.</p>
        </div>
        <Button href="/oglasi" size="sm">Svi oglasi</Button>
      </div>
      <div className="job-list">
        {jobs.length ? jobs.map((job) => <JobCard job={job} key={job.id} />) : (
          <EmptyState title="Još nema aktivnih oglasa" text="Kada firma pošalje oglas i bude odobren, pojaviće se ovdje." action={<Button href="/oglasi" tone="blue">Pretraga oglasa</Button>} />
        )}
      </div>

      <div className="live-section-head">
        <div>
          <span className="kicker">Firme</span>
          <h2>Odobreni poslodavci</h2>
          <p>Spisak firmi koje imaju javni profil na platformi.</p>
        </div>
        <Button href="/firme" size="sm">Sve firme</Button>
      </div>
      <div className="grid two">
        {companies.length ? companies.map((company) => <CompanyCard company={company} key={company.id} />) : <EmptyState title="Nema firmi" text="Firme se prikazuju nakon odobrenja." />}
      </div>
    </section>
  );
}

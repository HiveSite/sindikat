import { CompanyCard } from "@/components/company-card";
import { JobCard } from "@/components/job-card";
import { Button, EmptyState, PageLabel } from "@/components/ui";
import { getCompanies, getPublicJobs } from "@/lib/queries/public";
import Link from "next/link";

export default async function HomePage() {
  const [jobs, companies] = await Promise.all([getPublicJobs(3), getCompanies(4)]);

  return (
    <section className="live-home">
      <div className="live-hero">
        <PageLabel>imaposla.me</PageLabel>
        <h1>Posao i zaposljavanje u Crnoj Gori, jasno od prvog klika.</h1>
        <p>Kandidat pretrazuje oglase, pravi biografiju i salje prijavu. Firma objavljuje oglas, prati prijave i vodi selekciju. Javni prikaz prolazi provjeru.</p>
        <form className="live-search" action="/oglasi">
          <input className="field" name="q" placeholder="Naziv posla, firma ili vjestina" />
          <button className="btn blue">Trazi posao</button>
        </form>
        <div className="live-actions">
          <Button href="/oglasi" tone="lime">Trazim posao</Button>
          <Button href="/registracija?role=company" tone="blue">Zaposljavam</Button>
          <Button href="/login" tone="ghost">Prijava</Button>
        </div>
      </div>

      <div className="live-paths">
        <Link className="live-path" href="/oglasi">
          <span>Kandidat</span>
          <h2>Pronadji posao</h2>
          <p>Otvori oglas, procitaj uslove, dopuni biografiju i posalji prijavu bez upload fajlova.</p>
          <strong>Otvori oglase</strong>
        </Link>
        <Link className="live-path" href="/registracija?role=company">
          <span>Firma</span>
          <h2>Objavi oglas</h2>
          <p>Napravi profil firme, posalji oglas na pregled i vodi kandidate kroz selekciju.</p>
          <strong>Kreni kao firma</strong>
        </Link>
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
          <EmptyState title="Jos nema aktivnih oglasa" text="Kada firma posalje oglas i bude odobren, pojavice se ovdje." action={<Button href="/oglasi" tone="blue">Pretraga oglasa</Button>} />
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

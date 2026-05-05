import { Button, Card, PageLabel } from "@/components/ui";

export default function ForCompaniesPage() {
  return (
    <>
      <section className="live-info-page">
        <PageLabel>Za firme</PageLabel>
        <h1>Objavite oglas, pratite prijave i vodite izbor kandidata.</h1>
        <p className="lead">Firma dobija profil, oglase, selekciju prijava, ručnu uplatu i jasan pregled statusa. Javni prikaz prolazi provjeru.</p>
        <div className="actions">
          <Button href="/registracija?role=company" tone="blue">Kreiraj nalog firme</Button>
          <Button href="/login">Imam nalog</Button>
        </div>
      </section>
      <div className="grid three with-top-space">
        <Card title="1. Profil firme" text="Upiši naziv, grad, djelatnost i opis. Profil se prikazuje javno poslije odobrenja." />
        <Card title="2. Oglas" text="Unesi poziciju, grad, kategoriju, platu i opis. Oglas ide na pregled." />
        <Card title="3. Selekcija" text="Prijave vodiš kroz faze: nova prijava, pregled, razgovor, uži izbor, ponuda, zaposlen ili odbijeno." />
      </div>
    </>
  );
}

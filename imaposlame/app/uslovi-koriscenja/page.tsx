import { Card, PageLabel } from "@/components/ui";

export default function TermsPage() {
  return (
    <section className="live-info-page">
      <PageLabel>Pravno</PageLabel>
      <h1>Uslovi korišćenja</h1>
      <p className="lead">Platforma služi za objavu poslova, prijave kandidata i pregledniju selekciju u Crnoj Gori.</p>
      <div className="grid two">
        <Card title="Tačnost podataka" text="Korisnik je odgovoran za tačnost podataka koje unosi u profil, oglas, biografiju ili prijavu." />
        <Card title="Provjera javnog sadržaja" text="Firme, oglasi, baneri i uplate mogu čekati provjeru prije javnog prikaza ili aktivacije." />
        <Card title="Zabranjen sadržaj" text="Nije dozvoljen lažan, uvredljiv, diskriminatoran ili nezakonit sadržaj." />
        <Card title="Ručne uplate" text="Plan se aktivira nakon provjere uplate. Dokaz uplate se koristi samo za potvrdu narudžbe." />
      </div>
    </section>
  );
}

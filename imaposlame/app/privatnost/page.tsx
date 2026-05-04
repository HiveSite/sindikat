import { Card, PageLabel } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <section className="live-info-page">
      <PageLabel>Pravno</PageLabel>
      <h1>Politika privatnosti</h1>
      <p className="lead">Podaci se koriste da kandidat može poslati prijavu, a firma pregledati prijave koje pripadaju njenim oglasima.</p>
      <div className="grid two">
        <Card title="Podaci kandidata" text="Čuvaju se nalog, kontakt podaci, grad i radna biografija unesena kroz CV builder. Fajlovi biografija se ne čuvaju." />
        <Card title="Podaci firme" text="Čuvaju se profil firme, oglasi, prijave na oglase, narudžbe planova, dokazi uplata i statusi provjere." />
        <Card title="Pristup podacima" text="Kandidat vidi svoje prijave. Firma vidi prijave na svoje oglase. Upravljanje vidi podatke potrebne za provjeru i podršku." />
        <Card title="Brisanje i ispravka" text="Korisnik može tražiti ispravku ili uklanjanje podataka koji nijesu potrebni za rad platforme." />
      </div>
    </section>
  );
}

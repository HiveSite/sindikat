import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="mark">ip</span>
            <span>imaposla.me</span>
          </Link>
          <p>Platforma za oglase, prijave i jednostavnije zapošljavanje u Crnoj Gori.</p>
        </div>
        <div>
          <h4>Kandidati</h4>
          <Link href="/oglasi">Pretraga oglasa</Link>
          <Link href="/profil/biografija">Biografija</Link>
          <Link href="/profil/prijave">Moje prijave</Link>
        </div>
        <div>
          <h4>Firme</h4>
          <Link href="/za-firme">Za firme</Link>
          <Link href="/firma/novi-oglas">Novi oglas</Link>
          <Link href="/firma/selekcija">Selekcija prijava</Link>
        </div>
        <div>
          <h4>Pravno</h4>
          <Link href="/privatnost">Privatnost</Link>
          <Link href="/uslovi-koriscenja">Uslovi korišćenja</Link>
          <Link href="/mapa-sajta">Mapa sajta</Link>
        </div>
      </div>
    </footer>
  );
}

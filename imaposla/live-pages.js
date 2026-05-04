(() => {
  const root = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const page = (title, lead, body) => `<section class="live-info-page" data-live-info-page><span class="page-label">imaposla.me</span><h1>${title}</h1><p class="lead">${lead}</p><div class="grid two">${body}</div></section>`;
  const card = (title, text) => `<article class="card"><h3>${title}</h3><p>${text}</p></article>`;

  function renderPublicInfo() {
    const app = root();
    if (!app) return;
    const path = route();
    if (!['/za-firme', '/politika-privatnosti', '/uslovi-koristenja', '/sitemap'].includes(path)) return;
    if (app.querySelector('[data-live-info-page]')) return;
    if (path === '/za-firme') {
      app.innerHTML = page('Rješenje za firme', 'Objavi oglas, primi prijave i vodi izbor kandidata bez tabela, poruka rasutih po telefonu i nejasnog statusa.',
        card('Profil firme', 'Firma popunjava naziv, grad, djelatnost i opis. Profil se prikazuje javno tek nakon provjere.') +
        card('Oglas za posao', 'Oglas ide na pregled prije javnog prikaza. Kandidati vide samo aktivne i odobrene oglase.') +
        card('Selekcija prijava', 'Svaka prijava ima fazu: nova prijava, pregled, razgovor, uži izbor, ponuda, zaposlen ili odbijeno.') +
        card('Ručna uplata', 'Nema kartica i komplikovanih integracija. Firma naruči plan, uplati i pošalje dokaz na provjeru.'));
    }
    if (path === '/politika-privatnosti') {
      app.innerHTML = page('Politika privatnosti', 'Podaci se koriste da kandidat može poslati prijavu, a firma pregledati prijave koje pripadaju njenim oglasima.',
        card('Podaci kandidata', 'Čuvaju se nalog, kontakt podaci, grad i radna biografija unesena kroz CV builder. Fajlovi biografija se ne čuvaju.') +
        card('Podaci firme', 'Čuvaju se profil firme, oglasi, prijave na oglase, narudžbe planova, dokazi uplata i statusi provjere.') +
        card('Pristup podacima', 'Kandidat vidi svoje prijave. Firma vidi prijave na svoje oglase. Upravljanje vidi podatke potrebne za provjeru i podršku.') +
        card('Brisanje i ispravka', 'Korisnik može tražiti ispravku ili uklanjanje podataka koji nijesu potrebni za rad platforme.'));
    }
    if (path === '/uslovi-koristenja') {
      app.innerHTML = page('Uslovi korišćenja', 'Platforma služi za objavu poslova, prijave kandidata i pregledniju selekciju u Crnoj Gori.',
        card('Tačnost podataka', 'Korisnik je odgovoran za tačnost podataka koje unosi u profil, oglas, biografiju ili prijavu.') +
        card('Provjera javnog sadržaja', 'Firme, oglasi, baneri i uplate mogu čekati provjeru prije nego što budu javno prikazani ili aktivirani.') +
        card('Zabranjen sadržaj', 'Nije dozvoljen lažan, uvredljiv, diskriminatoran ili nezakonit sadržaj. Takav sadržaj može biti odbijen ili uklonjen.') +
        card('Ručne uplate', 'Plan se aktivira nakon provjere uplate. Dokaz uplate se koristi samo za potvrdu narudžbe.'));
    }
    if (path === '/sitemap') {
      app.innerHTML = page('Mapa sajta', 'Pregled svih važnih djelova platforme i kome su namijenjeni.',
        card('Javno', 'Početna, oglasi, gradovi, kategorije, firme, za firme, prijava i registracija.') +
        card('Kandidat', 'Pregled kandidata, biografija, moje prijave, obavještenja i podešavanja profila.') +
        card('Firma', 'Pregled firme, oglasi, novi oglas, selekcija prijava, kandidati, pretplata, baneri i podešavanja.') +
        card('Upravljanje', 'Skriveni dio za provjeru korisnika, oglasa, uplata i javnih prikaza. Nije javna opcija registracije.'));
    }
  }

  function run() { renderPublicInfo(); }
  window.addEventListener('DOMContentLoaded', () => [180, 600].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [120, 420].forEach((ms) => setTimeout(run, ms)));
})();

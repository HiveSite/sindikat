(() => {
  const db = () => window.imaposlaSupabase;
  const currentPath = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const setRoleFlag = (value) => {
    document.documentElement.dataset.userRole = value || 'guest';
    document.documentElement.dataset.roleReady = 'true';
  };

  async function currentRole() {
    const client = db();
    if (!client?.auth) return 'guest';
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    if (!user) return 'guest';
    const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return profile?.role || 'guest';
  }

  function candidateHome() {
    if (typeof state === 'undefined' || typeof app !== 'function') return;
    const root = app();
    if (!root || currentPath() !== '/' || document.documentElement.dataset.userRole !== 'candidate') return;
    const jobs = (state.jobs || []).filter((job) => job.status === 'active').slice(0, 3);
    const companies = (state.companies || []).filter((company) => company.approved !== false).slice(0, 4);
    root.innerHTML = `<section class="live-home candidate-home" data-candidate-home>
      <div class="live-hero">
        <span class="page-label">Kandidat</span>
        <h1>Pronađi posao i prati svoje prijave.</h1>
        <p>Pretraži aktivne oglase, dopuni biografiju i pogledaj odobrene firme. Opcije za objavu oglasa nijesu dio kandidat naloga.</p>
        <form class="live-search" data-search><input class="field" name="q" placeholder="Naziv posla, firma ili vještina" autocomplete="off"><button class="btn blue">Traži posao</button></form>
        <div class="live-actions"><a class="btn lime" href="#/oglasi">Otvori oglase</a><a class="btn blue" href="#/profil/cv">Moja biografija</a><a class="btn ghost" href="#/profil/prijave">Moje prijave</a></div>
      </div>
      <div class="live-section-head"><div><span class="kicker">Aktivno</span><h2>Najnoviji oglasi</h2><p>Prikazuju se samo oglasi koji su spremni za prijavu.</p></div><a class="btn ghost sm" href="#/oglasi">Svi oglasi</a></div>
      <div class="live-jobs">${jobs.length ? jobs.map((job) => `<a class="live-job" href="#/oglasi/${slug(job.title)}-${job.id}"><span class="kicker">${h(job.city)}</span><h3>${h(job.title)}</h3><p>${h(job.company)} · ${h(job.category)} · ${h(job.type)}</p><strong>${h(job.salary)}</strong></a>`).join('') : `<div class="empty home-empty"><h3>Još nema aktivnih oglasa</h3><p>Kada firma pošalje oglas i bude odobren, pojaviće se ovdje.</p><div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a></div></div>`}</div>
      <div class="live-section-head"><div><span class="kicker">Firme</span><h2>Odobreni poslodavci</h2><p>Spisak firmi koje imaju javni profil na platformi.</p></div><a class="btn ghost sm" href="#/firme">Sve firme</a></div>
      <div class="grid two">${companies.length ? companies.map((company) => companyCard(company)).join('') : empty('Nema firmi', 'Firme se prikazuju nakon odobrenja.')}</div>
    </section>`;
  }

  function removeCandidateCompanyActions() {
    if (document.documentElement.dataset.userRole !== 'candidate') return;
    document.querySelectorAll('a[href="#/login?mode=signup&role=company"], a[href="#/za-firme"]').forEach((node) => {
      node.hidden = true;
      node.style.display = 'none';
    });
    if (currentPath() === '/za-firme') location.hash = '/firme';
  }

  async function run() {
    const role = await currentRole();
    setRoleFlag(role);
    setTimeout(() => {
      candidateHome();
      removeCandidateCompanyActions();
    }, 40);
  }

  window.addEventListener('DOMContentLoaded', () => [80, 420, 900].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [80, 360].forEach((ms) => setTimeout(run, ms)));
  db()?.auth?.onAuthStateChange(() => setTimeout(run, 120));
})();

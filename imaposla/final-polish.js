(() => {
  const db = window.imaposlaSupabase;
  const app = () => document.querySelector('#app');
  const currentPath = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const roleNames = { candidate: 'Kandidat', company: 'Firma', admin: 'Upravljanje', guest: 'Gost' };
  const roleHome = { candidate: '/profil/dashboard', company: '/firma/dashboard', admin: '/admin/dashboard', guest: '/' };

  const textReplacements = [
    [/ATS prijave/g, 'Selekcija prijava'],
    [/\bATS\b/g, 'Selekcija'],
    [/Firma dashboard/g, 'Pregled firme'],
    [/Kandidat dashboard/g, 'Pregled kandidata'],
    [/\bDashboard\b/g, 'Pregled'],
    [/\bdashboard\b/g, 'pregled'],
    [/\bLogin\b/g, 'Prijava'],
    [/\blogin\b/g, 'prijava'],
    [/CV profil/g, 'Biografija'],
    [/CV fajlove/g, 'radne biografije'],
    [/\bCV\b/g, 'Biografija'],
    [/\bEmail\b/g, 'E-pošta'],
    [/\bemaila\b/g, 'e-pošte'],
    [/\bemail\b/g, 'e-pošta'],
    [/\bSitemap\b/g, 'Mapa sajta'],
    [/\bAdmin\b/g, 'Upravljanje']
  ];

  async function getAccount() {
    if (!db?.auth) return { session: null, role: 'guest', email: '' };
    const { data } = await db.auth.getSession();
    const session = data?.session || null;
    if (!session?.user) return { session: null, role: 'guest', email: '' };
    const { data: profile } = await db.from('profiles').select('role,email,full_name').eq('id', session.user.id).maybeSingle();
    return { session, role: profile?.role || 'guest', email: profile?.email || session.user.email || '', name: profile?.full_name || '' };
  }

  async function getLatestJobs() {
    try {
      if (!db?.from) return [];
      const { data } = await db.from('jobs').select('id,title,city,category,employment_type,salary,company_id,status,companies(name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(3);
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function translateVisibleText(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue;
      textReplacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
      node.nodeValue = text;
    });
  }

  async function renderUsefulHome(account) {
    const root = app();
    if (!root || currentPath() !== '/') return;
    const jobs = await getLatestJobs();
    const accountCta = account.role === 'company'
      ? ['Pregled firme', '#/firma/dashboard']
      : account.role === 'candidate'
        ? ['Moje prijave', '#/profil/prijave']
        : account.role === 'admin'
          ? ['Upravljanje', '#/admin/dashboard']
          : ['Kreiraj nalog', '#/login?mode=choose-role'];
    root.innerHTML = `
      <section class="home-hero-clean">
        <div>
          <span class="kicker">Poslovi u Crnoj Gori</span>
          <h1>Jasno mjesto za posao i zapošljavanje.</h1>
          <p>imaposla.me povezuje kandidate i firme kroz oglase, prijave i uredan pregled selekcije. Bez suvišnih koraka, bez javnih brojki koje ništa ne znače.</p>
          <form class="home-search" data-home-search>
            <input class="field" name="q" placeholder="Naziv posla, firma ili vještina" autocomplete="off">
            <button class="btn blue">Traži posao</button>
          </form>
          <div class="actions home-actions">
            <a class="btn lime" href="#/oglasi">Pretraži oglase</a>
            <a class="btn ghost" href="#/za-firme">Za firme</a>
            <a class="btn ghost" href="${accountCta[1]}">${accountCta[0]}</a>
          </div>
        </div>
      </section>
      <section class="home-role-grid" aria-label="Izaberi šta želiš da uradiš">
        <a class="home-role-card" href="#/oglasi">
          <span>Kandidat</span>
          <h2>Tražim posao</h2>
          <p>Pregledaj oglase, otvori detalje posla i pošalji prijavu sa radnom biografijom.</p>
          <strong>Otvori oglase</strong>
        </a>
        <a class="home-role-card" href="#/za-firme">
          <span>Firma</span>
          <h2>Zapošljavam</h2>
          <p>Kreiraj profil firme, pripremi oglas i vodi prijave kroz selekciju kandidata.</p>
          <strong>Objavi oglas</strong>
        </a>
      </section>
      <section class="home-section-head">
        <div>
          <span class="kicker">Aktuelno</span>
          <h2>Najnoviji oglasi</h2>
          <p>Ovdje se prikazuju samo oglasi koji su odobreni i spremni za kandidate.</p>
        </div>
        <a class="btn ghost sm" href="#/oglasi">Svi oglasi</a>
      </section>
      <section class="home-jobs-grid">
        ${jobs.length ? jobs.map((job) => `
          <a class="job-card" href="#/oglas/${job.id}">
            <span class="kicker">${job.city || 'Crna Gora'}</span>
            <h3>${job.title || 'Oglas za posao'}</h3>
            <p>${job.companies?.name || 'Firma'} · ${job.category || 'Kategorija'} · ${job.employment_type || 'Dogovor'}</p>
            <strong>${job.salary || 'Plata po dogovoru'}</strong>
          </a>`).join('') : `
          <div class="empty home-empty">
            <h3>Još nema odobrenih oglasa</h3>
            <p>Kada firma pošalje oglas i bude odobren, pojaviće se ovdje. Do tada kandidat može otvoriti stranicu oglasa, a firma može pripremiti prvi oglas.</p>
            <div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a><a class="btn lime" href="#/login?mode=signup&role=company">Objavi oglas</a></div>
          </div>`}
      </section>`;
  }

  function improveSelectionPage() {
    const root = app();
    if (!root || currentPath() !== '/firma/ats') return;
    root.classList.add('selection-page');
    translateVisibleText(root);
    if (!root.querySelector('[data-selection-intro]')) {
      const intro = document.createElement('section');
      intro.className = 'selection-intro';
      intro.dataset.selectionIntro = 'true';
      intro.innerHTML = `
        <span class="kicker">Selekcija prijava</span>
        <h1>Pregled kandidata po fazama</h1>
        <p>Ovdje firma vidi sve pristigle prijave i vodi ih kroz jasan tok: nova prijava, pregled, razgovor, uži izbor, ponuda, zaposlen ili odbijeno. Na telefonu su faze poređane jedna ispod druge da se sve lako čita i koristi.</p>
        <div class="selection-steps" aria-label="Tok selekcije">
          <div><strong>1. Pregledaj</strong><span>Otvori prijavu, pročitaj poruku i radnu biografiju kandidata.</span></div>
          <div><strong>2. Pomjeri fazu</strong><span>Označi gdje se kandidat nalazi u procesu zapošljavanja.</span></div>
          <div><strong>3. Sačuvaj odluku</strong><span>Kandidat i firma uvijek imaju jasniji status prijave.</span></div>
        </div>`;
      root.prepend(intro);
    }
  }

  function setMobileNav(role) {
    const nav = document.querySelector('.mobile-app-nav');
    if (!nav) return;
    const path = currentPath();
    const item = (icon, label, href, extra = '') => `<a class="${path === href ? 'active' : ''}" href="#${href}" ${extra}><span>${icon}</span>${label}</a>`;
    const signout = '<a href="#/" data-mobile-signout="true"><span>⏻</span>Odjava</a>';
    const sets = {
      company: [item('⌂', 'Pregled', '/firma/dashboard'), item('▤', 'Oglasi', '/firma/oglasi'), item('+', 'Novi', '/firma/novi-oglas'), item('☷', 'Izbor', '/firma/ats'), signout],
      candidate: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('□', 'Biogr.', '/profil/cv'), item('✉', 'Prijave', '/profil/prijave'), signout],
      admin: [item('⌂', 'Pregled', '/admin/dashboard'), item('€', 'Uplate', '/admin/uplate'), item('✓', 'Oglasi', '/admin/oglasi'), item('☷', 'Ljudi', '/admin/korisnici'), signout],
      guest: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('▦', 'Firme', '/firme'), item('+', 'Oglas', '/login?mode=signup&role=company'), item('↪', 'Prijava', '/login')]
    };
    nav.innerHTML = (sets[role] || sets.guest).join('');
  }

  function setAccountState(role, email) {
    const pill = document.querySelector('[data-role-pill]');
    if (pill) pill.textContent = role === 'guest' ? 'Niste prijavljeni' : `${roleNames[role] || 'Nalog'} prijavljen`;
    document.querySelectorAll('[data-account-state]').forEach((node) => node.remove());
    const topActions = document.querySelector('.top-actions');
    if (topActions && role !== 'guest') {
      const state = document.createElement('span');
      state.className = 'account-state';
      state.dataset.accountState = 'true';
      state.textContent = email ? `Prijavljen: ${email}` : `${roleNames[role]} prijavljen`;
      topActions.prepend(state);
    }
  }

  function hideWrongRoleLinks(role) {
    const rules = [
      ['a[href^="#/firma/"]', role !== 'company'],
      ['a[href^="#/profil/"]', role !== 'candidate'],
      ['a[href^="#/admin/"]', role !== 'admin']
    ];
    rules.forEach(([selector, hidden]) => document.querySelectorAll(selector).forEach((link) => {
      if (link.getAttribute('href')?.includes('/login?')) return;
      link.toggleAttribute('hidden', hidden);
      link.style.display = hidden ? 'none' : '';
    }));
  }

  function gateContent(message, actionHref = '#/login') {
    const root = app();
    if (!root || root.querySelector('[data-auth-gate]')) return;
    root.innerHTML = `<section class="auth-gate" data-auth-gate><span class="kicker">Pristup nalogu</span><h1>Ova stranica nije dostupna za ovaj nalog</h1><p>${message}</p><div class="actions"><a class="btn blue" href="${actionHref}">Nastavi</a><a class="btn ghost" href="#/">Početna</a></div></section>`;
  }

  async function enforceRoleAccess(role) {
    const path = currentPath();
    if (path.startsWith('/firma/') && role !== 'company') gateContent(role === 'guest' ? 'Za ovaj dio treba prijava firme.' : 'Ovaj dio mogu koristiti samo firme.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
    if (path.startsWith('/profil/') && role !== 'candidate') gateContent(role === 'guest' ? 'Za ovaj dio treba prijava kandidata.' : 'Ovaj dio mogu koristiti samo kandidati.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
    if (path.startsWith('/admin/') && role !== 'admin') gateContent('Ovaj dio nije javno dostupan.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
  }

  function bindSignout() {
    document.querySelectorAll('[data-mobile-signout="true"]').forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        await db?.auth?.signOut();
        const toast = document.querySelector('[data-toast]');
        if (toast) {
          toast.textContent = 'Odjavljeni ste.';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2600);
        }
        location.hash = '/';
        setTimeout(runPolish, 150);
      }, { once: true });
    });
  }

  function bindHomeSearch() {
    document.querySelectorAll('[data-home-search]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const q = new FormData(form).get('q') || '';
        location.hash = `#/oglasi?q=${encodeURIComponent(String(q))}`;
      }, { once: true });
    });
  }

  async function runPolish() {
    const account = await getAccount();
    await renderUsefulHome(account);
    translateVisibleText(document.body);
    improveSelectionPage();
    setMobileNav(account.role);
    setAccountState(account.role, account.email);
    hideWrongRoleLinks(account.role);
    await enforceRoleAccess(account.role);
    bindSignout();
    bindHomeSearch();
  }

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(runPolish, 80);
  };

  window.addEventListener('DOMContentLoaded', () => {
    runPolish();
    setTimeout(runPolish, 500);
    setTimeout(runPolish, 1300);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
  window.addEventListener('hashchange', () => {
    schedule();
    setTimeout(runPolish, 350);
  });
  db?.auth?.onAuthStateChange(() => setTimeout(runPolish, 120));
})();

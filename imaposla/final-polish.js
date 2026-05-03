(() => {
  const db = window.imaposlaSupabase;
  const app = () => document.querySelector('#app');
  const currentPath = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const query = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const roleNames = { candidate: 'Kandidat', company: 'Firma', admin: 'Upravljanje', guest: 'Gost' };
  const roleHome = { candidate: '/profil/dashboard', company: '/firma/dashboard', admin: '/admin/dashboard', guest: '/' };

  const textReplacements = [
    [/ATS prijave/g, 'Selekcija prijava'], [/\bATS\b/g, 'Selekcija'], [/Firma dashboard/g, 'Pregled firme'], [/Kandidat dashboard/g, 'Pregled kandidata'], [/\bDashboard\b/g, 'Pregled'], [/\bdashboard\b/g, 'pregled'], [/\bLogin\b/g, 'Prijava'], [/\blogin\b/g, 'prijava'], [/CV profil/g, 'Biografija'], [/CV fajlove/g, 'radne biografije'], [/\bCV\b/g, 'Biografija'], [/\bEmail\b/g, 'E-pošta'], [/\bemaila\b/g, 'e-pošte'], [/\bemail\b/g, 'e-pošta'], [/\bSitemap\b/g, 'Mapa sajta'], [/\bAdmin\b/g, 'Upravljanje'], [/\badmin\b/g, 'upravljanje']
  ];

  const showToast = (message) => {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.finalToastTimer);
    window.finalToastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  };

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
      const { data } = await db.from('jobs').select('id,title,contract_type,salary_text,status,companies(name),categories(name),cities(name)').eq('status', 'active').order('created_at', { ascending: false }).limit(3);
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  function slug(value) {
    return String(value || 'oglas').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'oglas';
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
    if (window.imaposlaLiveReadyHome !== false) return;
    const jobs = await getLatestJobs();
    const accountCta = account.role === 'company' ? ['Pregled firme', '#/firma/dashboard'] : account.role === 'candidate' ? ['Moje prijave', '#/profil/prijave'] : account.role === 'admin' ? ['Upravljanje', '#/admin/dashboard'] : ['Kreiraj nalog', '#/login?mode=choose-role'];
    root.innerHTML = `
      <section class="home-hero-clean">
        <span class="page-label">Početna</span>
        <h1>Posao i zapošljavanje bez lutanja.</h1>
        <p>Kandidat traži posao i šalje prijavu. Firma objavljuje oglas i prati prijave. Svako vidi samo ono što mu pripada.</p>
        <form class="home-search" data-home-search><input class="field" name="q" placeholder="Naziv posla, firma ili vještina" autocomplete="off"><button class="btn blue">Traži posao</button></form>
        <div class="actions home-actions"><a class="btn lime" href="#/oglasi">Tražim posao</a><a class="btn blue" href="#/login?mode=signup&role=company">Zapošljavam</a><a class="btn ghost" href="${accountCta[1]}">${accountCta[0]}</a></div>
      </section>
      <section class="home-role-grid" aria-label="Izaberi šta želiš da uradiš">
        <a class="home-role-card" href="#/oglasi"><span>Kandidat</span><h2>Tražim posao</h2><p>Pregledaj oglase, otvori detalje posla i pošalji prijavu sa radnom biografijom.</p><strong>Otvori oglase</strong></a>
        <a class="home-role-card" href="#/login?mode=signup&role=company"><span>Firma</span><h2>Zapošljavam</h2><p>Kreiraj nalog firme, pripremi profil i objavi oglas za provjeru.</p><strong>Kreni kao firma</strong></a>
      </section>
      <section class="home-section-head"><div><span class="kicker">Aktuelno</span><h2>Najnoviji oglasi</h2><p>Ovdje su samo aktivni i odobreni oglasi koji su spremni za kandidate.</p></div><a class="btn ghost sm" href="#/oglasi">Svi oglasi</a></section>
      <section class="home-jobs-grid">${jobs.length ? jobs.map((job) => `<a class="job-card" href="#/oglasi/${slug(job.title)}-${job.id}"><span class="kicker">${job.cities?.name || 'Crna Gora'}</span><h3>${job.title || 'Oglas za posao'}</h3><p>${job.companies?.name || 'Firma'} · ${job.categories?.name || 'Kategorija'} · ${job.contract_type || 'Dogovor'}</p><strong>${job.salary_text || 'Plata po dogovoru'}</strong></a>`).join('') : `<div class="empty home-empty"><h3>Još nema aktivnih oglasa</h3><p>Kada firma pošalje oglas i bude odobren, pojaviće se ovdje.</p><div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a><a class="btn lime" href="#/login?mode=signup&role=company">Objavi oglas</a></div></div>`}</section>`;
  }

  function renderAuthPages(account) {
    const root = app();
    if (!root || currentPath() !== '/login') return;
    const mode = query().get('mode') || 'start';
    const role = query().get('role') === 'company' ? 'company' : 'candidate';
    if (account.role !== 'guest') {
      root.innerHTML = `<section class="auth-shell"><span class="page-label">Nalog</span><h1>Već ste prijavljeni.</h1><p>Trenutno koristite nalog: <strong>${roleNames[account.role]}</strong>${account.email ? `, ${account.email}` : ''}. Možete nastaviti na svoj pregled ili se odjaviti.</p><div class="auth-actions"><a class="btn blue" href="#${roleHome[account.role]}">Otvori moj pregled</a><button class="btn red" data-signout-anywhere>Odjava</button></div></section>`;
      return;
    }
    if (mode === 'choose-role') {
      root.innerHTML = `<section class="auth-shell"><span class="page-label">Novi nalog</span><h1>Koji nalog želiš?</h1><p>Izaberi ulogu prije formulara. Kandidat traži posao. Firma objavljuje oglase i pregleda prijave.</p><div class="auth-role-grid"><a class="auth-role-card" href="#/login?mode=signup&role=candidate"><span>Kandidat</span><h2>Tražim posao</h2><p>Za prijave na oglase, biografiju i praćenje statusa.</p></a><a class="auth-role-card" href="#/login?mode=signup&role=company"><span>Firma</span><h2>Zapošljavam</h2><p>Za objavu oglasa, profil firme i selekciju prijava.</p></a></div><div class="auth-actions"><a class="btn ghost" href="#/login?mode=signin">Imam nalog</a></div></section>`;
      return;
    }
    if (mode === 'signup') {
      root.innerHTML = `<section class="auth-shell auth-two"><div><span class="page-label">Registracija</span><h1>${role === 'company' ? 'Nalog firme' : 'Nalog kandidata'}</h1><p>${role === 'company' ? 'Koristi se za profil firme, oglase i pregled prijava. Poslije registracije otvara se pregled firme.' : 'Koristi se za biografiju, prijave i praćenje statusa oglasa.'}</p><div class="auth-actions"><a class="btn ghost" href="#/login?mode=choose-role">Promijeni ulogu</a><a class="btn ghost" href="#/login?mode=signin">Imam nalog</a></div></div><form class="auth-form" data-final-auth="signup"><input type="hidden" name="role" value="${role}"><label><span class="label">E-pošta</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn blue">Kreiraj nalog</button><p>Lozinka treba da ima najmanje 8 znakova.</p></form></section>`;
      return;
    }
    root.innerHTML = `<section class="auth-shell auth-two"><div><span class="page-label">Prijava</span><h1>Uđi na svoj nalog.</h1><p>Unesi e-poštu i lozinku. Sistem sam otvara pregled koji pripada tvojoj ulozi: kandidat, firma ili upravljanje.</p><div class="auth-actions"><a class="btn lime" href="#/login?mode=choose-role">Kreiraj nalog</a></div></div><form class="auth-form" data-final-auth="signin"><label><span class="label">E-pošta</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="current-password" required></label><button class="btn blue">Prijavi se</button><p>Upravljanje se ne bira javno. Sistem sam otvara taj dio samo nalogu koji već ima tu ulogu u bazi.</p></form></section>`;
  }

  function improveSelectionPage() {
    const root = app();
    if (!root || currentPath() !== '/firma/ats') return;
    root.classList.add('selection-page');
    translateVisibleText(root);
    if (!root.querySelector('[data-selection-intro]')) root.prepend(Object.assign(document.createElement('section'), { className: 'selection-intro', innerHTML: `<span class="kicker">Selekcija prijava</span><h1>Pregled kandidata po fazama</h1><p>Ovdje firma vidi sve pristigle prijave i vodi ih kroz jasan tok: nova prijava, pregled, razgovor, uži izbor, ponuda, zaposlen ili odbijeno.</p><div class="selection-steps"><div><strong>1. Pregledaj</strong><span>Otvori prijavu i pročitaj podatke kandidata.</span></div><div><strong>2. Pomjeri fazu</strong><span>Označi gdje je kandidat u procesu.</span></div><div><strong>3. Sačuvaj odluku</strong><span>Firma uvijek ima jasan status svake prijave.</span></div></div>` }));
  }

  function setMobileNav(role) {
    const nav = document.querySelector('.mobile-app-nav');
    if (!nav) return;
    const path = currentPath();
    const item = (icon, label, href, extra = '') => `<a class="${path === href ? 'active' : ''}" href="#${href}" ${extra}><span>${icon}</span>${label}</a>`;
    const signout = '<a href="#/" data-signout-anywhere><span>⏻</span>Odjava</a>';
    const sets = {
      company: [item('⌂', 'Pregled', '/firma/dashboard'), item('▤', 'Oglasi', '/firma/oglasi'), item('+', 'Novi', '/firma/novi-oglas'), item('☷', 'Izbor', '/firma/ats'), signout],
      candidate: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('□', 'Biogr.', '/profil/cv'), item('✉', 'Prijave', '/profil/prijave'), signout],
      admin: [item('⌂', 'Pregled', '/admin/dashboard'), item('€', 'Uplate', '/admin/uplate'), item('✓', 'Oglasi', '/admin/oglasi'), item('☷', 'Ljudi', '/admin/korisnici'), signout],
      guest: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('▦', 'Firme', '/firme'), item('+', 'Firma', '/login?mode=signup&role=company'), item('↪', 'Prijava', '/login?mode=signin')]
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
    [['a[href^="#/firma/"]', role !== 'company'], ['a[href^="#/profil/"]', role !== 'candidate'], ['a[href^="#/admin/"]', role !== 'admin']].forEach(([selector, hidden]) => document.querySelectorAll(selector).forEach((link) => {
      if (link.getAttribute('href')?.includes('/login?')) return;
      link.toggleAttribute('hidden', hidden);
      link.style.display = hidden ? 'none' : '';
    }));
  }

  function gateContent(message, actionHref = '#/login?mode=signin') {
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

  async function signOut() {
    await db?.auth?.signOut();
    showToast('Odjavljeni ste.');
    location.hash = '/';
    setTimeout(runPolish, 120);
  }

  function bindHomeSearch() {
    document.querySelectorAll('[data-home-search]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = new FormData(form).get('q') || '';
      location.hash = `#/oglasi?q=${encodeURIComponent(String(q))}`;
    }, { once: true }));
  }

  async function runPolish() {
    const account = await getAccount();
    await renderUsefulHome(account);
    renderAuthPages(account);
    translateVisibleText(document.body);
    improveSelectionPage();
    setMobileNav(account.role);
    setAccountState(account.role, account.email);
    hideWrongRoleLinks(account.role);
    await enforceRoleAccess(account.role);
    bindHomeSearch();
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-final-auth]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const requestedRole = String(data.get('role') || 'candidate');
    try {
      if (form.dataset.finalAuth === 'signup') {
        const { error } = await db.auth.signUp({ email, password, options: { data: { role: requestedRole } } });
        if (error) throw error;
        showToast('Nalog je kreiran. Sada se prijavi.');
        location.hash = '/login?mode=signin';
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const account = await getAccount();
        showToast('Prijava uspješna.');
        location.hash = roleHome[account.role] || '/';
      }
    } catch (error) {
      const message = String(error?.message || 'Akcija nije uspjela. Pokušaj ponovo.');
      showToast(/invalid login credentials/i.test(message) ? 'E-pošta ili lozinka nisu tačni.' : message);
    }
  }, true);

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-signout-anywhere],[data-flow-signout]');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await signOut();
  }, true);

  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(runPolish, 80); };
  window.addEventListener('DOMContentLoaded', () => { runPolish(); setTimeout(runPolish, 500); setTimeout(runPolish, 1300); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); });
  window.addEventListener('hashchange', () => { schedule(); setTimeout(runPolish, 350); });
  db?.auth?.onAuthStateChange(() => setTimeout(runPolish, 120));
})();

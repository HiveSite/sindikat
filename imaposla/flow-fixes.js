(() => {
  const db = window.imaposlaSupabase;
  const roleLabel = { candidate: 'Kandidat', company: 'Firma', admin: 'Nalog', guest: 'Gost' };
  const roleHome = (role) => role === 'admin' ? '/admin/dashboard' : role === 'company' ? '/firma/dashboard' : role === 'candidate' ? '/profil/dashboard' : '/login';
  const app = () => document.querySelector('#app');
  const currentPath = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const query = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const go = (path) => { location.hash = path; };
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.flowToastTimer);
    window.flowToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };
  const startRoute = () => {
    document.documentElement.classList.add('is-routing');
    clearTimeout(window.flowRouteTimer);
    window.flowRouteTimer = setTimeout(() => document.documentElement.classList.remove('is-routing'), 260);
  };
  const finishRoute = () => {
    clearTimeout(window.flowRouteTimer);
    window.flowRouteTimer = setTimeout(() => document.documentElement.classList.remove('is-routing'), 90);
  };

  let profileCache = { stamp: 0, session: null, profile: null };
  const clearProfileCache = () => { profileCache = { stamp: 0, session: null, profile: null }; };

  if (!localStorage.getItem('imaposlaTheme')) {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('imaposlaTheme', 'dark');
  }

  async function getProfile(force = false) {
    if (!db?.auth) return { session: null, profile: null };
    if (!force && Date.now() - profileCache.stamp < 8000) return profileCache;
    const { data } = await db.auth.getSession();
    const session = data?.session || null;
    if (!session?.user) {
      profileCache = { stamp: Date.now(), session, profile: null };
      return profileCache;
    }
    const { data: profile } = await db.from('profiles').select('id,role,full_name,email').eq('id', session.user.id).maybeSingle();
    profileCache = { stamp: Date.now(), session, profile: profile || null };
    return profileCache;
  }

  function authError(error) {
    const message = String(error?.message || '');
    if (/invalid login credentials/i.test(message)) return 'Email ili lozinka nisu tačni.';
    if (/email not confirmed/i.test(message)) return 'Email još nije potvrđen. Provjeri inbox.';
    if (/network|fetch/i.test(message)) return 'Ne mogu da se povežem sa bazom. Pokušaj ponovo za trenutak.';
    return message || 'Akcija nije uspjela. Pokušaj ponovo.';
  }

  function renderLoginPage() {
    const mode = query().get('mode');
    const signupRole = query().get('role') === 'company' ? 'company' : 'candidate';
    const root = app();
    if (!root) return;

    if (!mode) {
      root.innerHTML = `<section class="panel"><span class="kicker">Pristup nalogu</span><h1>Šta želiš da uradiš?</h1><p class="lead">Prvo izaberi akciju. Formular se otvara tek kada izabereš prijavu ili registraciju.</p><div class="flow-choice-grid"><a class="flow-choice-card" href="#/login?mode=signin"><strong>Prijavi se</strong><span>Za postojeći nalog kandidata ili firme.</span><span class="btn blue sm">Nastavi</span></a><a class="flow-choice-card" href="#/login?mode=choose-role"><strong>Kreiraj nalog</strong><span>Za kandidate koji traže posao i firme koje zapošljavaju.</span><span class="btn lime sm">Izaberi tip naloga</span></a></div></section>`;
      return;
    }

    if (mode === 'choose-role') {
      root.innerHTML = `<section class="panel"><span class="kicker">Novi nalog</span><h1>Izaberi tip naloga</h1><p class="lead">Kandidat se prijavljuje na oglase. Firma objavljuje oglase i vodi selekciju.</p><div class="flow-choice-grid"><a class="flow-choice-card" href="#/login?mode=signup&role=candidate"><strong>Kandidat</strong><span>CV, prijave, obavještenja i statusi.</span><span class="btn blue sm">Nastavi</span></a><a class="flow-choice-card" href="#/login?mode=signup&role=company"><strong>Firma</strong><span>Oglasi, prijave, ATS i pretplata.</span><span class="btn lime sm">Nastavi</span></a></div><div class="actions"><a class="btn ghost" href="#/login">Nazad</a></div></section>`;
      return;
    }

    if (mode === 'signup') {
      root.innerHTML = `<section class="grid two"><div class="panel"><span class="kicker">Registracija</span><h1>${signupRole === 'company' ? 'Nalog za firmu' : 'Nalog za kandidata'}</h1><p class="lead">${signupRole === 'company' ? 'Nakon registracije možeš urediti profil firme i pripremiti prvi oglas za provjeru.' : 'Nakon registracije možeš urediti CV i prijavljivati se na oglase.'}</p><div class="actions"><a class="btn ghost" href="#/login?mode=choose-role">Promijeni tip</a><a class="btn ghost" href="#/login">Nazad</a></div></div><form class="form-card" data-auth-form="signup"><input type="hidden" name="role" value="${signupRole}"><label><span class="label">Email</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn blue">Kreiraj nalog</button><p class="flow-login-note">Ako je potvrda emaila uključena, treba potvrditi email prije prve prijave.</p></form></section>`;
      return;
    }

    root.innerHTML = `<section class="grid two"><div class="panel"><span class="kicker">Prijava</span><h1>Uđi na svoj nalog</h1><p class="lead">Unesi email i lozinku. Sistem sam otvara pravi dashboard za tvoj nalog.</p><div class="actions"><a class="btn ghost" href="#/login?mode=choose-role">Nemam nalog</a><a class="btn ghost" href="#/login">Nazad</a></div></div><form class="form-card" data-auth-form="signin"><label><span class="label">Email</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="current-password" required></label><button class="btn blue">Prijavi se</button><p class="flow-login-note">Ako prijava uspije, a ne otvori se dashboard, profilu vjerovatno nije dodijeljena prava uloga u bazi.</p></form></section>`;
  }

  function renderInfoPages() {
    const root = app();
    if (!root) return;
    if (currentPath() === '/politika-privatnosti') {
      root.innerHTML = `<section class="panel"><span class="kicker">Privatnost</span><h1>Politika privatnosti</h1><p class="lead">imaposla.me čuva podatke samo za povezivanje kandidata i poslodavaca. Podaci se koriste za nalog, prijave, komunikaciju i sigurnost platforme.</p><ul class="info-list"><li><strong>Podaci kandidata</strong>Ime, email, telefon, grad, CV, poruka uz prijavu i status prijave.</li><li><strong>Podaci firme</strong>Naziv, opis, grad, industrija, oglasi, prijave, uplate i baneri.</li><li><strong>Ko vidi podatke</strong>Firma vidi podatke kandidata samo kada kandidat pošalje prijavu. Javni posjetioci vide samo javne oglase i profile firmi.</li><li><strong>Brisanje i izmjene</strong>Korisnik može zatražiti izmjenu ili brisanje podataka preko kontakt emaila vlasnika platforme.</li></ul></section>`;
    }
    if (currentPath() === '/uslovi-koristenja') {
      root.innerHTML = `<section class="panel"><span class="kicker">Uslovi</span><h1>Uslovi korišćenja</h1><p class="lead">Platforma služi za objavu poslova, slanje prijava i vođenje selekcije. Korisnici su odgovorni za tačnost informacija koje unose.</p><ul class="info-list"><li><strong>Kandidati</strong>Ne šalju netačne podatke, tuđe CV fajlove ili neprimjeren sadržaj.</li><li><strong>Firme</strong>Objavljuju stvarne oglase, jasne uslove rada i poštuju privatnost kandidata.</li><li><strong>Provjera objava</strong>Firme, oglasi, uplate i baneri mogu čekati provjeru prije javnog prikaza.</li><li><strong>Zabrane</strong>Nije dozvoljen spam, lažno predstavljanje, diskriminatoran sadržaj ili zloupotreba kontakt podataka.</li></ul></section>`;
    }
    if (currentPath() === '/sitemap') {
      root.innerHTML = `<section class="panel"><span class="kicker">Mapa sajta</span><h1>Sitemap</h1><p class="lead">Brzi pregled najvažnijih djelova platforme po tipu korisnika.</p><div class="grid three"><div class="card"><h3>Javno</h3><p>Početna, oglasi, detalj oglasa, gradovi, kategorije, firme i stranica za poslodavce.</p><div class="actions"><a class="btn blue sm" href="#/oglasi">Oglasi</a><a class="btn ghost sm" href="#/firme">Firme</a></div></div><div class="card"><h3>Kandidat</h3><p>Dashboard, CV profil, prijave, obavještenja i podešavanja naloga.</p><div class="actions"><a class="btn lime sm" href="#/profil/dashboard">Kandidat</a></div></div><div class="card"><h3>Firma</h3><p>Profil firme, oglasi, novi oglas, ATS, kandidati, pretplata, baneri i podešavanja.</p><div class="actions"><a class="btn blue sm" href="#/firma/dashboard">Firma</a></div></div></div></section>`;
    }
  }

  function cleanPublicAdminCopy() {
    document.querySelectorAll('a[href="#/admin/dashboard"]').forEach((node) => node.remove());
    const publicPage = ['/', '/za-firme', '/sitemap'].includes(currentPath());
    if (!publicPage) return;
    const root = app();
    if (!root) return;
    root.querySelectorAll('h3').forEach((title) => {
      if (title.textContent.trim().toLowerCase() !== 'admin') return;
      title.textContent = 'Provjeren sistem';
      const p = title.parentElement?.querySelector('p');
      if (p) p.textContent = 'Osjetljivi koraci prolaze kroz kontrolu prije javnog prikaza.';
    });
    root.querySelectorAll('p,.lead,.sub').forEach((node) => {
      node.textContent = node.textContent
        .replace(/Admin odobrava javne korake da platforma ostane uredna\./g, 'Osjetljive objave prolaze provjeru prije javnog prikaza.')
        .replace(/Admin odobrava firme, oglase, banere i uplate\./g, 'Javni koraci prolaze provjeru prije prikaza.')
        .replace(/admin moderacija/g, 'provjera objava');
    });
  }

  function ensureMobileNav(role) {
    let nav = document.querySelector('[data-mobile-app-nav]');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'mobile-app-nav';
      nav.dataset.mobileAppNav = 'true';
      nav.setAttribute('aria-label', 'Mobilna navigacija');
      document.body.appendChild(nav);
    }
    const items = role === 'company'
      ? [['🏠','Firma','/firma/dashboard'],['📋','Oglasi','/firma/oglasi'],['＋','Novi','/firma/novi-oglas'],['☷','ATS','/firma/ats'],['⚙','Podeš.','/firma/podesavanja']]
      : role === 'admin'
        ? [['🏠','Admin','/admin/dashboard'],['€','Uplate','/admin/uplate'],['✓','Oglasi','/admin/oglasi'],['👥','Korisnici','/admin/korisnici'],['▣','Stat','/admin/statistike']]
        : role === 'candidate'
          ? [['⌂','Početna','/'],['🔎','Oglasi','/oglasi'],['CV','CV','/profil/cv'],['✉','Prijave','/profil/prijave'],['⚙','Podeš.','/profil/podesavanja']]
          : [['⌂','Početna','/'],['🔎','Oglasi','/oglasi'],['▦','Firme','/firme'],['＋','Oglas','/login?mode=signup&role=company'],['↪','Login','/login']];
    nav.innerHTML = items.map(([icon,label,path]) => `<a class="${currentPath() === path ? 'active' : ''}" href="#${path}"><span>${icon}</span>${label}</a>`).join('');
  }

  async function syncChrome(force = false) {
    const actions = document.querySelector('.top-actions');
    if (!actions) return;
    const { session, profile } = await getProfile(force);
    const role = profile?.role || 'guest';
    const pill = document.querySelector('[data-role-pill]');
    if (pill) pill.textContent = roleLabel[role] || 'Gost';
    ensureMobileNav(role);

    const oldPost = actions.querySelector('a[href="#/firma/novi-oglas"]');
    if (oldPost) oldPost.setAttribute('href', '#/login?mode=signup&role=company');
    actions.querySelectorAll('[data-flow-signout],[data-flow-dashboard]').forEach((node) => node.remove());

    const oldLogin = actions.querySelector('[data-action="open-login"]');
    if (session?.user && profile) {
      oldLogin?.remove();
      const theme = actions.querySelector('[data-action="toggle-theme"]');
      const dashboard = document.createElement('a');
      dashboard.className = 'btn ghost flow-account-link';
      dashboard.href = `#${roleHome(role)}`;
      dashboard.dataset.flowDashboard = 'true';
      dashboard.textContent = role === 'admin' ? 'Dashboard' : (roleLabel[role] || 'Dashboard');
      const signout = document.createElement('button');
      signout.className = 'btn red';
      signout.type = 'button';
      signout.dataset.flowSignout = 'true';
      signout.textContent = 'Odjava';
      actions.insertBefore(dashboard, theme?.nextSibling || actions.firstChild);
      actions.insertBefore(signout, dashboard.nextSibling);
    } else if (!oldLogin) {
      const theme = actions.querySelector('[data-action="toggle-theme"]');
      const login = document.createElement('button');
      login.className = 'btn ghost';
      login.type = 'button';
      login.dataset.action = 'open-login';
      login.textContent = 'Prijava';
      actions.insertBefore(login, theme?.nextSibling || actions.firstChild);
    }
  }

  function closeMobileMenu() {
    document.querySelector('[data-mobile-menu]')?.classList.remove('open');
  }

  async function afterRender(force = false) {
    if (currentPath() === '/login') renderLoginPage();
    renderInfoPages();
    cleanPublicAdminCopy();
    await syncChrome(force);
    finishRoute();
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-auth-form]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!db?.auth) return toast('Prijava trenutno nije dostupna. Pokušaj ponovo malo kasnije.');
    const data = new FormData(form);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    const requestedRole = String(data.get('role') || 'candidate');
    try {
      if (form.dataset.authForm === 'signup') {
        const { data: signUpData, error } = await db.auth.signUp({ email, password, options: { data: { role: requestedRole } } });
        if (error) throw error;
        clearProfileCache();
        if (signUpData?.session && typeof window.loadData === 'function') await window.loadData();
        toast(signUpData?.session ? 'Nalog je kreiran.' : 'Nalog je kreiran. Provjeri email prije prve prijave.');
        go(signUpData?.session ? roleHome(requestedRole) : '/login?mode=signin');
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        clearProfileCache();
        if (typeof window.loadData === 'function') await window.loadData();
        const { profile } = await getProfile(true);
        if (!profile?.role) return toast('Prijava je uspjela, ali profil nije podešen u bazi.');
        toast('Prijava uspješna.');
        go(roleHome(profile.role));
      }
    } catch (error) {
      toast(authError(error));
    }
  }, true);

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('button,a');
    const menu = document.querySelector('[data-mobile-menu]');
    if (menu?.classList.contains('open') && !event.target.closest('[data-mobile-menu]') && !event.target.closest('[data-action="toggle-menu"]')) closeMobileMenu();
    if (!target) return;
    if (target.matches('[data-mobile-menu] a')) closeMobileMenu();
    if (target.matches('a[href^="#/"]')) startRoute();
    if (target.matches('[data-flow-signout]')) {
      event.preventDefault();
      await db?.auth?.signOut();
      clearProfileCache();
      closeMobileMenu();
      toast('Odjavljen si.');
      go('/');
      setTimeout(() => afterRender(true), 50);
    }
    if (target.matches('[data-action="open-login"]')) {
      event.preventDefault();
      closeMobileMenu();
      startRoute();
      go('/login');
    }
  }, true);

  db?.auth?.onAuthStateChange(() => {
    clearProfileCache();
    setTimeout(() => afterRender(true), 60);
  });
  window.addEventListener('hashchange', () => {
    closeMobileMenu();
    startRoute();
    setTimeout(() => afterRender(false), 30);
  });
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => afterRender(true), 700));
  setTimeout(() => afterRender(true), 1200);
})();

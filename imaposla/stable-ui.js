(() => {
  const db = () => window.imaposlaSupabase;
  const app = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const query = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const roleNames = { candidate: 'Kandidat', company: 'Firma', admin: 'Upravljanje', guest: 'Gost' };
  const roleHomes = { candidate: '/profil/dashboard', company: '/firma/dashboard', admin: '/admin/dashboard', guest: '/' };
  let lastAccountKey = '';

  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.stableUiToastTimer);
    window.stableUiToastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  };

  async function account() {
    const client = db();
    if (!client?.auth) return { user: null, role: 'guest', email: '' };
    const { data } = await client.auth.getSession();
    const user = data?.session?.user || null;
    if (!user) return { user: null, role: 'guest', email: '' };
    const profile = await client.from('profiles').select('role,email,full_name').eq('id', user.id).maybeSingle();
    return { user, role: profile.data?.role || 'guest', email: profile.data?.email || user.email || '', name: profile.data?.full_name || '' };
  }

  function setAccountChrome(me) {
    const pill = document.querySelector('[data-role-pill]');
    if (pill) pill.textContent = me.role === 'guest' ? 'Niste prijavljeni' : `${roleNames[me.role] || 'Nalog'} prijavljen`;
    document.querySelectorAll('[data-account-state]').forEach((node) => node.remove());
    const topActions = document.querySelector('.top-actions');
    if (topActions && me.role !== 'guest') {
      const badge = document.createElement('span');
      badge.className = 'account-state';
      badge.dataset.accountState = 'true';
      badge.textContent = me.email ? `Prijavljen: ${me.email}` : `${roleNames[me.role]} prijavljen`;
      topActions.prepend(badge);
    }
  }

  function setMobileNav(me) {
    const nav = document.querySelector('.mobile-app-nav');
    if (!nav) return;
    const path = route();
    const item = (icon, label, href, extra = '') => `<a class="${path === href ? 'active' : ''}" href="#${href}" ${extra}><span>${icon}</span>${label}</a>`;
    const out = '<a href="#/" data-stable-signout><span>⏻</span>Odjava</a>';
    const menus = {
      company: [item('⌂', 'Pregled', '/firma/dashboard'), item('▤', 'Oglasi', '/firma/oglasi'), item('+', 'Novi', '/firma/novi-oglas'), item('☷', 'Izbor', '/firma/ats'), out],
      candidate: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('□', 'Biogr.', '/profil/cv'), item('✉', 'Prijave', '/profil/prijave'), out],
      admin: [item('⌂', 'Pregled', '/admin/dashboard'), item('€', 'Uplate', '/admin/uplate'), item('✓', 'Oglasi', '/admin/oglasi'), item('☷', 'Ljudi', '/admin/korisnici'), out],
      guest: [item('⌂', 'Početna', '/'), item('⌕', 'Oglasi', '/oglasi'), item('▦', 'Firme', '/firme'), item('+', 'Firma', '/login?mode=signup&role=company'), item('↪', 'Prijava', '/login?mode=signin')]
    };
    const html = (menus[me.role] || menus.guest).join('');
    if (nav.innerHTML !== html) nav.innerHTML = html;
  }

  function renderLogin(me) {
    if (route() !== '/login') return;
    const root = app();
    if (!root) return;
    const mode = query().get('mode') || 'signin';
    const role = query().get('role') === 'company' ? 'company' : 'candidate';
    const key = `login:${mode}:${role}:${me.role}:${me.email}`;
    if (root.dataset.stableView === key) return;
    root.dataset.stableView = key;
    if (me.role !== 'guest') {
      root.innerHTML = `<section class="auth-shell"><span class="page-label">Nalog</span><h1>Već ste prijavljeni.</h1><p>Trenutno koristite nalog: <strong>${roleNames[me.role]}</strong>${me.email ? `, ${me.email}` : ''}. Možete nastaviti na svoj pregled ili se odjaviti.</p><div class="auth-actions"><a class="btn blue" href="#${roleHomes[me.role] || '/'}">Otvori moj pregled</a><button class="btn red" data-stable-signout>Odjava</button></div></section>`;
      return;
    }
    if (mode === 'choose-role') {
      root.innerHTML = `<section class="auth-shell"><span class="page-label">Novi nalog</span><h1>Koji nalog želiš?</h1><p>Izaberi ulogu prije formulara. Kandidat traži posao. Firma objavljuje oglase i pregleda prijave.</p><div class="auth-role-grid"><a class="auth-role-card" href="#/login?mode=signup&role=candidate"><span>Kandidat</span><h2>Tražim posao</h2><p>Za prijave na oglase, biografiju i praćenje statusa.</p></a><a class="auth-role-card" href="#/login?mode=signup&role=company"><span>Firma</span><h2>Zapošljavam</h2><p>Za objavu oglasa, profil firme i selekciju prijava.</p></a></div><div class="auth-actions"><a class="btn ghost" href="#/login?mode=signin">Imam nalog</a></div></section>`;
      return;
    }
    if (mode === 'signup') {
      root.innerHTML = `<section class="auth-shell auth-two"><div><span class="page-label">Registracija</span><h1>${role === 'company' ? 'Nalog firme' : 'Nalog kandidata'}</h1><p>${role === 'company' ? 'Koristi se za profil firme, oglase i pregled prijava.' : 'Koristi se za biografiju, prijave i praćenje statusa oglasa.'}</p><div class="auth-actions"><a class="btn ghost" href="#/login?mode=choose-role">Promijeni ulogu</a><a class="btn ghost" href="#/login?mode=signin">Imam nalog</a></div></div><form class="auth-form" data-stable-auth="signup"><input type="hidden" name="role" value="${role}"><label><span class="label">E-pošta</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn blue">Kreiraj nalog</button><p>Lozinka treba da ima najmanje 8 znakova.</p></form></section>`;
      return;
    }
    root.innerHTML = `<section class="auth-shell auth-two"><div><span class="page-label">Prijava</span><h1>Uđi na svoj nalog.</h1><p>Unesi e-poštu i lozinku. Sistem sam otvara pregled koji pripada tvojoj ulozi: kandidat, firma ili upravljanje.</p><div class="auth-actions"><a class="btn lime" href="#/login?mode=choose-role">Kreiraj nalog</a></div></div><form class="auth-form" data-stable-auth="signin"><label><span class="label">E-pošta</span><input class="field" name="email" type="email" autocomplete="email" required></label><label><span class="label">Lozinka</span><input class="field" name="password" type="password" autocomplete="current-password" required></label><button class="btn blue">Prijavi se</button><button type="button" class="btn ghost sm" data-stable-reset>Zaboravljena lozinka</button><p>Upravljanje se ne bira javno. Sistem sam otvara taj dio samo nalogu koji već ima tu ulogu u bazi.</p></form></section>`;
  }

  function gateProtectedRoutes(me) {
    const path = route();
    const root = app();
    if (!root) return;
    const deny = (message, href) => {
      const key = `gate:${path}:${me.role}`;
      if (root.dataset.stableView === key) return;
      root.dataset.stableView = key;
      root.innerHTML = `<section class="auth-gate"><span class="kicker">Pristup nalogu</span><h1>Ova stranica nije dostupna za ovaj nalog</h1><p>${message}</p><div class="actions"><a class="btn blue" href="${href}">Nastavi</a><a class="btn ghost" href="#/">Početna</a></div></section>`;
    };
    if (path.startsWith('/firma/') && me.role !== 'company') deny(me.role === 'guest' ? 'Za ovaj dio treba prijava firme.' : 'Ovaj dio mogu koristiti samo firme.', me.role === 'guest' ? '#/login?mode=signin' : `#${roleHomes[me.role] || '/'}`);
    if (path.startsWith('/profil/') && me.role !== 'candidate') deny(me.role === 'guest' ? 'Za ovaj dio treba prijava kandidata.' : 'Ovaj dio mogu koristiti samo kandidati.', me.role === 'guest' ? '#/login?mode=signin' : `#${roleHomes[me.role] || '/'}`);
    if (path.startsWith('/admin/') && me.role !== 'admin') deny('Ovaj dio nije javno dostupan.', me.role === 'guest' ? '#/login?mode=signin' : `#${roleHomes[me.role] || '/'}`);
  }

  function stabilizeSelectionIntro() {
    if (route() !== '/firma/ats') return;
    const root = app();
    if (!root) return;
    const intros = [...root.querySelectorAll('.selection-intro')];
    intros.forEach((intro, index) => {
      if (index === 0) intro.dataset.selectionIntro = 'true';
      else intro.remove();
    });
    if (!root.querySelector('[data-selection-intro]')) {
      const intro = document.createElement('section');
      intro.className = 'selection-intro';
      intro.dataset.selectionIntro = 'true';
      intro.innerHTML = `<span class="kicker">Selekcija prijava</span><h1>Pregled kandidata po fazama</h1><p>Ovdje firma vidi pristigle prijave i vodi ih kroz faze: nova prijava, pregled, razgovor, uži izbor, ponuda, zaposlen ili odbijeno.</p>`;
      root.prepend(intro);
    }
  }

  async function run() {
    const me = await account();
    const key = `${me.role}:${me.email}:${route()}:${location.hash}`;
    setAccountChrome(me);
    setMobileNav(me);
    renderLogin(me);
    gateProtectedRoutes(me);
    stabilizeSelectionIntro();
    lastAccountKey = key;
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-stable-auth]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const role = String(data.get('role') || 'candidate');
    try {
      if (form.dataset.stableAuth === 'signup') {
        const result = await db().auth.signUp({ email, password, options: { data: { role } } });
        if (result.error) throw result.error;
        toast('Nalog je kreiran. Sada se prijavi.');
        location.hash = '/login?mode=signin';
      } else {
        const result = await db().auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        const me = await account();
        toast('Prijava uspješna.');
        location.hash = roleHomes[me.role] || '/';
      }
    } catch (error) {
      const message = String(error?.message || 'Akcija nije uspjela. Pokušaj ponovo.');
      toast(/invalid login credentials/i.test(message) ? 'E-pošta ili lozinka nisu tačni.' : message);
    }
  }, true);

  document.addEventListener('click', async (event) => {
    const signout = event.target.closest('[data-stable-signout],[data-signout-anywhere],[data-signout]');
    if (signout) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await db()?.auth?.signOut();
      toast('Odjavljeni ste.');
      location.hash = '/';
      return;
    }
    const reset = event.target.closest('[data-stable-reset]');
    if (reset) {
      event.preventDefault();
      const email = reset.closest('form')?.querySelector('input[name="email"]')?.value?.trim();
      if (!email) return toast('Prvo upišite e-poštu.');
      const result = await db().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}#/login?mode=signin` });
      if (result.error) return toast(result.error.message);
      toast('Poslali smo link za promjenu lozinke.');
    }
  }, true);

  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(run, 120); };
  window.addEventListener('DOMContentLoaded', () => [80, 400, 1000].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => { document.querySelector('#app')?.removeAttribute('data-stable-view'); schedule(); setTimeout(run, 500); });
  db()?.auth?.onAuthStateChange(() => { document.querySelector('#app')?.removeAttribute('data-stable-view'); setTimeout(run, 120); });
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();

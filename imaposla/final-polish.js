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
    root.querySelectorAll('.kanban-column h4,.kanban-head h4').forEach((heading) => {
      const text = heading.textContent.trim().toLowerCase();
      if (text === 'novo' || text === 'new') heading.textContent = 'Nove prijave';
      if (text.includes('review') || text.includes('pregled')) heading.textContent = 'Pregled';
      if (text.includes('interview') || text.includes('razgovor')) heading.textContent = 'Razgovor';
      if (text.includes('short') || text.includes('uži')) heading.textContent = 'Uži izbor';
      if (text.includes('offer') || text.includes('ponuda')) heading.textContent = 'Ponuda';
      if (text.includes('hired') || text.includes('zaposlen')) heading.textContent = 'Zaposlen';
      if (text.includes('reject') || text.includes('odbij')) heading.textContent = 'Odbijeno';
    });
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
    document.querySelectorAll('.sidebar a,.side-nav a,.account-sidebar a').forEach((link) => {
      const text = link.textContent.trim();
      if (text === 'Dashboard') link.textContent = 'Pregled';
      if (text === 'ATS') link.textContent = 'Selekcija';
      if (text === 'CV profil') link.textContent = 'Biografija';
    });
  }

  function gateContent(message, actionHref = '#/login') {
    const root = app();
    if (!root || root.querySelector('[data-auth-gate]')) return;
    root.innerHTML = `<section class="auth-gate" data-auth-gate><span class="kicker">Pristup nalogu</span><h1>Ova stranica nije dostupna za ovaj nalog</h1><p>${message}</p><div class="actions"><a class="btn blue" href="${actionHref}">Nastavi</a><a class="btn ghost" href="#/">Početna</a></div></section>`;
  }

  async function enforceRoleAccess(role) {
    const path = currentPath();
    if (path.startsWith('/firma/') && role !== 'company') {
      gateContent(role === 'guest' ? 'Za ovaj dio treba prijava firme.' : 'Ovaj dio mogu koristiti samo firme.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
    }
    if (path.startsWith('/profil/') && role !== 'candidate') {
      gateContent(role === 'guest' ? 'Za ovaj dio treba prijava kandidata.' : 'Ovaj dio mogu koristiti samo kandidati.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
    }
    if (path.startsWith('/admin/') && role !== 'admin') {
      gateContent('Ovaj dio nije javno dostupan.', role === 'guest' ? '#/login?mode=signin' : `#${roleHome[role] || '/'}`);
    }
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

  async function runPolish() {
    const account = await getAccount();
    translateVisibleText(document.body);
    improveSelectionPage();
    setMobileNav(account.role);
    setAccountState(account.role, account.email);
    hideWrongRoleLinks(account.role);
    await enforceRoleAccess(account.role);
    bindSignout();
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

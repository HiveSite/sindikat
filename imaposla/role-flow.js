(() => {
  const db = () => window.imaposlaSupabase;
  const setRoleFlag = (value) => {
    document.documentElement.dataset.userRole = value || 'guest';
    document.documentElement.dataset.roleReady = 'true';
  };
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.roleFlowToastTimer);
    window.roleFlowToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
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

  async function signOutFully() {
    const client = db();
    document.querySelector('[data-mobile-menu]')?.classList.remove('open');
    try { await client?.auth?.signOut(); } catch (error) { console.warn(error); }
    if (typeof state !== 'undefined') {
      state.session = null;
      state.user = null;
      state.profile = null;
      state.myCompany = null;
      state.applications = [];
      state.adminProfiles = [];
      state.orders = [];
      state.banners = [];
      if (typeof loadData === 'function') await loadData();
    }
    setRoleFlag('guest');
    document.querySelectorAll('[data-account-state]').forEach((node) => node.remove());
    document.querySelectorAll('a[href="#/login?mode=signup&role=company"], a[href="#/za-firme"]').forEach((node) => {
      node.hidden = false;
      node.style.display = '';
    });
    const loginButton = document.querySelector('[data-action="open-login"]');
    if (loginButton) loginButton.hidden = false;
    const pill = document.querySelector('[data-role-pill]');
    if (pill) pill.textContent = 'Niste prijavljeni';
    if (location.hash !== '#/' && location.hash !== '') location.hash = '/';
    if (typeof render === 'function') render();
    setTimeout(() => { if (typeof render === 'function') render(); }, 120);
    toast('Odjavljeni ste.');
  }

  function removeCandidateCompanyActions() {
    if (document.documentElement.dataset.userRole !== 'candidate') return;
    document.querySelectorAll('a[href="#/login?mode=signup&role=company"], a[href="#/za-firme"]').forEach((node) => {
      node.hidden = true;
      node.style.display = 'none';
    });
    if ((location.hash.replace('#', '') || '/') === '/za-firme') location.hash = '/firme';
  }

  async function run() {
    const role = await currentRole();
    setRoleFlag(role);
    removeCandidateCompanyActions();
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-signout]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await signOutFully();
  }, true);

  window.addEventListener('DOMContentLoaded', () => [80, 420].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [80, 360].forEach((ms) => setTimeout(run, ms)));
  db()?.auth?.onAuthStateChange(() => setTimeout(run, 120));
})();

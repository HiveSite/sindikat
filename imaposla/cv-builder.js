(() => {
  const KEY = 'imaposlaCvBuilder';
  const appRoot = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const db = () => window.imaposlaSupabase;
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.cvBuilderToastTimer);
    window.cvBuilderToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  const emptyCv = {
    fullName: '', title: '', city: '', phone: '', email: '', summary: '',
    skills: '', languages: '', experience: '', education: '', certificates: '', availability: ''
  };
  let remoteLoadedFor = '';
  let saveTimer = null;
  let saving = false;

  function normalizeCv(data = {}) {
    const cv = { ...emptyCv, ...data };
    Object.keys(cv).forEach((key) => { cv[key] = String(cv[key] || '').slice(0, 6000); });
    return cv;
  }

  function loadCv() {
    try { return normalizeCv(JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch { return { ...emptyCv }; }
  }

  function saveLocalCv(data) {
    const cv = normalizeCv({ ...loadCv(), ...data });
    localStorage.setItem(KEY, JSON.stringify(cv));
    return cv;
  }

  async function currentUser() {
    try {
      const client = db();
      if (!client?.auth) return null;
      const { data } = await client.auth.getSession();
      return data?.session?.user || null;
    } catch { return null; }
  }

  function setStatus(message) {
    const el = document.querySelector('[data-cv-sync-status]');
    if (el) el.textContent = message;
  }

  async function loadRemoteCv() {
    if (route() !== '/profil/cv') return;
    const client = db();
    const user = await currentUser();
    if (!client?.from || !user?.id || remoteLoadedFor === user.id) return;
    remoteLoadedFor = user.id;
    setStatus('Učitavanje biografije iz profila...');
    const { data, error } = await client.from('profiles').select('cv_data,full_name,phone,city,email').eq('id', user.id).maybeSingle();
    if (error) {
      setStatus('Biografija je sačuvana lokalno. Pokreni novi Supabase SQL za čuvanje u profilu.');
      return;
    }
    const remote = normalizeCv({
      ...(data?.cv_data || {}),
      fullName: data?.cv_data?.fullName || data?.full_name || '',
      phone: data?.cv_data?.phone || data?.phone || '',
      city: data?.cv_data?.city || data?.city || '',
      email: data?.cv_data?.email || data?.email || user.email || ''
    });
    const hasRemote = Object.values(remote).some(Boolean);
    if (hasRemote) saveLocalCv(remote);
    setStatus(hasRemote ? 'Biografija je učitana iz profila.' : 'Još nema sačuvane biografije u profilu.');
    renderBuilder(false);
  }

  async function saveRemoteCv(cv, silent = false) {
    const client = db();
    const user = await currentUser();
    if (!client?.from || !user?.id) {
      setStatus('Sačuvano lokalno. Prijavi se da bi biografija bila u profilu.');
      return false;
    }
    if (saving) return false;
    saving = true;
    setStatus('Čuvanje u profilu...');
    const profilePatch = {
      cv_data: normalizeCv(cv),
      cv_updated_at: new Date().toISOString(),
      full_name: cv.fullName || null,
      phone: cv.phone || null,
      city: cv.city || null
    };
    const { error } = await client.from('profiles').update(profilePatch).eq('id', user.id);
    saving = false;
    if (error) {
      setStatus('Sačuvano lokalno. Pokreni Supabase SQL za polje biografije.');
      if (!silent) toast(error.message || 'Biografija nije sačuvana u bazi.');
      return false;
    }
    setStatus('Sačuvano u profilu.');
    if (!silent) toast('Biografija je sačuvana u profilu.');
    return true;
  }

  function scheduleRemoteSave(cv) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveRemoteCv(cv, true), 900);
  }

  function field(name, label, placeholder = '', type = 'text') {
    const cv = loadCv();
    const value = cv[name] || '';
    if (type === 'textarea') return `<label><span class="label">${label}</span><textarea class="textarea" name="${name}" placeholder="${placeholder}">${escapeHtml(value)}</textarea></label>`;
    return `<label><span class="label">${label}</span><input class="field" name="${name}" value="${escapeHtml(value)}" placeholder="${placeholder}"></label>`;
  }

  function cvPreview(cv = loadCv()) {
    const chips = (cv.skills || '').split(',').map(s => s.trim()).filter(Boolean).map(s => `<span>${escapeHtml(s)}</span>`).join('');
    const block = (title, text) => text ? `<section><h3>${title}</h3><p>${escapeHtml(text).replace(/\n/g, '<br>')}</p></section>` : '';
    return `<article class="cv-preview" data-cv-preview>
      <header><div><span>Biografija</span><h2>${escapeHtml(cv.fullName || 'Ime i prezime')}</h2><p>${escapeHtml(cv.title || 'Pozicija / zanimanje')}</p></div><aside>${escapeHtml(cv.city || 'Grad')}<br>${escapeHtml(cv.phone || 'Telefon')}<br>${escapeHtml(cv.email || 'E-pošta')}</aside></header>
      ${block('Kratak opis', cv.summary)}
      ${chips ? `<section><h3>Vještine</h3><div class="cv-skill-list">${chips}</div></section>` : ''}
      ${block('Iskustvo', cv.experience)}
      ${block('Obrazovanje', cv.education)}
      ${block('Jezici', cv.languages)}
      ${block('Sertifikati i obuke', cv.certificates)}
      ${block('Dostupnost', cv.availability)}
    </article>`;
  }

  function renderBuilder(shouldLoadRemote = true) {
    const root = appRoot();
    if (!root || route() !== '/profil/cv') return;
    const cv = loadCv();
    root.innerHTML = `<section class="cv-builder-page">
      <div class="cv-builder-head"><div><span class="page-label">Biografija</span><h1>Napravi radnu biografiju bez slanja fajlova.</h1><p>Popuni podatke jednom, pregledaj kako izgleda i skini PDF direktno iz sajta. Prijave koriste biografiju iz profila, bez čuvanja tuđih dokumenata i zauzimanja prostora.</p></div><div class="cv-head-actions"><button class="btn blue" data-cv-print>Skini PDF</button><button class="btn ghost" data-cv-clear>Očisti</button></div></div>
      <div class="cv-builder-grid">
        <form class="cv-builder-form" data-cv-form>
          <div class="form-grid">${field('fullName', 'Ime i prezime', 'npr. Marko Marković')}${field('title', 'Zanimanje', 'npr. Konobar, recepcioner, programer')}</div>
          <div class="form-grid">${field('city', 'Grad', 'npr. Podgorica')}${field('phone', 'Telefon', '+382 ...')}</div>
          ${field('email', 'E-pošta', 'ime@email.com')}
          ${field('summary', 'Kratak opis', 'Ko si, šta znaš i kakav posao tražiš.', 'textarea')}
          ${field('skills', 'Vještine', 'Odvoji zarezom: rad sa gostima, engleski, kasa...', 'textarea')}
          ${field('experience', 'Radno iskustvo', 'Firma, pozicija, period i najvažnije odgovornosti.', 'textarea')}
          ${field('education', 'Obrazovanje', 'Škola, kurs, fakultet ili praktična obuka.', 'textarea')}
          ${field('languages', 'Jezici', 'npr. Srpski maternji, engleski B2...', 'textarea')}
          ${field('certificates', 'Sertifikati i obuke', 'Kursevi, licence, obuke.', 'textarea')}
          ${field('availability', 'Dostupnost', 'Od kada možeš da počneš, smjene, sezona...', 'textarea')}
          <div class="cv-save-row"><button class="btn lime">Sačuvaj biografiju</button><span data-cv-sync-status>Čuva se u profilu i u browseru kao rezervna kopija.</span></div>
        </form>
        <div class="cv-preview-wrap"><div class="cv-preview-toolbar"><strong>Pregled</strong><button class="btn ghost sm" data-cv-print>Skini PDF</button></div>${cvPreview(cv)}</div>
      </div>
    </section>`;
    if (shouldLoadRemote) setTimeout(loadRemoteCv, 60);
  }

  function printCv() {
    const cv = loadCv();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Biografija - ${escapeHtml(cv.fullName || 'Kandidat')}</title><style>body{font-family:Arial,sans-serif;color:#171717;margin:0;padding:28px}.cv-preview{max-width:780px;margin:auto}.cv-preview header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #111;padding-bottom:18px;margin-bottom:20px}.cv-preview h2{font-size:34px;margin:4px 0}.cv-preview h3{font-size:15px;margin:20px 0 6px;text-transform:uppercase}.cv-preview p{line-height:1.55}.cv-skill-list{display:flex;flex-wrap:wrap;gap:8px}.cv-skill-list span{border:1px solid #111;border-radius:999px;padding:6px 10px}@media print{button{display:none}}</style></head><body>${cvPreview(cv)}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}<\/script></body></html>`;
    const win = window.open('', '_blank');
    if (!win) return toast('Browser je blokirao PDF prozor. Dozvoli otvaranje prozora za ovaj sajt.');
    win.document.open(); win.document.write(html); win.document.close();
  }

  function removeFileUploadFromApplications() {
    const fileLabel = document.querySelector('.file-input');
    if (fileLabel) fileLabel.remove();
    const button = document.querySelector('[data-submit-application]');
    if (!button || document.querySelector('[data-cv-apply-note]')) return;
    const note = document.createElement('p');
    note.className = 'notice';
    note.dataset.cvApplyNote = 'true';
    note.innerHTML = 'Prijava koristi biografiju iz profila. Fajlovi se ne šalju i ne čuvaju, da prostor ne ide na tuđe dokumente.';
    button.before(note);
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-cv-form]');
    if (!form) return;
    event.preventDefault();
    const cv = saveLocalCv(Object.fromEntries(new FormData(form)));
    await saveRemoteCv(cv);
    renderBuilder(false);
  });

  document.addEventListener('input', (event) => {
    const form = event.target.closest('[data-cv-form]');
    if (!form) return;
    const cv = saveLocalCv(Object.fromEntries(new FormData(form)));
    scheduleRemoteSave(cv);
    const wrap = document.querySelector('.cv-preview-wrap');
    if (wrap) wrap.querySelector('[data-cv-preview]')?.replaceWith(document.createRange().createContextualFragment(cvPreview(cv)));
  });

  document.addEventListener('click', async (event) => {
    if (event.target.closest('[data-cv-print]')) { event.preventDefault(); printCv(); }
    if (event.target.closest('[data-cv-clear]')) {
      event.preventDefault();
      if (!confirm('Očistiti biografiju?')) return;
      localStorage.removeItem(KEY);
      await saveRemoteCv({ ...emptyCv }, true);
      renderBuilder(false);
    }
  });

  function run() {
    if (route() === '/profil/cv') {
      if (!document.querySelector('[data-cv-form]')) renderBuilder();
      else loadRemoteCv();
    }
    removeFileUploadFromApplications();
  }

  window.addEventListener('DOMContentLoaded', () => [100, 600, 1400].forEach(ms => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => { remoteLoadedFor = ''; [80, 400, 1000].forEach(ms => setTimeout(run, ms)); });
  new MutationObserver(() => setTimeout(run, 60)).observe(document.documentElement, { childList: true, subtree: true });
})();

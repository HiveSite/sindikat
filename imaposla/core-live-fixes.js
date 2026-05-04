(() => {
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.coreLiveToastTimer);
    window.coreLiveToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };

  const hasCore = () => typeof db !== 'undefined' && typeof state !== 'undefined' && typeof safeQuery === 'function';
  const hasCvData = (profile) => {
    const cv = profile?.cv_data || {};
    return Boolean(cv.summary || cv.experience || cv.skills || profile?.full_name || profile?.phone || profile?.city);
  };
  const activeJobList = () => (state.jobs || []).filter((job) => job.status === 'active');

  function stableHomeHtml() {
    const jobs = activeJobList().slice(0, 3);
    const currentRole = role();
    const action = currentRole === 'company'
      ? ['Pregled firme', '#/firma/dashboard']
      : currentRole === 'candidate'
        ? ['Moje prijave', '#/profil/prijave']
        : currentRole === 'admin'
          ? ['Upravljanje', '#/admin/dashboard']
          : ['Prijava', '#/login?mode=signin'];
    const jobCards = jobs.map((job) => `<a class="live-job" href="#/oglasi/${slug(job.title)}-${job.id}"><span class="kicker">${h(job.city || 'Crna Gora')}</span><h3>${h(job.title)}</h3><p>${h(job.company || 'Firma')} · ${h(job.category || 'Kategorija')} · ${h(job.type || 'Dogovor')}</p><strong>${h(job.salary || 'Plata po dogovoru')}</strong></a>`).join('');
    return `<section class="live-home">
      <div class="live-hero">
        <span class="page-label">imaposla.me</span>
        <h1>Posao i zapošljavanje u Crnoj Gori, jasno od prvog klika.</h1>
        <p>Kandidat pretražuje oglase, pravi biografiju i šalje prijavu. Firma objavljuje oglas, prati prijave i vodi selekciju. Javni prikaz prolazi provjeru da platforma ostane uredna.</p>
        <form class="live-search" data-live-search><input class="field" name="q" placeholder="Naziv posla, firma ili vještina" autocomplete="off"><button class="btn blue">Traži posao</button></form>
        <div class="live-actions"><a class="btn lime" href="#/oglasi">Tražim posao</a><a class="btn blue" href="#/login?mode=signup&role=company">Zapošljavam</a><a class="btn ghost" href="${action[1]}">${action[0]}</a></div>
      </div>
      <div class="live-paths">
        <a class="live-path" href="#/oglasi"><span>Kandidat</span><h2>Pronađi posao</h2><p>Otvori oglas, pročitaj uslove, dopuni biografiju i pošalji prijavu bez upload fajlova.</p><strong>Otvori oglase</strong></a>
        <a class="live-path" href="#/login?mode=signup&role=company"><span>Firma</span><h2>Objavi oglas</h2><p>Napravi profil firme, pošalji oglas na pregled i vodi kandidate kroz selekciju.</p><strong>Kreni kao firma</strong></a>
      </div>
      <div class="live-section-head"><div><span class="kicker">Aktivno</span><h2>Najnoviji oglasi</h2><p>Prikazuju se samo oglasi koji su odobreni i aktivni.</p></div><a class="btn ghost sm" href="#/oglasi">Svi oglasi</a></div>
      <div class="live-jobs">${jobs.length ? jobCards : `<div class="empty home-empty"><h3>Još nema aktivnih oglasa</h3><p>Kada firma pošalje oglas i upravljanje ga odobri, pojaviće se ovdje.</p><div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a><a class="btn lime" href="#/login?mode=signup&role=company">Objavi oglas</a></div></div>`}</div>
    </section>`;
  }

  function installCoreOverrides() {
    if (!hasCore() || window.coreLiveFixesInstalled) return;
    window.coreLiveFixesInstalled = true;

    home = function stableHome() {
      app().innerHTML = stableHomeHtml();
    };

    loadPublicJobs = async function loadPublicJobsStable() {
      const data = await safeQuery(() => db.from('jobs')
        .select('id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities(id,name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }));
      state.jobs = data.map(j => ({ id: j.id, title: j.title, slug: j.slug, companyId: j.company_id, company: j.companies?.name || 'Poslodavac', logo: initials(j.companies?.name), city: j.cities?.name || 'Crna Gora', cityId: j.cities?.id, category: j.categories?.name || 'Ostalo', categoryId: j.categories?.id, type: j.contract_type || 'Po dogovoru', salary: j.salary_text || 'Po dogovoru', deadline: j.deadline, status: j.status, featured: Boolean(j.featured), description: j.description || '' }));
    };

    loadPublicCompanies = async function loadPublicCompaniesStable() {
      const data = await safeQuery(() => db.from('companies').select('*').eq('approved', true).order('created_at', { ascending: false }));
      state.companies = data.map(c => ({ id: c.id, name: c.name, slug: c.slug, logo: initials(c.name), city: c.city || 'Crna Gora', industry: c.industry || 'Poslodavac', approved: c.approved, about: c.description || 'Profil poslodavca.' }));
    };

    loadData = async function loadDataStable() {
      await Promise.all([loadLookups(), loadPublicJobs(), loadPublicCompanies(), loadPlans()]);
      state.profile = null; state.myCompany = null; state.applications = []; state.adminProfiles = []; state.orders = []; state.banners = [];
      if (!state.user) return;
      state.profile = await safeQuery(() => db.from('profiles').select('*').eq('id', state.user.id).maybeSingle(), null);
      if (state.profile?.role === 'company') {
        state.myCompany = await safeQuery(() => db.from('companies').select('*').eq('owner_id', state.user.id).maybeSingle(), null);
        if (state.myCompany) {
          state.applications = await safeQuery(() => db.from('job_applications').select('*,jobs!inner(title,company_id),profiles(full_name,email,phone,city,cv_data,cv_updated_at)').eq('jobs.company_id', state.myCompany.id).order('created_at', { ascending: false }));
          state.orders = await safeQuery(() => db.from('orders').select('*,plans(name)').eq('company_id', state.myCompany.id).order('created_at', { ascending: false }));
          state.banners = await safeQuery(() => db.from('banners').select('*').eq('company_id', state.myCompany.id).order('created_at', { ascending: false }));
        }
      }
      if (state.profile?.role === 'candidate') {
        state.applications = await safeQuery(() => db.from('job_applications').select('*,jobs(title,companies(name))').eq('candidate_id', state.user.id).order('created_at', { ascending: false }));
      }
      if (state.profile?.role === 'admin') {
        const [profiles, apps, orders, banners] = await Promise.all([
          safeQuery(() => db.from('profiles').select('*').order('created_at', { ascending: false })),
          safeQuery(() => db.from('job_applications').select('*,jobs(title),profiles(full_name,email,phone,city,cv_data,cv_updated_at)').order('created_at', { ascending: false })),
          safeQuery(() => db.from('orders').select('*,plans(name),companies(name)').order('created_at', { ascending: false })),
          safeQuery(() => db.from('banners').select('*,companies(name)').order('created_at', { ascending: false }))
        ]);
        state.adminProfiles = profiles; state.applications = apps; state.orders = orders; state.banners = banners;
      }
    };

    stageActions = function stageActionsStable(a) {
      const idx = stageOrder.indexOf(a.stage);
      return `<div class="actions stage-actions" style="margin:0"><button class="btn ghost xs" data-stage-prev="${a.id}" ${idx <= 0 ? 'disabled' : ''}>Nazad</button><button class="btn blue xs" data-stage-next="${a.id}" ${idx < 0 || idx >= stageOrder.length - 2 ? 'disabled' : ''}>Dalje</button><button class="btn red xs" data-stage-reject="${a.id}" ${a.stage === 'rejected' ? 'disabled' : ''}>Odbij</button></div>`;
    };
  }

  async function markDuplicateApplication() {
    if (!hasCore() || state.profile?.role !== 'candidate') return;
    const button = document.querySelector('[data-submit-application]');
    if (!button) return;
    const jobId = Number(button.dataset.submitApplication);
    const existing = await safeQuery(() => db.from('job_applications').select('id').eq('job_id', jobId).eq('candidate_id', state.user.id).maybeSingle(), null);
    if (existing?.id) {
      button.disabled = true;
      button.textContent = 'Već ste poslali prijavu';
      const note = document.querySelector('.form-card .notice');
      if (note) note.textContent = 'Za ovaj oglas već postoji vaša prijava. Status pratite u “Moje prijave”.';
      return;
    }
    if (!hasCvData(state.profile)) {
      const note = document.querySelector('.form-card .notice');
      if (note) note.textContent = 'Prije prijave dopuni biografiju u profilu. Firma dobija podatke iz tvoje biografije, bez slanja fajla.';
    }
  }

  function cleanApplicationForm() {
    const file = document.querySelector('.file-input');
    if (file) file.remove();
    const button = document.querySelector('[data-submit-application]');
    if (button && !document.querySelector('[data-cv-apply-note]')) {
      const note = document.createElement('p');
      note.className = 'notice';
      note.dataset.cvApplyNote = 'true';
      note.textContent = 'Prijava koristi biografiju iz profila. Fajlovi se ne šalju i ne čuvaju.';
      button.before(note);
    }
  }

  document.addEventListener('click', async (event) => {
    const reject = event.target.closest('[data-stage-reject]');
    if (reject && hasCore()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const { error } = await db.from('job_applications').update({ stage: 'rejected' }).eq('id', Number(reject.dataset.stageReject));
      if (error) return toast(error.message);
      await loadData();
      toast('Prijava je označena kao odbijena.');
      render();
      return;
    }
    const submit = event.target.closest('[data-submit-application]');
    if (submit && hasCore()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!requireAuth('candidate')) return;
      const jobId = Number(submit.dataset.submitApplication);
      const existing = await safeQuery(() => db.from('job_applications').select('id').eq('job_id', jobId).eq('candidate_id', state.user.id).maybeSingle(), null);
      if (existing?.id) return toast('Već ste poslali prijavu za ovaj oglas.');
      const profile = await safeQuery(() => db.from('profiles').select('full_name,phone,city,cv_data').eq('id', state.user.id).maybeSingle(), state.profile);
      if (!hasCvData(profile)) return toast('Prvo dopuni biografiju u profilu, pa pošalji prijavu.');
      const { error } = await db.from('job_applications').insert({ job_id: jobId, candidate_id: state.user.id, cover_letter: document.querySelector('#coverLetter')?.value || '', cv_path: null, reference_code: 'IP-' + Date.now() });
      if (error) return toast(error.message);
      await loadData();
      toast('Prijava je poslata.');
      location.hash = '/profil/prijave';
    }
  }, true);

  function runLightGuards() {
    installCoreOverrides();
    cleanApplicationForm();
    markDuplicateApplication();
  }

  installCoreOverrides();
  window.addEventListener('DOMContentLoaded', () => [0, 80, 300, 900].forEach(ms => setTimeout(runLightGuards, ms)));
  window.addEventListener('hashchange', () => [40, 180, 500].forEach(ms => setTimeout(runLightGuards, ms)));
})();

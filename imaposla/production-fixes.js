(() => {
  const CV_MAX_BYTES = 5 * 1024 * 1024;
  const slugText = (v) => String(v || 'oglas').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'oglas';
  const showToast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.productionToastTimer);
    window.productionToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };

  function hasCore() {
    return typeof db !== 'undefined' && typeof state !== 'undefined' && typeof safeQuery === 'function';
  }

  function installDataOverrides() {
    if (!hasCore() || window.productionFixesInstalled) return;
    window.productionFixesInstalled = true;

    loadPublicJobs = async function loadPublicJobsFixed() {
      const data = await safeQuery(() => db.from('jobs')
        .select('id,title,slug,description,contract_type,salary_text,deadline,status,featured,company_id,companies(id,name,slug),categories(id,name),cities(id,name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }));
      state.jobs = data.map(j => ({
        id: j.id,
        title: j.title,
        slug: j.slug,
        companyId: j.company_id,
        company: j.companies?.name || 'Poslodavac',
        logo: initials(j.companies?.name),
        city: j.cities?.name || 'Crna Gora',
        cityId: j.cities?.id,
        category: j.categories?.name || 'Ostalo',
        categoryId: j.categories?.id,
        type: j.contract_type || 'Po dogovoru',
        salary: j.salary_text || 'Po dogovoru',
        deadline: j.deadline,
        status: j.status,
        featured: Boolean(j.featured),
        description: j.description || ''
      }));
    };

    loadPublicCompanies = async function loadPublicCompaniesFixed() {
      const data = await safeQuery(() => db.from('companies').select('*').eq('approved', true).order('created_at', { ascending: false }));
      state.companies = data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: initials(c.name),
        city: c.city || 'Crna Gora',
        industry: c.industry || 'Poslodavac',
        approved: c.approved,
        about: c.description || 'Profil poslodavca.'
      }));
    };

    loadData = async function loadDataFixed() {
      await Promise.all([loadLookups(), loadPublicJobs(), loadPublicCompanies(), loadPlans()]);
      state.profile = null;
      state.myCompany = null;
      state.applications = [];
      state.adminProfiles = [];
      state.orders = [];
      state.banners = [];
      if (!state.user) return;

      state.profile = await safeQuery(() => db.from('profiles').select('*').eq('id', state.user.id).maybeSingle(), null);

      if (state.profile?.role === 'company') {
        state.myCompany = await safeQuery(() => db.from('companies').select('*').eq('owner_id', state.user.id).maybeSingle(), null);
        if (state.myCompany) {
          state.applications = await safeQuery(() => db.from('job_applications')
            .select('*,jobs!inner(title,company_id),profiles(full_name,email,phone,city)')
            .eq('jobs.company_id', state.myCompany.id)
            .order('created_at', { ascending: false }));
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
          safeQuery(() => db.from('job_applications').select('*,jobs(title),profiles(full_name,email)').order('created_at', { ascending: false })),
          safeQuery(() => db.from('orders').select('*,plans(name),companies(name)').order('created_at', { ascending: false })),
          safeQuery(() => db.from('banners').select('*,companies(name)').order('created_at', { ascending: false }))
        ]);
        state.adminProfiles = profiles;
        state.applications = apps;
        state.orders = orders;
        state.banners = banners;
      }
    };

    stageActions = function stageActionsFixed(a) {
      const idx = stageOrder.indexOf(a.stage);
      return `<div class="actions stage-actions" style="margin:0">
        <button class="btn ghost xs" data-stage-prev="${a.id}" ${idx <= 0 ? 'disabled' : ''}>Nazad</button>
        <button class="btn blue xs" data-stage-next="${a.id}" ${idx < 0 || idx >= stageOrder.length - 2 ? 'disabled' : ''}>Dalje</button>
        <button class="btn red xs" data-stage-reject="${a.id}" ${a.stage === 'rejected' ? 'disabled' : ''}>Odbij</button>
      </div>`;
    };

    const originalJobDetail = jobDetail;
    jobDetail = function jobDetailFixed(raw) {
      originalJobDetail(raw);
      setTimeout(markDuplicateApplications, 20);
    };

    loadData().then(() => {
      if (typeof render === 'function') render();
      fixHomeLatestJobs();
      addPasswordResetLink();
    });
  }

  async function fixHomeLatestJobs() {
    if (!hasCore() || (location.hash.replace('#', '') || '/').split('?')[0] !== '/') return;
    const grid = document.querySelector('.home-jobs-grid');
    if (!grid) return;
    const jobs = state.jobs.filter(j => j.status === 'active').slice(0, 3);
    const title = document.querySelector('.home-section-head p');
    if (title) title.textContent = 'Ovdje su samo aktivni i odobreni oglasi koji su spremni za kandidate.';
    grid.innerHTML = jobs.length ? jobs.map(job => `
      <a class="job-card" href="#/oglasi/${slugText(job.title)}-${job.id}">
        <span class="kicker">${h(job.city || 'Crna Gora')}</span>
        <h3>${h(job.title || 'Oglas za posao')}</h3>
        <p>${h(job.company || 'Firma')} · ${h(job.category || 'Kategorija')} · ${h(job.type || 'Dogovor')}</p>
        <strong>${h(job.salary || 'Plata po dogovoru')}</strong>
      </a>`).join('') : `<div class="empty home-empty"><h3>Još nema aktivnih oglasa</h3><p>Kada firma pošalje oglas i bude odobren, pojaviće se ovdje.</p><div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a><a class="btn lime" href="#/login?mode=signup&role=company">Objavi oglas</a></div></div>`;
  }

  function addPasswordResetLink() {
    if ((location.hash.replace('#', '') || '/').split('?')[0] !== '/login') return;
    const form = document.querySelector('[data-final-auth="signin"], [data-auth-form="signin"]');
    if (!form || form.querySelector('[data-reset-password]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn ghost sm';
    button.dataset.resetPassword = 'true';
    button.textContent = 'Zaboravljena lozinka';
    form.appendChild(button);
  }

  async function markDuplicateApplications() {
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
    }
  }

  document.addEventListener('click', async (event) => {
    const reject = event.target.closest('[data-stage-reject]');
    if (reject && hasCore()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const { error } = await db.from('job_applications').update({ stage: 'rejected' }).eq('id', Number(reject.dataset.stageReject));
      if (error) return showToast(error.message);
      await loadData();
      showToast('Prijava je označena kao odbijena.');
      render();
      return;
    }

    const reset = event.target.closest('[data-reset-password]');
    if (reset && db?.auth) {
      event.preventDefault();
      const form = reset.closest('form');
      const email = form?.querySelector('input[name="email"]')?.value?.trim();
      if (!email) return showToast('Prvo upišite e-poštu.');
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}#/login?mode=signin` });
      if (error) return showToast(error.message);
      showToast('Poslali smo link za promjenu lozinke.');
    }
  }, true);

  document.addEventListener('click', async (event) => {
    const submit = event.target.closest('[data-submit-application]');
    if (!submit || !hasCore()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!requireAuth('candidate')) return;
    const jobId = Number(submit.dataset.submitApplication);
    const existing = await safeQuery(() => db.from('job_applications').select('id').eq('job_id', jobId).eq('candidate_id', state.user.id).maybeSingle(), null);
    if (existing?.id) return showToast('Već ste poslali prijavu za ovaj oglas.');

    let cvPath = null;
    const file = document.querySelector('#cvFile')?.files?.[0];
    if (file) {
      if (file.size > CV_MAX_BYTES) return showToast('Biografija može biti najviše 5 MB.');
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (file.type && !allowed.includes(file.type)) return showToast('Biografija mora biti PDF, DOC ili DOCX.');
      const filePath = `${state.user.id}/${Date.now()}-${file.name}`;
      const upload = await db.storage.from('candidate-cv').upload(filePath, file, { upsert: false });
      if (upload.error) return showToast(upload.error.message);
      cvPath = filePath;
    }

    const row = {
      job_id: jobId,
      candidate_id: state.user.id,
      cover_letter: document.querySelector('#coverLetter')?.value || '',
      cv_path: cvPath,
      reference_code: 'IP-' + Date.now()
    };
    const { error } = await db.from('job_applications').insert(row);
    if (error) return showToast(error.message);
    await loadData();
    showToast('Prijava je poslata.');
    location.hash = '/profil/prijave';
  }, true);

  function run() {
    installDataOverrides();
    fixHomeLatestJobs();
    addPasswordResetLink();
    markDuplicateApplications();
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(run, 50);
    setTimeout(run, 700);
  });
  window.addEventListener('hashchange', () => setTimeout(run, 120));
  document.addEventListener('imaposla:rerender', run);
  setInterval(() => {
    if ((location.hash.replace('#', '') || '/').split('?')[0] === '/login') addPasswordResetLink();
  }, 1200);
})();

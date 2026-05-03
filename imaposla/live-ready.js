(() => {
  const client = () => window.imaposlaSupabase;
  const root = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const slug = (value) => String(value || 'oglas').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'oglas';
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.liveReadyToastTimer);
    window.liveReadyToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };

  async function account() {
    const db = client();
    if (!db?.auth) return { user: null, role: 'guest', profile: null, company: null };
    const { data } = await db.auth.getSession();
    const user = data?.session?.user || null;
    if (!user) return { user: null, role: 'guest', profile: null, company: null };
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const role = profile?.role || 'guest';
    let company = null;
    if (role === 'company') {
      const result = await db.from('companies').select('*').eq('owner_id', user.id).maybeSingle();
      company = result.data || null;
    }
    return { user, role, profile, company };
  }

  async function activeJobs(limit = 3) {
    const db = client();
    if (!db?.from) return [];
    const { data } = await db.from('jobs')
      .select('id,title,description,contract_type,salary_text,status,companies(name),categories(name),cities(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    return Array.isArray(data) ? data : [];
  }

  async function renderHome() {
    if (route() !== '/') return;
    const app = root();
    if (!app) return;
    const me = await account();
    const jobs = await activeJobs(3);
    const action = me.role === 'company' ? ['Pregled firme', '#/firma/dashboard'] : me.role === 'candidate' ? ['Moje prijave', '#/profil/prijave'] : me.role === 'admin' ? ['Upravljanje', '#/admin/dashboard'] : ['Prijava', '#/login?mode=signin'];
    app.innerHTML = `<section class="live-home">
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
      <div class="live-jobs">${jobs.length ? jobs.map((job) => `<a class="live-job" href="#/oglasi/${slug(job.title)}-${job.id}"><span class="kicker">${escapeHtml(job.cities?.name || 'Crna Gora')}</span><h3>${escapeHtml(job.title)}</h3><p>${escapeHtml(job.companies?.name || 'Firma')} · ${escapeHtml(job.categories?.name || 'Kategorija')} · ${escapeHtml(job.contract_type || 'Dogovor')}</p><strong>${escapeHtml(job.salary_text || 'Plata po dogovoru')}</strong></a>`).join('') : `<div class="empty home-empty"><h3>Još nema aktivnih oglasa</h3><p>Kada firma pošalje oglas i upravljanje ga odobri, pojaviće se ovdje.</p><div class="actions"><a class="btn blue" href="#/oglasi">Pretraga oglasa</a><a class="btn lime" href="#/login?mode=signup&role=company">Objavi oglas</a></div></div>`}</div>
    </section>`;
  }

  function cleanAuthText() {
    if (route() !== '/login') return;
    document.querySelectorAll('.auth-form p,.notice').forEach((node) => {
      if (/admin/i.test(node.textContent || '')) node.textContent = 'Upravljanje nije javna opcija. Sistem sam otvara pravi pregled prema ulozi naloga.';
    });
  }

  function cleanPublicAdminLinks() {
    if (route().startsWith('/admin/')) return;
    document.querySelectorAll('a[href^="#/admin/"]').forEach((node) => {
      node.setAttribute('hidden', 'true');
      node.style.display = 'none';
    });
    document.querySelectorAll('.desktop-nav a,.footer a').forEach((node) => {
      if (/admin/i.test(node.textContent || '')) node.remove();
    });
  }

  async function addPaymentProofFlow() {
    if (route() !== '/firma/pretplata') return;
    const app = root();
    if (!app || app.querySelector('[data-live-payment]')) return;
    const old = app.querySelector('[data-manual-payment]');
    if (old) old.remove();
    const me = await account();
    if (me.role !== 'company' || !me.company) return;
    const db = client();
    const orders = await db.from('orders').select('id,payment_reference,status,amount_eur,plans(name)').eq('company_id', me.company.id).order('created_at', { ascending: false }).limit(10);
    const proofs = await db.from('payment_proofs').select('id,file_name,note,status,created_at,orders(payment_reference)').eq('company_id', me.company.id).order('created_at', { ascending: false }).limit(10);
    const pendingOrders = (orders.data || []).filter((o) => o.status === 'pending');
    const panel = document.createElement('section');
    panel.className = 'manual-payment-panel';
    panel.dataset.livePayment = 'true';
    panel.innerHTML = `<div><span class="page-label">Ručna uplata</span><h2>Uplata bez kartica</h2><p>Izaberi plan, izvrši uplatu po instrukcijama i pošalji dokaz. Upravljanje poslije provjerava uplatu i aktivira plan.</p></div>
      <div class="payment-info-grid"><div><strong>Primalac</strong><span>imaposla.me</span></div><div><strong>Svrha</strong><span>Pretplata za firmu</span></div><div><strong>Poziv na broj</strong><span>${escapeHtml(pendingOrders[0]?.payment_reference || 'Naruči plan da dobiješ broj')}</span></div><div><strong>Dokaz</strong><span>PDF ili slika potvrde</span></div></div>
      <form class="manual-proof-form" data-live-proof-form><label><span class="label">Narudžba</span><select class="select" name="order_id" required>${pendingOrders.length ? pendingOrders.map((o) => `<option value="${o.id}">${escapeHtml(o.payment_reference || ('IP-' + o.id))} · ${escapeHtml(o.plans?.name || 'Plan')}</option>`).join('') : '<option value="">Prvo naruči plan</option>'}</select></label><label><span class="label">Dokaz o uplati</span><input class="field" type="file" accept="image/*,.pdf" name="proof" required></label><label><span class="label">Napomena</span><textarea class="textarea" name="note" placeholder="Npr. uplaćeno danas, naziv firme, iznos..."></textarea></label><button class="btn blue" ${pendingOrders.length ? '' : 'disabled'}>Pošalji dokaz</button><p class="live-payment-status" data-live-payment-status>Dokaz se čuva u Supabase prostoru i vidi ga samo firma i upravljanje.</p></form>
      <div class="payment-proof-list">${(proofs.data || []).map((p) => `<div class="payment-proof-item">${escapeHtml(p.file_name || 'Dokaz')} · ${escapeHtml(p.orders?.payment_reference || '')} · ${escapeHtml(p.status || 'čeka')}</div>`).join('') || '<p class="live-payment-status">Još nema poslatih dokaza.</p>'}</div>`;
    app.prepend(panel);
  }

  async function uploadPaymentProof(form) {
    const me = await account();
    if (me.role !== 'company' || !me.company) return toast('Dokaz može poslati samo prijavljena firma.');
    const db = client();
    const data = new FormData(form);
    const file = form.querySelector('input[type="file"]')?.files?.[0];
    const orderId = Number(data.get('order_id'));
    const note = String(data.get('note') || '').slice(0, 1200);
    if (!orderId) return toast('Prvo naruči plan.');
    if (!file) return toast('Dodaj dokaz o uplati.');
    if (file.size > 6 * 1024 * 1024) return toast('Dokaz može biti najviše 6 MB.');
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (file.type && !allowed.includes(file.type)) return toast('Dokaz mora biti PDF ili slika.');
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-90);
    const proofPath = `${me.user.id}/${Date.now()}-${cleanName}`;
    const status = form.querySelector('[data-live-payment-status]');
    if (status) status.textContent = 'Slanje dokaza...';
    const upload = await db.storage.from('payment-proofs').upload(proofPath, file, { upsert: false, contentType: file.type || undefined });
    if (upload.error) {
      if (status) status.textContent = 'Slanje nije uspjelo.';
      return toast(upload.error.message || 'Dokaz nije poslat.');
    }
    const insert = await db.from('payment_proofs').insert({ company_id: me.company.id, order_id: orderId, proof_path: proofPath, file_name: file.name, note, status: 'pending' });
    if (insert.error) return toast(insert.error.message || 'Dokaz nije upisan u bazu.');
    toast('Dokaz je poslat na provjeru.');
    setTimeout(run, 120);
  }

  function showCvInCandidateCards() {
    document.querySelectorAll('.candidate-card').forEach((card) => {
      if (card.querySelector('.candidate-cv-summary')) return;
      const name = card.querySelector('strong')?.textContent || '';
      if (!name || /Kandidat/.test(name)) return;
      const box = document.createElement('div');
      box.className = 'candidate-cv-summary';
      box.innerHTML = '<strong>Biografija</strong><p>Kontakt i radna biografija se čitaju iz profila kandidata. Detalji su dostupni firmi samo za prijave na njene oglase.</p>';
      card.appendChild(box);
    });
  }

  async function run() {
    await renderHome();
    cleanAuthText();
    cleanPublicAdminLinks();
    await addPaymentProofFlow();
    showCvInCandidateCards();
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-live-search]');
    if (form) {
      event.preventDefault();
      const q = new FormData(form).get('q') || '';
      location.hash = `#/oglasi?q=${encodeURIComponent(String(q))}`;
      return;
    }
    const proof = event.target.closest('[data-live-proof-form]');
    if (proof) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await uploadPaymentProof(proof);
    }
  }, true);

  window.addEventListener('DOMContentLoaded', () => [160, 700, 1500].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [120, 500, 1100].forEach((ms) => setTimeout(run, ms)));
  new MutationObserver(() => { clearTimeout(window.liveReadyTimer); window.liveReadyTimer = setTimeout(run, 140); }).observe(document.documentElement, { childList: true, subtree: true });
})();

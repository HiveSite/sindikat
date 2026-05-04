(() => {
  const client = () => window.imaposlaSupabase;
  const root = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
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
    root()?.querySelector('[data-live-payment]')?.remove();
    setTimeout(run, 120);
  }

  function cvBlock(title, value) {
    if (!value) return '';
    return `<section><h4>${escapeHtml(title)}</h4><p>${escapeHtml(value).replace(/\n/g, '<br>')}</p></section>`;
  }

  function findApplicationFromCard(card) {
    if (typeof state === 'undefined') return null;
    const name = card.querySelector('strong')?.textContent?.trim() || '';
    const text = card.textContent || '';
    return (state.applications || []).find((app) => {
      const profileName = app.profiles?.full_name || app.profiles?.email || 'Kandidat';
      const title = app.jobs?.title || 'Prijava';
      return profileName === name && text.includes(title);
    }) || null;
  }

  function showCandidateDetails(appId) {
    if (typeof state === 'undefined') return;
    const appRow = (state.applications || []).find((item) => String(item.id) === String(appId));
    if (!appRow) return toast('Detalji kandidata nijesu dostupni.');
    const profile = appRow.profiles || {};
    const cv = profile.cv_data || {};
    document.querySelector('[data-candidate-modal]')?.remove();
    const modal = document.createElement('div');
    modal.className = 'candidate-detail-modal';
    modal.dataset.candidateModal = 'true';
    modal.innerHTML = `<div class="candidate-detail-card" role="dialog" aria-modal="true" aria-label="Detalji kandidata">
      <button class="candidate-detail-close" data-close-candidate-modal aria-label="Zatvori">×</button>
      <span class="page-label">Kandidat</span>
      <h2>${escapeHtml(profile.full_name || profile.email || 'Kandidat')}</h2>
      <div class="candidate-detail-grid">
        <div><strong>Oglas</strong><span>${escapeHtml(appRow.jobs?.title || 'Prijava')}</span></div>
        <div><strong>Status</strong><span>${escapeHtml(appRow.stage || 'applied')}</span></div>
        <div><strong>Grad</strong><span>${escapeHtml(profile.city || 'Nije upisano')}</span></div>
        <div><strong>Telefon</strong><span>${escapeHtml(profile.phone || 'Nije upisano')}</span></div>
        <div><strong>E-pošta</strong><span>${escapeHtml(profile.email || 'Nije upisano')}</span></div>
        <div><strong>Šifra prijave</strong><span>${escapeHtml(appRow.reference_code || '')}</span></div>
      </div>
      ${cvBlock('Poruka uz prijavu', appRow.cover_letter)}
      ${cvBlock('Kratak opis', cv.summary)}
      ${cvBlock('Vještine', cv.skills)}
      ${cvBlock('Iskustvo', cv.experience)}
      ${cvBlock('Obrazovanje', cv.education)}
      ${cvBlock('Jezici', cv.languages)}
      ${cvBlock('Dostupnost', cv.availability)}
    </div>`;
    document.body.appendChild(modal);
  }

  function showCvInCandidateCards() {
    document.querySelectorAll('.candidate-card').forEach((card) => {
      const appRow = findApplicationFromCard(card);
      if (!card.querySelector('.candidate-cv-summary')) {
        const box = document.createElement('div');
        box.className = 'candidate-cv-summary';
        box.innerHTML = '<strong>Biografija</strong><p>Kontakt i radna biografija se čitaju iz profila kandidata. Detalji su dostupni firmi samo za prijave na njene oglase.</p>';
        card.appendChild(box);
      }
      if (appRow && !card.querySelector('[data-candidate-detail]')) {
        const button = document.createElement('button');
        button.className = 'btn ghost xs candidate-detail-button';
        button.dataset.candidateDetail = appRow.id;
        button.textContent = 'Detalji kandidata';
        card.appendChild(button);
      }
    });
  }

  async function run() {
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

  document.addEventListener('click', (event) => {
    const detail = event.target.closest('[data-candidate-detail]');
    if (detail) {
      event.preventDefault();
      showCandidateDetails(detail.dataset.candidateDetail);
      return;
    }
    if (event.target.closest('[data-close-candidate-modal]') || event.target.matches('[data-candidate-modal]')) {
      event.preventDefault();
      document.querySelector('[data-candidate-modal]')?.remove();
    }
  }, true);

  window.addEventListener('DOMContentLoaded', () => [120, 500, 1100].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [100, 420, 900].forEach((ms) => setTimeout(run, ms)));
})();

(() => {
  const db = () => window.imaposlaSupabase;
  const app = () => document.querySelector('#app');
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.liveAdminPaymentToast);
    window.liveAdminPaymentToast = setTimeout(() => el.classList.remove('show'), 3000);
  };

  async function accountRole() {
    const client = db();
    if (!client?.auth) return 'guest';
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    if (!user) return 'guest';
    const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return profile?.role || 'guest';
  }

  async function signedProofUrl(path) {
    if (!path) return '';
    const result = await db().storage.from('payment-proofs').createSignedUrl(path, 600);
    return result.data?.signedUrl || '';
  }

  async function addProofReview() {
    if (route() !== '/admin/uplate') return;
    const root = app();
    if (!root || root.querySelector('[data-admin-proof-review]')) return;
    if (await accountRole() !== 'admin') return;
    const result = await db().from('payment_proofs')
      .select('id,proof_path,file_name,note,status,created_at,companies(name),orders(payment_reference,amount_eur)')
      .order('created_at', { ascending: false })
      .limit(30);
    const proofs = result.data || [];
    const links = await Promise.all(proofs.map((proof) => signedProofUrl(proof.proof_path)));
    const panel = document.createElement('section');
    panel.className = 'manual-payment-panel admin-proof-panel';
    panel.dataset.adminProofReview = 'true';
    panel.innerHTML = `<div><span class="page-label">Dokazi uplata</span><h2>Provjera ručnih uplata</h2><p>Ovdje se vide dokazi koje su firme poslale uz narudžbu plana. Link za dokaz je privremen i važi kratko.</p></div><div class="table-card proof-review-table">${proofs.length ? proofs.map((proof, index) => `<div class="table-row"><div><strong>${h(proof.companies?.name || 'Firma')}</strong><small>${h(proof.orders?.payment_reference || '')}</small></div><div>${h(proof.file_name || 'Dokaz')}<small>${h(proof.note || 'Bez napomene')}</small></div><div><span class="badge gray">${h(proof.status || 'pending')}</span></div><div class="actions"><a class="btn ghost xs" href="${h(links[index])}" target="_blank" rel="noopener">Otvori</a><button class="btn blue xs" data-proof-status="approved" data-proof-id="${proof.id}">Prihvati</button><button class="btn red xs" data-proof-status="rejected" data-proof-id="${proof.id}">Odbij</button></div></div>`).join('') : '<div class="empty"><strong>Nema dokaza</strong><p>Dokazi uplata će se pojaviti ovdje kada ih firma pošalje.</p></div>'}</div>`;
    root.prepend(panel);
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-proof-status]');
    if (!button) return;
    event.preventDefault();
    const id = Number(button.dataset.proofId);
    const status = button.dataset.proofStatus;
    const { data } = await db().auth.getSession();
    const update = await db().from('payment_proofs').update({ status, reviewed_by: data?.session?.user?.id || null, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (update.error) return toast(update.error.message || 'Status nije promijenjen.');
    toast(status === 'approved' ? 'Dokaz je prihvaćen.' : 'Dokaz je odbijen.');
    document.querySelector('[data-admin-proof-review]')?.remove();
    setTimeout(addProofReview, 120);
  }, true);

  function run() { addProofReview(); }
  window.addEventListener('DOMContentLoaded', () => [240, 800, 1400].forEach((ms) => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [160, 620, 1100].forEach((ms) => setTimeout(run, ms)));
})();

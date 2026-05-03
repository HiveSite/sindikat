(() => {
  const toast = (message) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.manualPaymentToastTimer);
    window.manualPaymentToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  };
  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];

  function addPaymentInfo() {
    if (route() !== '/firma/pretplata') return;
    const root = document.querySelector('#app section, #app');
    if (!root || document.querySelector('[data-manual-payment]')) return;
    const panel = document.createElement('section');
    panel.className = 'manual-payment-panel';
    panel.dataset.manualPayment = 'true';
    panel.innerHTML = `<div><span class="page-label">Ručna uplata</span><h2>Uplata bez kartica i bankarskih dodataka</h2><p>Firma izabere plan, izvrši uplatu po instrukcijama i pošalje dokaz. Upravljanje poslije provjerava uplatu i aktivira plan.</p></div><div class="payment-info-grid"><div><strong>Primalac</strong><span>imaposla.me</span></div><div><strong>Svrha</strong><span>Pretplata za firmu</span></div><div><strong>Poziv na broj</strong><span>Biće prikazan nakon narudžbe plana</span></div><div><strong>Dokaz</strong><span>PDF, slika ili potvrda banke</span></div></div><form class="manual-proof-form" data-proof-form><label><span class="label">Dokaz o uplati</span><input class="field" type="file" accept="image/*,.pdf" name="proof"></label><label><span class="label">Napomena</span><textarea class="textarea" name="note" placeholder="Npr. uplaćeno danas, naziv firme, iznos..."></textarea></label><button class="btn blue">Sačuvaj dokaz za slanje</button><p>Trenutno se dokaz priprema u browseru. U sljedećem Supabase koraku povezujemo čuvanje dokaza u bazu.</p></form>`;
    root.prepend(panel);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-proof-form]');
    if (!form) return;
    event.preventDefault();
    const file = form.querySelector('input[type="file"]')?.files?.[0];
    const note = new FormData(form).get('note') || '';
    localStorage.setItem('imaposlaPaymentProofDraft', JSON.stringify({ fileName: file?.name || '', note: String(note), savedAt: new Date().toISOString() }));
    toast('Dokaz je pripremljen. Povezaćemo slanje u Supabase u sljedećem koraku.');
  });

  function run() { addPaymentInfo(); }
  window.addEventListener('DOMContentLoaded', () => [200, 800, 1500].forEach(ms => setTimeout(run, ms)));
  window.addEventListener('hashchange', () => [120, 600, 1200].forEach(ms => setTimeout(run, ms)));
  new MutationObserver(() => setTimeout(run, 80)).observe(document.documentElement, { childList: true, subtree: true });
})();

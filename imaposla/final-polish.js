(() => {
  const app = () => document.querySelector('#app');
  const currentPath = () => (location.hash.replace('#', '') || '/').split('?')[0];

  const textReplacements = [
    [/ATS prijave/g, 'Selekcija prijava'],
    [/\bATS\b/g, 'Selekcija'],
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

  function fixRoleNavigation() {
    document.querySelectorAll('.mobile-app-nav a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const icon = link.querySelector('span')?.outerHTML || '<span>•</span>';
      if (href.includes('/firma/dashboard')) link.innerHTML = `${icon}Pregled`;
      if (href.includes('/firma/ats')) link.innerHTML = `${icon}Izbor`;
      if (href.includes('/admin/dashboard')) link.innerHTML = `${icon}Pregled`;
      if (href.includes('/admin/korisnici')) link.innerHTML = `${icon}Ljudi`;
      if (href.includes('/profil/cv')) link.innerHTML = `${icon}Biogr.`;
      if (href === '#/login') link.innerHTML = `${icon}Prijava`;
    });
  }

  function polishMenus() {
    const menu = document.querySelector('[data-mobile-menu]');
    if (!menu) return;
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => menu.classList.remove('open'), { once: true }));
  }

  function runPolish() {
    translateVisibleText(document.body);
    improveSelectionPage();
    fixRoleNavigation();
    polishMenus();
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
    const root = app();
    if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  });
  window.addEventListener('hashchange', () => {
    schedule();
    setTimeout(runPolish, 350);
  });
})();

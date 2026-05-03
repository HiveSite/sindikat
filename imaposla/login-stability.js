(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (!descriptor?.get || !descriptor?.set) return;

  const route = () => (location.hash.replace('#', '') || '/').split('?')[0];
  const keyFor = (html) => `${location.hash}|${String(html).includes('Već ste prijavljeni') ? 'signed' : 'guest'}`;

  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      if (this.id === 'app') {
        const html = String(value || '');
        const isLoginRender = route() === '/login' && html.includes('auth-shell');
        const isHomeRender = route() === '/' && html.includes('home-hero-clean');

        if (isLoginRender) {
          const nextKey = keyFor(html);
          const activeInput = this.contains(document.activeElement) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
          if (this.dataset.loginStableKey === nextKey || activeInput) return;
          descriptor.set.call(this, value);
          this.dataset.loginStableKey = nextKey;
          return;
        }

        if (isHomeRender) {
          const nextKey = `${location.hash}|home`;
          if (this.dataset.homeStableKey === nextKey) return;
          descriptor.set.call(this, value);
          this.dataset.homeStableKey = nextKey;
          return;
        }
      }
      descriptor.set.call(this, value);
    }
  });
})();

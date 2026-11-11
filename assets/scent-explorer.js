class ScentExplorer extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('[role="tab"]')];
    this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
    this.current = 0;

    this.addEventListener('click', this.onClick.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
    this.addEventListener('animationend', () => this.select(this.current + 1));

    this.addEventListener('mouseenter', () => this.classList.add('is-paused'));
    this.addEventListener('mouseleave', () => this.classList.remove('is-paused'));
    this.addEventListener('focusin', () => this.classList.add('is-paused'));
    this.addEventListener('focusout', () => this.classList.remove('is-paused'));

    this.addEventListener('shopify:block:select', (event) => {
      this.select(this.tabs.indexOf(event.target));
      this.classList.add('is-paused');
    });
    this.addEventListener('shopify:block:deselect', () => this.classList.remove('is-paused'));
  }

  select(index) {
    this.current = (index + this.tabs.length) % this.tabs.length;
    const tab = this.tabs[this.current];

    this.tabs.forEach((item) => {
      item.setAttribute('aria-selected', item === tab);
      item.tabIndex = item === tab ? 0 : -1;
    });
    this.panels.forEach((panel, i) => (panel.hidden = i !== this.current));

    this.style.setProperty('--explorer-bg', tab.dataset.color);
    this.classList.toggle('is-dark', tab.dataset.dark === 'true');
  }

  onClick(event) {
    const tab = event.target.closest('[role="tab"]');
    const arrow = event.target.closest('[data-step]');

    if (tab) this.select(this.tabs.indexOf(tab));

    if (arrow) {
      this.select(this.current + Number(arrow.dataset.step));
      this.panels[this.current].querySelector(`[data-step="${arrow.dataset.step}"]`).focus();
    }
  }

  onKeydown(event) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step || event.target.getAttribute('role') !== 'tab') return;

    this.select(this.current + step);
    this.tabs[this.current].focus();
  }
}

if (!customElements.get('scent-explorer')) {
  customElements.define('scent-explorer', ScentExplorer);
}
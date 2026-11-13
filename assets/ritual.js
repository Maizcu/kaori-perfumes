class RitualForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.button = this.form.querySelector('[type="submit"]');
    this.message = this.querySelector('[data-message]');
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  get items() {
    return [...this.form.querySelectorAll('input[type="hidden"], input:checked')].map((input) => ({
      id: Number(input.value),
      quantity: 1,
      properties: { _ritual: 'true' },
    }));
  }

  async onSubmit(event) {
    event.preventDefault();
    const cart = document.querySelector('cart-drawer');
    this.button.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(routes.cart_add_url, {
        ...fetchConfig(),
        body: JSON.stringify({ items: this.items }),
      });
      const state = await response.json();

      if (state.status) throw new Error(state.description);

      this.message.textContent = '';

      if (!cart) {
        window.location = routes.cart_url;
        return;
      }

      const ids = cart.getSectionsToRender().map((section) => section.id);
      const sections = await fetch(`${window.location.pathname}?sections=${ids.join(',')}`).then((res) => res.json());
      cart.renderContents({ sections });
      cart.classList.remove('is-empty');
    } catch (error) {
      this.message.textContent = error.message;
    } finally {
      this.button.removeAttribute('aria-busy');
    }
  }
}

class RitualBuilder extends RitualForm {
  connectedCallback() {
    super.connectedCallback();
    this.groups = [...this.querySelectorAll('[data-max]')];
    this.label = this.button.querySelector('[data-label]');
    this.form.addEventListener('change', this.onChange.bind(this));
    this.update();
  }

  onChange(event) {
    const group = event.target.closest('[data-max]');

    if (group.dataset.max === '1' && event.target.checked) {
      group.querySelectorAll('input:checked').forEach((input) => (input.checked = input === event.target));
    }

    this.update();
  }

  update() {
    let subtotal = 0;
    let complete = true;

    this.groups.forEach((group) => {
      const max = Number(group.dataset.max);
      const inputs = [...group.querySelectorAll('input')];
      const checked = inputs.filter((input) => input.checked);
      const slots = this.querySelectorAll(`[data-slot="${group.dataset.group}"]`);

      if (max > 1) inputs.forEach((input) => (input.disabled = !input.checked && checked.length === max));
      group.toggleAttribute('data-full', checked.length === max);
      slots.forEach((slot, index) => {
        const input = checked[index];
        slot.classList.toggle('is-empty', !input);
        slot.children[0].textContent = input ? input.dataset.title : slot.dataset.placeholder;
        slot.children[1].textContent = input ? this.format(input.dataset.price) : '—';
      });

      group.querySelector('[data-count]').textContent = checked.length;
      subtotal += checked.reduce((sum, input) => sum + Number(input.dataset.price), 0);
      complete = complete && checked.length === max;
    });

    const discount = complete ? Math.round((subtotal * this.dataset.discount) / 100) : 0;

    this.querySelector('[data-subtotal]').textContent = this.format(subtotal);
    this.querySelector('[data-saving]').textContent = complete ? `−${this.format(discount)}` : '—';
    this.querySelector('[data-total]').textContent = this.format(subtotal - discount);

    this.button.disabled = !complete;
    this.label.textContent = complete ? this.dataset.labelReady : this.dataset.labelIncomplete;
    this.message.textContent = complete ? this.dataset.ready : this.dataset.incomplete;
  }

  format(cents) {
    return new Intl.NumberFormat(document.documentElement.lang, {
      style: 'currency',
      currency: Shopify.currency.active,
      minimumFractionDigits: cents % 100 ? 2 : 0,
    }).format(cents / 100);
  }
}

if (!customElements.get('ritual-form')) customElements.define('ritual-form', RitualForm);
if (!customElements.get('ritual-builder')) customElements.define('ritual-builder', RitualBuilder);

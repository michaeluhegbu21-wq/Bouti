// Simple boutique SPA - products, cart in localStorage, checkout form
(() => {
  // Sample products
  const products = [
    { id: 'p1', name: 'Silk Scarf', price: 34.00, description:'Lightweight printed silk scarf', img: 'https://picsum.photos/seed/scarf/600/400' },
    { id: 'p2', name: 'Leather Handbag', price: 120.00, description:'Handcrafted leather handbag', img: 'https://picsum.photos/seed/handbag/600/400' },
    { id: 'p3', name: 'Gold Hoop Earrings', price: 45.00, description:'Minimal gold-plated hoops', img: 'https://picsum.photos/seed/earrings/600/400' },
    { id: 'p4', name: 'Cotton Dress', price: 78.00, description:'Summer cotton A-line dress', img: 'https://picsum.photos/seed/dress/600/400' },
    { id: 'p5', name: 'Fragrance Candle', price: 22.50, description:'Vanilla & cedar scented candle', img: 'https://picsum.photos/seed/candle/600/400' },
    { id: 'p6', name: 'Sunglasses', price: 59.99, description:'UV-protected designer style', img: 'https://picsum.photos/seed/sunglasses/600/400' },
  ];

  // DOM
  const productsEl = document.getElementById('products');
  const cartToggle = document.getElementById('cart-toggle');
  const cartEl = document.getElementById('cart');
  const cartClose = document.getElementById('cart-close');
  const cartCount = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutCancel = document.getElementById('checkout-cancel');
  const checkoutForm = document.getElementById('checkout-form');

  const orderModal = document.getElementById('order-confirmation');
  const orderSummaryEl = document.getElementById('order-summary');
  const confirmDone = document.getElementById('confirm-done');
  const confirmClose = document.getElementById('confirm-close');

  // Cart state
  let cart = loadCart();

  function renderProducts() {
    productsEl.innerHTML = '';
    for (const p of products) {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <div class="card-body">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="meta">${escapeHtml(p.description)}</div>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="actions">
            <button class="btn btn-primary add-to-cart" data-id="${p.id}">Add to cart</button>
            <button class="btn btn-ghost view" data-id="${p.id}">View</button>
          </div>
        </div>
      `;
      productsEl.appendChild(card);
    }
    // attach handlers
    productsEl.querySelectorAll('.add-to-cart').forEach(b => {
      b.addEventListener('click', () => addToCart(b.dataset.id, 1));
    });
    productsEl.querySelectorAll('.view').forEach(b => {
      b.addEventListener('click', () => alertViewProduct(b.dataset.id));
    });
  }

  function alertViewProduct(id){
    const p = products.find(x=>x.id===id);
    if(!p) return;
    alert(`${p.name}\n\n${p.description}\n\nPrice: $${p.price.toFixed(2)}`);
  }

  function addToCart(id, qty = 1) {
    const item = cart[id] || { productId: id, qty: 0 };
    item.qty += qty;
    cart[id] = item;
    saveCart();
    renderCart();
    openCart();
  }

  function setQuantity(id, qty) {
    if (qty <= 0) {
      delete cart[id];
    } else {
      cart[id].qty = qty;
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(id){
    delete cart[id];
    saveCart();
    renderCart();
  }

  function renderCart() {
    const keys = Object.keys(cart);
    cartItemsEl.innerHTML = '';
    if (keys.length === 0) {
      cartItemsEl.innerHTML = '<p style="color:var(--muted)">Your cart is empty.</p>';
      cartCount.textContent = '0';
      cartTotalEl.textContent = '$0.00';
      checkoutBtn.disabled = true;
      return;
    }
    let subtotal = 0;
    for (const id of keys) {
      const item = cart[id];
      const p = products.find(x => x.id === item.productId);
      if (!p) continue;
      const row = document.createElement('div');
      row.className = 'cart-item';
      const itemTotal = p.price * item.qty;
      subtotal += itemTotal;
      row.innerHTML = `
        <img src="${p.img}" alt="${escapeHtml(p.name)}" />
        <div class="meta">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${escapeHtml(p.name)}</strong>
            <div style="font-weight:700">$${itemTotal.toFixed(2)}</div>
          </div>
          <div style="color:var(--muted);font-size:0.9rem">${escapeHtml(p.description)}</div>
          <div class="qty" style="margin-top:0.6rem">
            <button class="btn btn-ghost dec" data-id="${id}">−</button>
            <input type="number" min="1" value="${item.qty}" class="qty-input" data-id="${id}" style="width:52px;padding:0.3rem;border-radius:6px;border:1px solid #ddd" />
            <button class="btn btn-ghost inc" data-id="${id}">+</button>
            <button class="btn" style="margin-left:8px" data-id="${id}" data-remove>Remove</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(row);
    }
    cartCount.textContent = keys.reduce((s,k)=>s+cart[k].qty,0);
    cartTotalEl.textContent = '$' + subtotal.toFixed(2);
    checkoutBtn.disabled = false;

    // attach handlers
    cartItemsEl.querySelectorAll('.inc').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        setQuantity(id, cart[id].qty + 1);
      });
    });
    cartItemsEl.querySelectorAll('.dec').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        setQuantity(id, cart[id].qty - 1);
      });
    });
    cartItemsEl.querySelectorAll('.qty-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = inp.dataset.id;
        const val = parseInt(inp.value, 10) || 1;
        setQuantity(id, Math.max(1, val));
      });
    });
    cartItemsEl.querySelectorAll('[data-remove]').forEach(b => {
      b.addEventListener('click', () => removeFromCart(b.dataset.id));
    });
  }

  function openCart(){ cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden','false'); }
  function closeCart(){ cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden','true'); }

  function openModal(modal){ modal.setAttribute('aria-hidden','false'); }
  function closeModal(modal){ modal.setAttribute('aria-hidden','true'); }

  function calculateSubtotal() {
    return Object.keys(cart).reduce((sum, id) => {
      const item = cart[id];
      const p = products.find(x => x.id === item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }

  function saveCart(){
    try {
      localStorage.setItem('boutique_cart_v1', JSON.stringify(cart));
    } catch (e) { console.warn('Could not save cart', e); }
  }

  function loadCart(){
    try {
      const raw = localStorage.getItem('boutique_cart_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function clearCart(){
    cart = {};
    saveCart();
    renderCart();
  }

  // Checkout handling
  checkoutBtn.addEventListener('click', () => {
    openModal(checkoutModal);
  });
  checkoutClose.addEventListener('click', () => closeModal(checkoutModal));
  checkoutCancel.addEventListener('click', () => closeModal(checkoutModal));
  cartToggle.addEventListener('click', () => openCart());
  cartClose.addEventListener('click', () => closeCart());

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) return alert('Your cart is empty.');
    const formData = new FormData(checkoutForm);
    const order = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      contact: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
      },
      address: {
        line1: formData.get('address1'),
        line2: formData.get('address2'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip'),
        country: formData.get('country'),
        notes: formData.get('notes'),
      },
      items: Object.keys(cart).map(k => {
        const c = cart[k];
        const p = products.find(x => x.id === c.productId);
        return { id: p.id, name: p.name, price: p.price, qty: c.qty };
      }),
      subtotal: calculateSubtotal(),
      createdAt: new Date().toISOString()
    };

    // Simulate sending order to server: save to localStorage orders list
    try {
      const raw = localStorage.getItem('boutique_orders_v1') || '[]';
      const orders = JSON.parse(raw);
      orders.push(order);
      localStorage.setItem('boutique_orders_v1', JSON.stringify(orders));
    } catch (err) {
      console.warn('Could not save order', err);
    }

    // show confirmation
    renderOrderConfirmation(order);
    closeModal(checkoutModal);
    clearCart();
  });

  function renderOrderConfirmation(order){
    orderSummaryEl.innerHTML = `
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Name:</strong> ${escapeHtml(order.contact.name)} • ${escapeHtml(order.contact.email)}</p>
      <p><strong>Delivery:</strong> ${escapeHtml(order.address.line1)}, ${escapeHtml(order.address.city)} ${escapeHtml(order.address.zip)}</p>
      <h4>Items</h4>
      <ul>
        ${order.items.map(it => `<li>${escapeHtml(it.name)} × ${it.qty} — $${(it.price * it.qty).toFixed(2)}</li>`).join('')}
      </ul>
      <p style="font-weight:700">Subtotal: $${order.subtotal.toFixed(2)}</p>
    `;
    openModal(orderModal);
  }

  confirmDone.addEventListener('click', () => closeModal(orderModal));
  confirmClose.addEventListener('click', () => closeModal(orderModal));

  // small helpers
  function escapeHtml(s){
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // init
  document.getElementById('year').textContent = new Date().getFullYear();
  renderProducts();
  renderCart();

  // Accessibility: close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeModal(checkoutModal);
      closeModal(orderModal);
    }
  });

})();
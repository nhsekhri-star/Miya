/**
 * MYA HIJABS LUXURY E-COMMERCE CLIENT APPLICATION
 */

(function () {
  'use strict';

  // --- Exchange Rates & Currency State ---
  const CAD_TO_USD = 0.74;
  let currentCurrency = localStorage.getItem('mya_currency') || 'CAD';

  // --- Cart & Wishlist Storage ---
  let cart = JSON.parse(localStorage.getItem('mya_cart_v1')) || [
    // Pre-populate with one lovely best-seller for instant delight
    {
      id: "rose-marble-printed-hijab-modal",
      title: "Rose Marble Modal Hijab",
      price: 25.0,
      image: "Rose-Marble-printed-hijab-premium-modal.jpg",
      quantity: 1
    }
  ];

  let wishlist = new Set(JSON.parse(localStorage.getItem('mya_wishlist_v1')) || [
    "rose-marble-printed-hijab-modal"
  ]);

  let appliedPromo = localStorage.getItem('mya_promo') || null;
  let activeCategory = 'all';
  let currentSort = 'featured';
  let searchQuery = '';

  // --- Format Currency Helper ---
  function formatPrice(cadAmount) {
    if (currentCurrency === 'USD') {
      const usdAmount = (cadAmount * CAD_TO_USD).toFixed(2);
      return `$${usdAmount} USD`;
    }
    return `$${cadAmount.toFixed(2)} CAD`;
  }

  function getRawPrice(cadAmount) {
    if (currentCurrency === 'USD') {
      return (cadAmount * CAD_TO_USD);
    }
    return cadAmount;
  }

  // --- DOM Elements ---
  const productGrid = document.getElementById('product-grid');
  const cartDrawer = document.getElementById('cart-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCountBadges = document.querySelectorAll('.cart-badge-count');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartEmptyView = document.getElementById('cart-empty-view');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartDiscountRow = document.getElementById('cart-discount-row');
  const cartDiscountEl = document.getElementById('cart-discount-amount');
  const cartTotalEl = document.getElementById('cart-total');
  const shippingMeterFill = document.getElementById('shipping-meter-fill');
  const shippingMeterText = document.getElementById('shipping-meter-text');
  const promoInput = document.getElementById('promo-input');
  const promoApplyBtn = document.getElementById('promo-apply-btn');
  const promoAppliedTag = document.getElementById('promo-applied-tag');
  const currencySelector = document.getElementById('currency-selector');
  const catalogSearchInput = document.getElementById('catalog-search-input');
  const sortSelect = document.getElementById('sort-select');
  const categoryPills = document.querySelectorAll('.filter-pill');
  const toastContainer = document.getElementById('toast-container');
  const quickviewModal = document.getElementById('quickview-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // --- Save State to Storage ---
  function saveCart() {
    localStorage.setItem('mya_cart_v1', JSON.stringify(cart));
    updateCartUI();
  }

  function saveWishlist() {
    localStorage.setItem('mya_wishlist_v1', JSON.stringify(Array.from(wishlist)));
    updateWishlistUI();
  }

  // --- Toast Notification ---
  function showToast(message, iconSvg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${iconSvg || '✨'}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- Update Wishlist UI ---
  function updateWishlistUI() {
    const wishlistCountBadge = document.getElementById('wishlist-count-badge');
    if (wishlistCountBadge) {
      wishlistCountBadge.textContent = wishlist.size;
    }
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      const pid = btn.dataset.productId;
      if (wishlist.has(pid)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Toggle Wishlist ---
  function toggleWishlist(productId) {
    if (wishlist.has(productId)) {
      wishlist.delete(productId);
      showToast('Removed from your wishlist', '🤍');
    } else {
      wishlist.add(productId);
      showToast('Saved to your wishlist!', '❤️');
    }
    saveWishlist();
  }

  // --- Cart Drawer Functions ---
  function openCart() {
    cartDrawer.classList.add('active');
    drawerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('active');
    drawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function addToCart(product, qty = 1) {
    const existing = cart.find(item => item.id === product.id);
    const mainImg = product.images && product.images.length > 0 ? product.images[0] : 'Rose-Marble-printed-hijab-premium-modal.jpg';

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: mainImg,
        quantity: qty
      });
    }
    saveCart();
    showToast(`Added "${product.title}" to bag`, '🛍️');
    openCart();
  }

  function updateItemQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
  }

  function removeItemFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
  }

  // --- Update Cart Drawer UI ---
  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(b => b.textContent = totalCount);

    if (cart.length === 0) {
      cartItemsContainer.style.display = 'none';
      cartEmptyView.style.display = 'flex';
    } else {
      cartItemsContainer.style.display = 'flex';
      cartEmptyView.style.display = 'none';
      
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <img class="cart-item-img" src="assets/cdn/shop/files/${item.image}" alt="${item.title}" loading="lazy" />
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="cart-qty-row">
              <div class="qty-control">
                <button class="qty-btn" onclick="window.MyaApp.changeQty('${item.id}', -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="window.MyaApp.changeQty('${item.id}', 1)">+</button>
              </div>
              <button class="cart-remove-btn" onclick="window.MyaApp.removeItem('${item.id}')">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Subtotals and Threshold
    const subtotalCad = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const freeShippingThresholdCad = 70.0;
    const progressPercent = Math.min(100, Math.round((subtotalCad / freeShippingThresholdCad) * 100));

    if (shippingMeterFill) {
      shippingMeterFill.style.width = `${progressPercent}%`;
    }

    if (shippingMeterText) {
      if (subtotalCad >= freeShippingThresholdCad) {
        shippingMeterText.innerHTML = `<span>🎉 <strong>Congratulations!</strong> You unlocked FREE Shipping in GTA!</span>`;
      } else {
        const remaining = (freeShippingThresholdCad - subtotalCad).toFixed(2);
        shippingMeterText.innerHTML = `<span>Add <strong>$${remaining} CAD</strong> more to unlock <strong>FREE GTA Shipping</strong></span>`;
      }
    }

    // Promo Discount
    let discountCad = 0;
    if (appliedPromo === 'MYADIS15') {
      discountCad = subtotalCad * 0.15;
      if (cartDiscountRow) cartDiscountRow.style.display = 'flex';
      if (cartDiscountEl) cartDiscountEl.textContent = `-${formatPrice(discountCad)}`;
      if (promoAppliedTag) {
        promoAppliedTag.style.display = 'block';
        promoAppliedTag.textContent = 'Code MYADIS15 Applied (-15%)';
      }
    } else {
      if (cartDiscountRow) cartDiscountRow.style.display = 'none';
      if (promoAppliedTag) promoAppliedTag.style.display = 'none';
    }

    const finalTotalCad = Math.max(0, subtotalCad - discountCad);

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotalCad);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(finalTotalCad);
  }

  // --- Promo Code Application ---
  function applyPromoCode() {
    const code = promoInput.value.trim().toUpperCase();
    if (code === 'MYADIS15') {
      appliedPromo = 'MYADIS15';
      localStorage.setItem('mya_promo', 'MYADIS15');
      showToast('15% Promo Code MYADIS15 applied!', '🎉');
      updateCartUI();
    } else if (code === '') {
      appliedPromo = null;
      localStorage.removeItem('mya_promo');
      updateCartUI();
    } else {
      showToast('Invalid promo code. Try MYADIS15', '⚠️');
    }
  }

  // --- Quick View Modal ---
  function openQuickView(productId) {
    const product = MYA_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('quickview-body');
    const images = product.images && product.images.length > 0 
      ? product.images 
      : ['Rose-Marble-printed-hijab-premium-modal.jpg'];

    // Paragraphs
    const parasHtml = (product.paragraphs && product.paragraphs.length > 0)
      ? product.paragraphs.map(p => `<p>${p}</p>`).join('')
      : `<p>${product.description}</p>`;

    // Features / Highlights
    let featuresHtml = '';
    if (product.features && product.features.length > 0) {
      featuresHtml = `
        <div class="quickview-features-box">
          <h4>Product Highlights & Features</h4>
          <ul class="quickview-features-list">
            ${product.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Specs list
    const specs = product.specs || {};
    const specsItems = [
      `<li><strong>Material:</strong> <span>${specs['Material'] || product.material}</span></li>`,
      `<li><strong>Dimensions:</strong> <span>${specs['Dimensions'] || specs['Size'] || product.dimensions}</span></li>`,
      specs['Texture'] ? `<li><strong>Texture:</strong> <span>${specs['Texture']}</span></li>` : '',
      `<li><strong>Care:</strong> <span>${specs['Care Instructions'] || specs['Care'] || product.care}</span></li>`,
      `<li><strong>Delivery:</strong> <span>Fast 1–2 Day Canadian Shipping</span></li>`,
      `<li><strong>Local Pickup:</strong> <span>Available at 830 Stainton Dr, Mississauga (24h)</span></li>`
    ].filter(Boolean).join('');

    modalBody.innerHTML = `
      <div class="quickview-gallery">
        <div class="quickview-main-img-wrap">
          <img id="qv-active-img" class="quickview-main-img" src="assets/cdn/shop/files/${images[0]}" alt="${product.title}" />
        </div>
        <div class="quickview-thumbnails">
          ${images.map((img, idx) => `
            <button class="thumb-btn ${idx === 0 ? 'active' : ''}" onclick="window.MyaApp.switchQvImage('assets/cdn/shop/files/${img}', this)">
              <img src="assets/cdn/shop/files/${img}" alt="thumbnail" />
            </button>
          `).join('')}
        </div>
      </div>
      <div class="quickview-info">
        <span class="quickview-category">${product.categoryLabel}</span>
        <h2 class="quickview-title">${product.title}</h2>
        
        <div class="quickview-price-row">
          <span class="current-price" style="font-size: 1.5rem;">${formatPrice(product.price)}</span>
          ${product.compareAtPrice ? `<span class="compare-price" style="font-size: 1.1rem;">${formatPrice(product.compareAtPrice)}</span>` : ''}
          <div class="card-rating" style="margin: 0 0 0 12px;">
            <div class="star-icons">★★★★★</div>
            <span>${product.rating} (${product.reviewsCount} reviews)</span>
          </div>
        </div>

        <div class="quickview-desc-paragraphs">
          ${parasHtml}
        </div>

        ${featuresHtml}
        
        <ul class="quickview-spec-list">
          ${specsItems}
        </ul>

        <div class="quickview-actions">
          <button class="btn-primary" style="flex: 1.4; padding: 16px;" onclick="window.MyaApp.addFromQuickView('${product.id}')">
            Add to Shopping Bag • ${formatPrice(product.price)}
          </button>
          <button class="btn-secondary" onclick="window.MyaApp.toggleWishlist('${product.id}')">
            ♥ Save
          </button>
        </div>
      </div>
    `;

    quickviewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    quickviewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function switchQvImage(src, btn) {
    const activeImg = document.getElementById('qv-active-img');
    if (activeImg) {
      activeImg.style.opacity = '0.4';
      setTimeout(() => {
        activeImg.src = src;
        activeImg.style.opacity = '1';
      }, 150);
    }
    document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // --- Render Product Grid ---
  function renderProducts() {
    if (!productGrid) return;

    let filtered = [...MYA_PRODUCTS];

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.material.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sort
    if (currentSort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div class="catalog-empty">
          <h3>No hijabs match your criteria</h3>
          <p>Try clearing your search query or selecting another category.</p>
          <button class="btn-secondary" style="margin-top: 16px;" onclick="window.MyaApp.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    productGrid.innerHTML = filtered.map(product => {
      const primaryImg = product.images[0] || 'Rose-Marble-printed-hijab-premium-modal.jpg';
      const secondaryImg = product.images[1] || primaryImg;
      const isWishlisted = wishlist.has(product.id);

      let badgeClass = '';
      if (product.badge === 'Best Seller') badgeClass = 'badge-bestseller';
      else if (product.badge === 'Just Dropped') badgeClass = 'badge-new';
      else if (product.badge === 'Built-in Magnets') badgeClass = 'badge-magnets';
      else if (product.badge === 'Sale') badgeClass = 'badge-sale';

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-media" onclick="window.MyaApp.openQuickView('${product.id}')">
            ${product.badge ? `<span class="card-badge ${badgeClass}">${product.badge}</span>` : ''}
            <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    data-product-id="${product.id}" 
                    onclick="event.stopPropagation(); window.MyaApp.toggleWishlist('${product.id}')"
                    title="Save to wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#E63946' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <img class="card-img-primary" src="assets/cdn/shop/files/${primaryImg}" alt="${product.title}" loading="lazy" />
            <img class="card-img-secondary" src="assets/cdn/shop/files/${secondaryImg}" alt="${product.title} Alternate View" loading="lazy" />
            
            <div class="card-hover-actions">
              <button class="btn-card-quickview" onclick="event.stopPropagation(); window.MyaApp.openQuickView('${product.id}')">
                Quick View
              </button>
              <button class="btn-card-add" onclick="event.stopPropagation(); window.MyaApp.quickAdd('${product.id}')">
                Add +
              </button>
            </div>
          </div>
          
          <div class="card-info">
            <span class="card-category">${product.categoryLabel}</span>
            <h3 class="card-title" onclick="window.MyaApp.openQuickView('${product.id}')">${product.title}</h3>
            
            <p class="card-desc-snippet" onclick="window.MyaApp.openQuickView('${product.id}')">
              ${product.paragraphs && product.paragraphs.length > 0 ? product.paragraphs[0] : product.description}
            </p>

            <div class="card-rating">
              <div class="star-icons">
                ★★★★★
              </div>
              <span>${product.rating} (${product.reviewsCount})</span>
            </div>

            <div class="card-footer">
              <div class="price-wrap">
                <span class="current-price">${formatPrice(product.price)}</span>
                ${product.compareAtPrice ? `<span class="compare-price">${formatPrice(product.compareAtPrice)}</span>` : ''}
              </div>
              <span class="color-swatch-indicator" style="background-color: ${product.colorHex};" title="Available Shade"></span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    updateWishlistUI();
  }

  // --- Reset Filters ---
  function resetFilters() {
    activeCategory = 'all';
    searchQuery = '';
    currentSort = 'featured';
    if (catalogSearchInput) catalogSearchInput.value = '';
    if (sortSelect) sortSelect.value = 'featured';
    categoryPills.forEach(pill => {
      if (pill.dataset.category === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });
    renderProducts();
  }

  // --- Event Listeners Setup ---
  function setupEvents() {
    // Cart open/close
    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeCart);

    // Modal close
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeQuickView);
    if (quickviewModal) {
      quickviewModal.addEventListener('click', (e) => {
        if (e.target === quickviewModal) closeQuickView();
      });
    }

    // ESC key closes drawers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeQuickView();
      }
    });

    // Promo button
    if (promoApplyBtn) promoApplyBtn.addEventListener('click', applyPromoCode);
    if (promoInput) {
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyPromoCode();
      });
    }

    // Currency selector
    if (currencySelector) {
      currencySelector.value = currentCurrency;
      currencySelector.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('mya_currency', currentCurrency);
        renderProducts();
        updateCartUI();
        showToast(`Currency switched to ${currentCurrency}`, '💱');
      });
    }

    // Category pills
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.dataset.category;
        renderProducts();
      });
    });

    // Catalog search input
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
      });
    }

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
      });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');

    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileDrawer.classList.add('active');
        drawerBackdrop.classList.add('active');
      });
    }
    if (mobileDrawerClose && mobileDrawer) {
      mobileDrawerClose.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
        drawerBackdrop.classList.remove('active');
      });
    }

    // Newsletter VIP submit
    const newsletterBtn = document.getElementById('newsletter-submit-btn');
    const newsletterInput = document.getElementById('newsletter-email-input');
    const rewardBox = document.getElementById('newsletter-reward-box');

    if (newsletterBtn && newsletterInput) {
      newsletterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = newsletterInput.value.trim();
        if (email && email.includes('@')) {
          if (rewardBox) {
            rewardBox.style.display = 'block';
            rewardBox.innerHTML = `
              🎉 Welcome to the VIP Circle! Use code <strong>MYADIS15</strong> at checkout for 15% off your entire order!
            `;
          }
          showToast('VIP Discount code unlocked: MYADIS15', '🎁');
        } else {
          showToast('Please enter a valid email address', '⚠️');
        }
      });
    }
  }

  // --- Public API for HTML inline triggers ---
  window.MyaApp = {
    quickAdd: function (productId) {
      const product = MYA_PRODUCTS.find(p => p.id === productId);
      if (product) addToCart(product, 1);
    },
    addFromQuickView: function (productId) {
      const product = MYA_PRODUCTS.find(p => p.id === productId);
      if (product) {
        addToCart(product, 1);
        closeQuickView();
      }
    },
    changeQty: function (productId, delta) {
      updateItemQuantity(productId, delta);
    },
    removeItem: function (productId) {
      removeItemFromCart(productId);
    },
    openQuickView: openQuickView,
    switchQvImage: switchQvImage,
    toggleWishlist: toggleWishlist,
    resetFilters: resetFilters,
    filterCategory: function (cat) {
      categoryPills.forEach(pill => {
        if (pill.dataset.category === cat) pill.classList.add('active');
        else pill.classList.remove('active');
      });
      activeCategory = cat;
      renderProducts();
      const catSection = document.getElementById('shop-catalog');
      if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Initialize Application ---
  function init() {
    setupEvents();
    renderProducts();
    updateCartUI();
    updateWishlistUI();
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

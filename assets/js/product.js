/* global $, UI */

const ProductPage = (() => {
  const state = {
    product: null,
    reviews: [],
    sellers: [],
    quantity: 1,
    selectedColor: '',
    selectedSize: '',
  };

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  const getCart = () => storage.get('cart', []);
  const getWishlist = () => storage.get('wishlist', []);
  const getRecent = () => storage.get('recentlyViewed', []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const getId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  };

  const updateRecent = (id) => {
    const recent = getRecent().filter((item) => item !== id);
    recent.unshift(id);
    storage.set('recentlyViewed', recent.slice(0, 8));
  };

  const buildGallery = (images) => {
    const safeImages = images && images.length ? images : ['assets/img/placeholder.svg'];
    const main = `
      <div class="product-gallery-main">
        <img id="mainImage" src="${safeImages[0]}" alt="Product" class="img-fluid rounded" />
      </div>
    `;
    const thumbs = safeImages
      .map(
        (image, index) => `
          <button class="thumb-btn ${index === 0 ? 'active' : ''}" data-image="${image}">
            <img src="${image}" alt="Thumbnail" />
          </button>
        `
      )
      .join('');
    return `${main}<div class="product-gallery-thumbs">${thumbs}</div>`;
  };

  const buildVariants = (product) => {
    const colors = (product.variants && product.variants.color) || [];
    const sizes = (product.variants && product.variants.size) || [];

    const colorHtml = colors.length
      ? colors
          .map(
            (color, index) => `
              <button class="variant-pill color-pill ${index === 0 ? 'active' : ''}" data-value="${color}">${color}</button>
            `
          )
          .join('')
      : '<span class="text-muted small">No color options</span>';

    const sizeHtml = sizes.length
      ? sizes
          .map(
            (size, index) => `
              <button class="variant-pill size-pill ${index === 0 ? 'active' : ''}" data-value="${size}">${size}</button>
            `
          )
          .join('')
      : '<span class="text-muted small">Free size</span>';

    state.selectedColor = colors[0] || '';
    state.selectedSize = sizes[0] || '';

    return `
      <div class="variant-group">
        <div class="small text-muted">Color</div>
        <div class="d-flex flex-wrap gap-2">${colorHtml}</div>
      </div>
      <div class="variant-group mt-3">
        <div class="small text-muted">Size</div>
        <div class="d-flex flex-wrap gap-2">${sizeHtml}</div>
      </div>
    `;
  };

  const buildTabs = () => {
    const reviews = state.reviews
      .map(
        (review) => `
          <div class="review-item">
            <div class="d-flex align-items-center justify-content-between">
              <div class="fw-semibold">${review.title}</div>
              <div class="small text-muted">${review.date}</div>
            </div>
            <div class="small mb-1">${UI.starsHTML(review.stars)} <span class="text-muted">${review.user}</span></div>
            <p class="mb-0">${review.body}</p>
          </div>
        `
      )
      .join('');

    return `
      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-description" type="button" role="tab">Description</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-specs" type="button" role="tab">Specifications</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-reviews" type="button" role="tab">Reviews</button>
        </li>
      </ul>
      <div class="tab-content p-3 border border-top-0 bg-white">
        <div class="tab-pane fade show active" id="tab-description" role="tabpanel">
          <p class="mb-0">High quality ${state.product.title} from ${state.product.brand}. Perfect for daily use.</p>
        </div>
        <div class="tab-pane fade" id="tab-specs" role="tabpanel">
          <ul class="list-unstyled mb-0">
            <li><strong>Brand:</strong> ${state.product.brand}</li>
            <li><strong>Warranty:</strong> ${state.product.warranty}</li>
            <li><strong>Return:</strong> ${state.product.returnDays} Days</li>
            <li><strong>Shipping:</strong> ${state.product.shippingFee === 0 ? 'Free Delivery' : `NPR ${state.product.shippingFee}`}</li>
          </ul>
        </div>
        <div class="tab-pane fade" id="tab-reviews" role="tabpanel">
          ${reviews || '<div class="text-muted">No reviews yet.</div>'}
        </div>
      </div>
    `;
  };

  const buildProductDetail = () => {
    const product = state.product;
    const imagePaths = (product.images && product.images.length)
      ? product.images.map((image) => `../${image}`)
      : ['../assets/img/placeholder.svg'];
    const discountPct = product.discountPct || UI.calcDiscount(product.oldPrice, product.price);
    const seller = state.sellers.find((item) => item.name === product.seller);
    const isWishlisted = getWishlist().includes(product.id);

    $('#mobile-price').text(UI.formatNPR(product.price));

    $('#product-detail').html(`
      <div class="row g-4">
        <div class="col-lg-5">
          ${buildGallery(imagePaths)}
        </div>
        <div class="col-lg-7">
          <div class="product-info card">
            <div class="card-body">
              <h1 class="h4 mb-2">${product.title}</h1>
              <div class="d-flex align-items-center gap-2 mb-2">
                <div>${UI.starsHTML(product.rating)}</div>
                <span class="text-muted">${product.ratingCount} ratings</span>
                <span class="badge bg-light text-dark">${product.brand}</span>
              </div>
              <div class="price-row mb-3">
                <span class="price fs-4">${UI.formatNPR(product.price)}</span>
                <span class="old-price">${product.oldPrice ? UI.formatNPR(product.oldPrice) : ''}</span>
                <span class="discount">${discountPct ? `-${discountPct}%` : ''}</span>
              </div>
              <div class="text-muted small mb-3">Stock: ${product.stock} items available</div>

              <div class="variant-section">
                ${buildVariants(product)}
              </div>

              <div class="quantity-stepper d-flex align-items-center gap-2 mt-3">
                <button class="btn btn-outline-secondary btn-sm" id="qtyMinus">-</button>
                <input type="number" class="form-control form-control-sm qty-input" id="qtyInput" value="${state.quantity}" min="1" />
                <button class="btn btn-outline-secondary btn-sm" id="qtyPlus">+</button>
              </div>

              <div class="d-flex flex-wrap gap-2 mt-3">
                <button class="btn btn-dark" id="btnBuyNow">Buy Now</button>
                <button class="btn btn-outline-dark" id="btnAddCart">Add to Cart</button>
                <button class="btn btn-light ${isWishlisted ? 'active' : ''}" id="btnWishlist" aria-label="Wishlist">
                  <i class="fa-solid fa-heart"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="delivery-card card mt-3">
            <div class="card-body">
              <h6 class="fw-semibold">Delivery Options</h6>
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="small text-muted">Location</div>
                  <div class="fw-semibold">Bagmati, Kathmandu</div>
                </div>
                <button class="btn btn-sm btn-outline-secondary">Change</button>
              </div>
              <div class="mt-3">
                <div class="d-flex align-items-center justify-content-between">
                  <div>Shipping Fee</div>
                  <div class="fw-semibold">${product.shippingFee === 0 ? 'Free' : UI.formatNPR(product.shippingFee)}</div>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-2">
                  <div>Estimated Delivery</div>
                  <div class="fw-semibold">2-4 days</div>
                </div>
                <div class="mt-2">
                  <span class="badge text-bg-success">${product.codAvailable ? 'Cash on Delivery Available' : 'COD Not Available'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="return-card card mt-3">
            <div class="card-body">
              <h6 class="fw-semibold">Return &amp; Warranty</h6>
              <div class="d-flex align-items-center gap-2">
                <i class="fa-solid fa-rotate-left text-success"></i>
                <span>${product.returnDays} Days Free Returns</span>
              </div>
              <div class="d-flex align-items-center gap-2 mt-2">
                <i class="fa-solid fa-shield text-primary"></i>
                <span>Warranty: ${product.warranty}</span>
              </div>
            </div>
          </div>

          <div class="seller-card card mt-3">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-muted small">Sold by</div>
                  <div class="fw-semibold">${product.seller}</div>
                </div>
                <button class="btn btn-sm btn-outline-dark">Chat</button>
              </div>
              <div class="seller-stats mt-3">
                <div class="stat">Positive Rating <strong>${seller ? seller.ratingPct : 90}%</strong></div>
                <div class="stat">Ship on Time <strong>${seller ? seller.shipOnTimePct : 88}%</strong></div>
                <div class="stat">Chat Response <strong>${seller ? seller.chatResponsePct : 85}%</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        ${buildTabs()}
      </div>
    `);
  };

  const addToCart = () => {
    const id = state.product.id;
    const variant = { color: state.selectedColor, size: state.selectedSize };

    if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
      Cart.add(id, variant, state.quantity);
    } else {
      const cart = getCart();
      const key = `${id}|${variant.color || ''}|${variant.size || ''}`;
      const existing = cart.find((item) => item.key === key);
      if (existing) {
        existing.qty += state.quantity;
      } else {
        cart.push({ key, productId: id, qty: state.quantity, variant });
      }
      storage.set('cart', cart);
      $(document).trigger('cart:updated', [cart]);
    }

    if (UI && UI.showToast) UI.showToast('Added to cart', 'success');
    updateCartCount();
  };

  const bindEvents = () => {
    $('#product-detail').on('click', '.thumb-btn', function () {
      const image = $(this).data('image');
      $('#mainImage').attr('src', image);
      $('.thumb-btn').removeClass('active');
      $(this).addClass('active');
    });

    $('#product-detail').on('click', '.color-pill', function () {
      $('.color-pill').removeClass('active');
      $(this).addClass('active');
      state.selectedColor = $(this).data('value');
    });

    $('#product-detail').on('click', '.size-pill', function () {
      $('.size-pill').removeClass('active');
      $(this).addClass('active');
      state.selectedSize = $(this).data('value');
    });

    $('#product-detail').on('click', '#qtyMinus', () => {
      state.quantity = Math.max(1, state.quantity - 1);
      $('#qtyInput').val(state.quantity);
    });

    $('#product-detail').on('click', '#qtyPlus', () => {
      state.quantity += 1;
      $('#qtyInput').val(state.quantity);
    });

    $('#product-detail').on('change', '#qtyInput', function () {
      const value = Number($(this).val()) || 1;
      state.quantity = Math.max(1, value);
      $(this).val(state.quantity);
    });

    $('#product-detail').on('click', '#btnAddCart', addToCart);
    $('#mobile-add-cart').on('click', addToCart);

    $('#product-detail').on('click', '#btnBuyNow', () => {
      addToCart();
      window.location.href = 'checkout.html';
    });

    $('#product-detail').on('click', '#btnWishlist', function () {
      const wishlist = getWishlist();
      const index = wishlist.indexOf(state.product.id);
      if (index >= 0) {
        wishlist.splice(index, 1);
        if (UI && UI.showToast) UI.showToast('Removed from wishlist', 'secondary');
      } else {
        wishlist.unshift(state.product.id);
        if (UI && UI.showToast) UI.showToast('Saved to wishlist', 'primary');
      }
      storage.set('wishlist', wishlist);
      $(this).toggleClass('active');
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'product') return;

    const id = getId();
    if (!id) {
      $('#product-detail').html('<div class="text-muted">Product not found.</div>');
      return;
    }

    $('#product-detail').html('<div class="text-muted">Loading product details...</div>');

    $.when(
      $.getJSON('../assets/data/products.json'),
      $.getJSON('../assets/data/reviews.json'),
      $.getJSON('../assets/data/sellers.json')
    )
      .done((productsRes, reviewsRes, sellersRes) => {
        const products = productsRes[0];
        state.reviews = reviewsRes[0];
        state.sellers = sellersRes[0];
        state.product = products.find((item) => item.id === id);

        if (!state.product) {
          $('#product-detail').html('<div class="text-muted">Product not found.</div>');
          return;
        }

        updateRecent(state.product.id);

        state.reviews = state.reviews.filter((review) => review.productId === state.product.id);

        $('#product-breadcrumb').html(`
          <li class="breadcrumb-item"><a href="home.html">Home</a></li>
          <li class="breadcrumb-item"><a href="category.html?cat=${encodeURIComponent(state.product.category)}">${state.product.category}</a></li>
          <li class="breadcrumb-item active" aria-current="page">${state.product.title}</li>
        `);

        buildProductDetail();
        updateCartCount();
      })
      .fail(() => {
        $('#product-detail').html('<div class="text-danger">Unable to load product data.</div>');
      });

    bindEvents();
  };

  return { init };
})();

$(ProductPage.init);

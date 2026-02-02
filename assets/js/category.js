/* global $, UI */

const CategoryPage = (() => {
  const state = {
    products: [],
    filtered: [],
    page: 1,
    pageSize: 12,
    category: null,
    subcategory: null,
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

  const getWishlist = () => storage.get('wishlist', []);
  const getCart = () => storage.get('cart', []);

  const updateCartCount = () => {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      cat: params.get('cat'),
      sub: params.get('sub'),
    };
  };

  const normalize = (value) => (value || '').toLowerCase();

  const enrichProduct = (product, wishlistSet) => {
    const image = product.images && product.images.length
      ? `../${product.images[0]}`
      : '../assets/img/placeholder.svg';
    const discountPct = product.discountPct || UI.calcDiscount(product.oldPrice, product.price);
    return {
      ...product,
      discountPct,
      image,
      priceText: UI.formatNPR(product.price),
      oldPriceText: product.oldPrice ? UI.formatNPR(product.oldPrice) : '',
      discountText: discountPct ? `-${discountPct}%` : '',
      ratingHTML: UI.starsHTML(product.rating),
      wishlistActive: wishlistSet.has(product.id) ? 'active' : '',
    };
  };

  const productCardTemplate = `
    <div class="col-6 col-md-4">
      <div class="card product-card h-100" data-id="{{id}}">
        <div class="product-thumb position-relative ratio ratio-1x1">
          <a href="product.html?id={{id}}" class="product-link" data-id="{{id}}">
            <img src="{{image}}" alt="{{title}}" class="img-fluid" />
          </a>
          <button class="btn btn-sm btn-light wishlist-btn {{wishlistActive}}" data-id="{{id}}" aria-label="Toggle wishlist">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="card-body">
          <h3 class="product-title mb-2">{{title}}</h3>
          <div class="price-row">
            <span class="price">{{priceText}}</span>
            <span class="old-price">{{oldPriceText}}</span>
            <span class="discount">{{discountText}}</span>
          </div>
          <div class="rating-row small">{{ratingHTML}} <span class="text-muted ms-1">({{ratingCount}})</span></div>
        </div>
        <div class="card-footer bg-white border-0">
          <button class="btn btn-outline-dark btn-sm w-100 btn-add-cart" data-id="{{id}}">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  const buildBrandFilters = (products) => {
    const brands = Array.from(new Set(products.map((item) => item.brand))).sort();
    const list = brands
      .map((brand) => `
        <div class="form-check">
          <input class="form-check-input brand-filter" type="checkbox" value="${brand}" id="brand-${brand.replace(/\s+/g, '-')}">
          <label class="form-check-label" for="brand-${brand.replace(/\s+/g, '-')}">${brand}</label>
        </div>
      `)
      .join('');
    $('#brandFilters').html(list || '<div class="text-muted small">No brands</div>');
  };

  const applyFilters = () => {
    const minPrice = Number($('#minPrice').val()) || 0;
    const maxPrice = Number($('#maxPrice').val()) || Number.MAX_SAFE_INTEGER;
    const selectedBrands = $('.brand-filter:checked')
      .map((_, el) => $(el).val())
      .get();
    const rating = Number($('input[name="rating"]:checked').val());
    const inStockOnly = $('#inStockOnly').is(':checked');
    const localOnly = $('#localOnly').is(':checked');

    state.filtered = state.products.filter((product) => {
      const priceOk = product.price >= minPrice && product.price <= maxPrice;
      const brandOk = !selectedBrands.length || selectedBrands.includes(product.brand);
      const ratingOk = rating === 0 || product.rating >= rating;
      const stockOk = !inStockOnly || product.stock > 0;
      const localOk = !localOnly || product.location.toLowerCase().includes('kathmandu') || product.location.toLowerCase().includes('lalitpur');
      return priceOk && brandOk && ratingOk && stockOk && localOk;
    });

    state.page = 1;
    render();
  };

  const applySorting = (list) => {
    const sort = $('#sortSelect').val();
    const sorted = [...list];
    if (sort === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  };

  const paginate = (list) => {
    const start = (state.page - 1) * state.pageSize;
    return list.slice(start, start + state.pageSize);
  };

  const renderPagination = (total) => {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const pagination = $('#pagination');
    pagination.empty();

    for (let i = 1; i <= totalPages; i += 1) {
      const item = `
        <li class="page-item ${i === state.page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
      pagination.append(item);
    }
  };

  const render = () => {
    const list = applySorting(state.filtered);
    const paged = paginate(list);
    const wishlistSet = new Set(getWishlist());
    const grid = $('#product-grid');

    if (!paged.length) {
      grid.html('<div class="col-12 text-muted">No products found for selected filters.</div>');
      $('#result-count').text(0);
      renderPagination(0);
      return;
    }

    const markup = paged
      .map((product) => UI.renderTemplate(productCardTemplate, enrichProduct(product, wishlistSet)))
      .join('');

    grid.html(markup);
    $('#result-count').text(list.length);
    renderPagination(list.length);
  };

  const bindEvents = () => {
    $('#minPrice, #maxPrice').on('input', applyFilters);
    $(document).on('change', '.brand-filter', applyFilters);
    $('input[name="rating"]').on('change', applyFilters);
    $('#inStockOnly, #localOnly').on('change', applyFilters);
    $('#sortSelect').on('change', render);

    $('#clearFilters').on('click', () => {
      $('#minPrice').val('');
      $('#maxPrice').val('');
      $('.brand-filter').prop('checked', false);
      $('#ratingAll').prop('checked', true);
      $('#inStockOnly').prop('checked', false);
      $('#localOnly').prop('checked', false);
      applyFilters();
    });

    $('#pagination').on('click', 'a', function (event) {
      event.preventDefault();
      const page = Number($(this).data('page'));
      if (!Number.isNaN(page)) {
        state.page = page;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    $(document).on('click', '.btn-add-cart', function () {
      const id = $(this).data('id');
      if (typeof Cart !== 'undefined' && typeof Cart.add === 'function') {
        Cart.add(id, { color: '', size: '' }, 1);
      } else {
        const cart = getCart();
        const key = `${id}||`;
        const existing = cart.find((item) => item.key === key);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ key, productId: id, qty: 1, variant: { color: '', size: '' } });
        }
        storage.set('cart', cart);
        $(document).trigger('cart:updated', [cart]);
      }
      if (UI && UI.showToast) UI.showToast('Added to cart', 'success');
      updateCartCount();
    });

    $(document).on('click', '.wishlist-btn', function () {
      const id = $(this).data('id');
      if (typeof Wishlist !== 'undefined' && typeof Wishlist.toggle === 'function') {
        Wishlist.toggle(id);
      } else {
        const wishlist = getWishlist();
        const index = wishlist.indexOf(id);
        if (index >= 0) {
          wishlist.splice(index, 1);
        } else {
          wishlist.unshift(id);
        }
        storage.set('wishlist', wishlist);
        $(document).trigger('wishlist:updated', [wishlist]);
      }
      $(this).toggleClass('active');
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'category') return;

    const params = getParams();
    state.category = params.cat;
    state.subcategory = params.sub;

    $('#product-grid').html('<div class="col-12 text-muted">Loading products...</div>');

    $.getJSON('../assets/data/products.json')
      .done((products) => {
        state.products = products.filter((product) => {
          const catMatch = state.category ? normalize(product.category) === normalize(state.category) : true;
          const subMatch = state.subcategory ? normalize(product.subcategory) === normalize(state.subcategory) : true;
          return catMatch && subMatch;
        });

        const title = state.subcategory || state.category || 'All Products';
        $('#category-title').text(title);
        $('#breadcrumb-category').text(title);

        buildBrandFilters(state.products);
        state.filtered = [...state.products];
        render();
      })
      .fail(() => {
        $('#product-grid').html('<div class="col-12 text-danger">Unable to load products.</div>');
      });

    bindEvents();
  };

  return { init };
})();

$(CategoryPage.init);

/* global $, Auth, Store */

const App = (() => {
  const getBasePath = () => {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '..' : '.';
  };

  const loadPartials = () => {
    const base = getBasePath();
    $('#site-header').load(`${base}/partials/header.html`, () => {
      $(document).trigger('header:loaded');
    });
    $('#site-footer').load(`${base}/partials/footer.html`, () => {
      $(document).trigger('footer:loaded');
    });
    $('#mobile-nav').load(`${base}/partials/mobile-nav.html`, () => {
      $(document).trigger('mobile-nav:loaded');
    });
  };

  const updateCartCount = () => {
    if (typeof Store !== 'undefined' && Store.Cart) {
      $('.cart-count').text(Store.Cart.total());
    }
  };

  const wireSearch = () => {
    $(document).on('submit', '.search-form', (event) => {
      event.preventDefault();
      const query = $(event.currentTarget).find('input[type="search"]').val().trim();
      if (!query) return;
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
  };

  const buildMegaMenu = (categories) => {
    const list = $('.categories-list ul');
    if (!list.length) return;
    list.empty();

    categories.forEach((category, index) => {
      const item = $(
        `<li><a href="#" data-cat="${category.name}" class="${index === 0 ? 'active' : ''}">${category.name}</a></li>`
      );
      list.append(item);
    });

    const panel = $('.mega-panel');
    const renderPanel = (category) => {
      if (!panel.length) return;
      if (!category) {
        panel.html('<div class="p-4 text-muted small">Hover a category to see subcategories.</div>');
        return;
      }
      const sub = category.subcategories || [];
      const subMarkup = sub
        .map(
          (item) => `<a href="category.html?cat=${encodeURIComponent(category.name)}&sub=${encodeURIComponent(item)}" class="subcat-link">${item}</a>`
        )
        .join('');
      panel.html(`
        <div class="p-4">
          <div class="fw-semibold mb-2">${category.name}</div>
          <div class="subcat-grid">${subMarkup || '<span class="text-muted">No subcategories</span>'}</div>
        </div>
      `);
    };

    renderPanel(categories[0]);

    list.on('mouseenter', 'a', function () {
      const name = $(this).data('cat');
      list.find('a').removeClass('active');
      $(this).addClass('active');
      const category = categories.find((cat) => cat.name === name);
      renderPanel(category);
    });
  };

  const wireCategoryClicks = () => {
    $(document).on('click', '.categories-list a', function (event) {
      event.preventDefault();
      const cat = $(this).data('cat');
      if (!cat) return;
      window.location.href = `category.html?cat=${encodeURIComponent(cat)}`;
    });
  };

  const initMegaMenu = () => {
    $.getJSON(`${getBasePath()}/assets/data/categories.json`)
      .done((categories) => {
        buildMegaMenu(categories);
      })
      .fail(() => {
        // keep default
      });
  };

  const init = () => {
    loadPartials();
    wireSearch();
    wireCategoryClicks();

    $(document).on('header:loaded', () => {
      initMegaMenu();
      updateCartCount();
      if (Auth && Auth.init) Auth.init();
    });

    $(document).on('cart:updated', updateCartCount);
  };

  return { init, getBasePath, loadPartials };
})();

$(App.init);

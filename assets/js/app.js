/* global $, Auth, Store */

const App = (() => {
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

  const initMegaMenu = () => {
    const list = $('.categories-list ul');
    const panels = $('.subcat-panel');
    if (!list.length || !panels.length) return;

    const showPanel = (cat) => {
      panels.addClass('d-none');
      panels.filter(`[data-cat="${cat}"]`).removeClass('d-none');
    };

    const first = list.find('a').first();
    if (first.length) {
      list.find('a').removeClass('active');
      first.addClass('active');
      showPanel(first.data('cat'));
    }

    list.on('mouseenter', 'a', function () {
      list.find('a').removeClass('active');
      $(this).addClass('active');
      showPanel($(this).data('cat'));
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

  const init = () => {
    wireSearch();
    wireCategoryClicks();

    initMegaMenu();
    updateCartCount();
    if (Auth && Auth.init) Auth.init();
    $(document).trigger('header:loaded');

    $(document).on('cart:updated', updateCartCount);
  };

  return { init };
})();

$(App.init);

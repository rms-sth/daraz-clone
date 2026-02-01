/* global $ */

const App = (() => {
  const getBasePath = () => {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '..' : '.';
  };

  const loadPartials = () => {
    const base = getBasePath();
    $('#site-header').load(`${base}/partials/header.html`);
    $('#site-footer').load(`${base}/partials/footer.html`);
    $('#mobile-nav').load(`${base}/partials/mobile-nav.html`);
  };

  const init = () => {
    loadPartials();
  };

  return { init, getBasePath, loadPartials };
})();

$(App.init);

/* global $ */

const LoginPage = (() => {
  const init = () => {
    if ($('body').data('page') !== 'login') return;

    $('#loginForm').on('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      const result = Auth.login(data.identifier.trim(), data.password.trim());
      const messageEl = $('#loginMessage');
      if (result.ok) {
        messageEl.text('Login successful! Redirecting...').removeClass('text-danger').addClass('text-success');
        setTimeout(() => {
          window.location.href = 'account.html';
        }, 800);
      } else {
        messageEl.text(result.message).removeClass('text-success').addClass('text-danger');
      }
    });
  };

  return { init };
})();

$(LoginPage.init);

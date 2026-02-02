/* global $ */

const SignupPage = (() => {
  const init = () => {
    if ($('body').data('page') !== 'signup') return;

    $('#signupForm').on('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      const messageEl = $('#signupMessage');
      if (data.password !== data.confirm) {
        messageEl.text('Passwords do not match.').removeClass('text-success').addClass('text-danger');
        return;
      }

      const result = Auth.register({
        name: data.name.trim(),
        identifier: data.identifier.trim(),
        password: data.password.trim(),
      });

      if (result.ok) {
        messageEl.text('Account created! Redirecting...').removeClass('text-danger').addClass('text-success');
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

$(SignupPage.init);

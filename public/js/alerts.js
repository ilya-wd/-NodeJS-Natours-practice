/* esling-disable */

export const hideAlert = () => {
  // hideAlert();
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
  window.setTimeout(hideAlert, 5000);
};

// type is 'success' or 'error'
// Custom css design for the alert
export const showAlert = (type, msg) => {
  const markup = `<div class = "alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
};

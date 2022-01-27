/* esling-disable */
import '@babel/polyfill'; // polyfilling some features of JS so that they will work in older browsers
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { booktTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
// const loginForm = document.querySelector('.login-form'); //change to '.from--login' on lecture 194?
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// VALUES
// We might need them for other stuff than eg document.querySelector('.form') so we brought them here

// this piece of code can cause errors on pages without 'map' element
// DELEGATION
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

// Fires whenever user clicks on submit button
// TO get data from UI and delegate the actions
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    // prevent the form from loading any other page
    e.preventDefault();
    // WE can read these 2 values below only when they are defined - after the page loads - so they're defined in the email listener
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // programmatically recreating multi-part form data
    const form = new FormData();
    // appending data on that FormData object
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    // Before we introduced form
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Giving users the feedback on progress - that sth is going on
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // resetting password input fields
    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset; // desctructuring <=> tourId = e.target.dataset.tourId
    booktTour(tourId);
  });

/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  console.log('LOGIN');
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      // specifying data that we send along with request
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      // alert('Logged in successfully!');
      // Instead of JS alert we showing our own alert
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    // If we dont reload the page (true), then the old version from cache can still upload, with menu as if user was signed in
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};

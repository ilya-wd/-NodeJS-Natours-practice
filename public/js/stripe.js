import axios from 'axios';
import { showAlert } from './alerts';

// tourId comes from index.js where we call this bookTour
export const booktTour = async (tourId) => {
  // using public key here - for the frontend script
  // declaration at the top of the script didn't work for me
  const stripe = Stripe(
    'pk_test_51KMGnVKChg5D3f3b6Qtpe5QqQdYPEVsIkgxrOyOaQppci8VevKplOyhUF2VrN8cmuGi2L344V0L9K8eGGghY0RP500PcOyMQZ7'
  );

  try {
    // 1) Get checkout session from endpoint/API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // 2) Create checkout form + charge credit card for us
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });

    console.log(session);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

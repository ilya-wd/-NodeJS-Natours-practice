const express = require('express');
const bookingController = require('./../controllers/bookingController.js');
const authController = require('./../controllers/authController');

const router = express.Router();

// Using protect middleware outside, so we can remove this middleware from the routes below
router.use(authController.protect);

// Route for the clients to check out
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;

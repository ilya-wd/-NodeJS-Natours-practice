const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create a checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, // url that'll be called as soon as the payment will be successful
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // customer goes to where they were previously
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, // pass data about the session that we're creating, so we can get access to the session object again
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`http://127.0.0.1:3000/img/tours/${tour.imageCover}`], // should be hosted on the web once in production
        amount: tour.price * 100, // amount is expected to be in cents
        currency: 'usd',
        quantity: 1, // one tour
      },
    ],
  });

  // 3) Send sesion as response to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

// creating new booking in a database
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without payment
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  // creating new document in a database
  await Booking.create({ tour, user, price });

  // redirecting app to a certain URL
  // We're hitting the same middleware - .createBookingCheckout -for the second time...
  // ... but now tour, user & price are no longer defined, so we'll go the next middlewer
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking); // get one booking; available to admins, find by id and get info on who bokked and what
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// const AppError = require('../utils/appError');
const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// An extra middleware to use our factory function
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes. So user can specify manually tour and user id
  // If we didn't specify tourID and the body, then we define it as one coming from URL
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

const express = require('express');
const tourController = require('./../controllers/tourController.js');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// Creating a router as a module as per express documentation
// It is also a middleware - JOnas said
const router = express.Router();

// Param middleware - for a specific parameter. In our case, "id"
// val - value of a parameter in question
// router.param('id', tourController.checkID);

// POST /tour/234fad4/reviews - post review to a certain tour
// GET /tour/234fad4/reviews - get all reviews for a certain tour
// GET /tour/234fad4/reviews/osd23f - get a certain review for a certain tour

// Meaning for this specific router we want to use reviewRouter
// But as it is the reviewRouter doesn't get access to tourId param
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.isLoggedIn,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-distance?distance=233&center=-40,45,unit=mi
// /tours-distance/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.isLoggedIn,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.isLoggedIn,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.isLoggedIn,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

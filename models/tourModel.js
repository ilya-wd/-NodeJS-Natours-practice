const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have min 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be above 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //  this. nly points to current doc on NEW document creation
        validator: function (val) {
          return value < this.price; // 250 < 200
        },
        message: 'Discount price ({VALUE}) must be below the regular price',
      },
    },
    summary: {
      type: String,
      // Used to remove all the whitespace in the beginning
      trim: true,
      required: [true, 'A tour must have a description (summary?)'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // We store a referece - common practice. Instead of an image
      type: String,
      required: [true, ' A tour must have a cover image'],
    },
    images: [String], // an array of strings
    createdAt: {
      type: Date,
      default: Date.now(), // Gives us miliseconds, but Mongo auto converts it
      select: false,
    },
    startDates: [Date], // Array of dates - different dates when a tour starts
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point', // can be polygons, lines or other geomtry, Though for a strting point should be point
        enum: ['Point'], // only one options here
      },
      coordinates: ['Number'], // means we expect an array of numbers
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point', // can't be anything but point!
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  // options part of Schema
  {
    toJSON: { virtuals: true }, // each time data is output as JSON we want virtuals to be true - visible
    toObject: { virtuals: true },
  }
);

// price: 1 means we sort price in ascending order
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// A special index for geospatial objects
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  // this. points to the current document
  // Regular function because we need this. keyword?
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review', // the name of the model
  foreignField: 'tour', // name of the field in the other model, where ref (ID) to the current model is stored
  localField: '_id', // same for the current model - where that ID is stored in this current Tour model.
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create(). But NOT before insertMany()
tourSchema.pre('save', function (next) {
  // this. points to the CURRENTLY PROCESSED DOCUMENT - that's why it's docuemnt middleware
  // need to define slug in our schema
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   // map will return an array full of promises since it's an async function
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// // POST middleware has access to the document that's just been saved AND next()
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  // this. point to the query
  // not equal - true. same as secretTour: false
  // console.log(this);
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// Reg ex here  means post anything that starts with find
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

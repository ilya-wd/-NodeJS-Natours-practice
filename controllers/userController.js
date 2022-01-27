const User = require('./../models/userModel');
const multer = require('multer');
const sharp = require('sharp'); // image processing library, for resizing
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   // destination is a callback function that gets acces to another cb function, like next in express
//   destination: (req, file, cb) => {
//     // null error = no error
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-878797sdgsg79(id)-258080435(timestamp).jpeg(file extension). Guarenteeing there's only unique file names
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// ORIGINAL
// image saved as a buffer which is avaialble at req.file.buffer - keeping image in memoery so we can read it
// buffer instead of directly to the file system
const multerStorage = multer.memoryStorage();

// Testing if upload file is an image: True or False
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.'), false);
  }
};

// considering multer upload; will use upload to create middleware
// here we specify the destination
// const upload = multer({ dest: 'public/img/users' });

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// in upload middleware we specify the name of the field that will be holding the file
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // we need to define the filename of the file
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error is user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Adding photo property to the obj that's going to be updated
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Udate user document
  // We use 'filteredBody' instead of body so that user can't change for example role with body.role: 'admin'
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  // 500 - internal server error
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    // Converting our config value to miliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Set cookie as https only in production mode with secure = true
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //Solving problem of receiving encrypted password in response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    photo: req.body.photo,
  });

  // req.protocl - http or httpS
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  // wait for it, then move to the next step
  await new Email(newUser, url).sendWelcome();

  // Replaces commented out section
  createSendToken(newUser, 201, res);
  // id, string for our secret, option when JWT should expire
  // environment variable - no need to require/import it
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  // Destructuring
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Pleasee provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  // {email} = {email: email}
  // Select helps us explicitly select password. + meaning that it's not selected by default
  // Otherwise we won't have access to password - user deosn;t contain it
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  // Replaces commented out section
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

// In here, we use the same precautions as in the logging in
// But we don't send here any sensitive data - so we could do without them
// "With token based auth we normally don't need it. But if we want to be super secure - we do"
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expirse: new Date(Date.now() + 10 * 1000),
    htppOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for render pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // try for the case when there's no logged in user
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded);

      // 2) Check if user still exists
      // If we reach it, means token has NOT been changed
      // Works because we have id in payload - this is where we get our user
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // Code only ever reaches this point if everything is correct
      res.locals.user = currentUser;
      req.user = currentUser; // added by advice from lecture 194 comments
      return next();
    } catch (err) {
      // = if there's no logged in user - we go to the next middleware
      return next();
    }
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles - array eg ['admin', 'lead-guide]. Role = 'user'
    // Get req.uer from a preceding middleware
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You don't have permission to perform this action`, 403)
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate the random reset token
  // Separate this part in its own function, as an instance method (common for Mongoose)
  const resetToken = user.createPasswordResetToken();
  // before this stage we only modified data. Now we saved it, too
  // and deactivating all validators that we specified in our schema
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (you have 10 min)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token. Encrypt the token and compare it to database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Also checking for expiration
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 2) If token has not expired, and there's user, set the new password
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JMT
  // Replaces commented out section
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  // Looks like user is logging in at this stage - passwordConfirm here
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.FindByIdAndUpadte WON'T WORK
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

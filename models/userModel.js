const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    // transforms email into lowercase
    lowercase: true,
    // jonas@gmail.com GOOD. jonas@gmail BAD
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password NOW!!!!!'],
    validate: {
      // This only works on SAVE and CREATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, // you only have 10 mins to reset it
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// A pre hook on save - pre-save middleware
userSchema.pre('save', async function (next) {
  // If the password has not been modified - let's call another function = next()
  if (!this.isModified('password')) return next();

  //Has the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // We don't need this field after a user confirmed the password
  this.passwordConfirm = undefined;

  next();
});

// Done before a document's saved
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Making sure that only ACTIVE users will be displayed during queries - eg get user or get all users
// not equal false - because our users we created before this lesson don't have neither active:true nor active:false.
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// An instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Another instance
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp; // 100 < 200 = true = changed. 300<200 = false = not changed
  }

  // False = NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // we gonna send this token to the user. Only user has access to it -> it acts as a password -> we don't store it
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // sending it by email. Sending an unencrypted one. Encrypted - in our database
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

var utilities = require('../utilities/utilities');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({
  user_name: { type: String, unique: true, required: true },
  email: { type: String, unique:true, lowercase:true, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'user', required: false },
  verified: {type: Boolean, default: false, required: false },
  emailToken: {type: String, required: false, select: false },
  banned_until: {type: Date, default: Date.now(), required: false },
  blacklisted: {type: Boolean, default: false, required: false },
  gender: {type: String, default: 'male', required: false },
  shareEmail: {type: Boolean, default: false, required: false },
  language: {type: String, default: 'en', required: false },
  theme: {type: String, default: 'light', required: false },
  customTheme: {type: Array, default: [0, 0, 0, 0], required: false }

});

// Virtual for users's URL
UserSchema.virtual('url').get(function () { return `/users/${this._id}`; });

UserSchema.pre('save', async function (next) { 
  var User = this;
  var hashedPassword = await utilities.hashString(process.env.SALT_ROUNDS, User.password);
  if(!User.isModified('password')) return next();
  User.password = hashedPassword;
  next();
});

// Export model
module.exports = mongoose.model('User', UserSchema, 'Users');

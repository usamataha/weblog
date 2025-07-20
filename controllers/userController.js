var asyncHandler = require('express-async-handler');
var { validationResult } = require('express-validator');
var User = require('../models/user');
var utilities = require('../utilities/utilities');

// Display User sign-up form on GET.
exports.userSignup_get = asyncHandler(async (req, res) => { res.render('userSignup') });

// Handle user sign up on POST.
exports.userSignup_post = asyncHandler(async (req, res) => {
    var validatorErrors = validationResult(req); // Extract the validation errors from a request.
    if (!validatorErrors.isEmpty()) { 
      res.render('userSignup', { validatorErrors: validatorErrors.array() });
      return;
    }
    else {
      // Create user and send verification email
      var emailToken = utilities.randomHexString(32);
      var new_user = new User({ 
        user_name: req.body.user_name,
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        emailToken: emailToken });
      await new_user.save();

      var environment = process.env.NODE_ENV || 'development';
      const siteURL = (environment === 'development')? process.env.SITE_URL_LOCAL : process.env.SITE_URL;

      var verificationUrl = siteURL + '/users/' + new_user.id + '/verify/' + emailToken;
      var htmlContent= '<p>&emsp; Thank you for registering! Please follow this <a href=' +
      verificationUrl + '> link </a> to verify your email.</p><p>Or copy/paste: (' +
      verificationUrl + ')</p>'
      await utilities.sendEMail(req.body.email, 'Verify Your Email', htmlContent);

      res.redirect('/users/login');
    }
});

// Handle User verify on GET.
exports.userVerify_get = asyncHandler(async (req, res) => {
  await res.locals.weblogUser.updateOne({verified: true});
  res.redirect(req.get('Referrer') || '/');
});

// Display User login form on GET.
exports.userLogin_get = asyncHandler(async (req, res) => { res.render('userLogin'); });

// Handle User login form on POST.
exports.userLogin_post = asyncHandler(async (req, res) => { 
  // Save a token to the response head as a cookie
  var cookieOptions = {
    maxAge: process.env.COOKIE_TIMEOUT_MILLISECONDS,
    httpOnly: true,     // Forbids JavaScript from accessing the cookie
    secure: true,       // If true, cookie is sent only through the HTTPS scheme except for localhost
    sameSite: 'Strict'  // Sends cookie only to the same site that set it (requires 'secure')
  }
  res.cookie(process.env.COOKIE_NAME, 
    utilities.generateJWT(res.locals.weblogUser._id.toJSON(), process.env.COOKIE_KEY),
    cookieOptions);
    var minutes = parseInt(process.env.COOKIE_TIMEOUT_MILLISECONDS / 60000);
    res.json([minutes, res.locals.weblogUser]);
});

// Handle User refresh session on GET.
exports.userRefreshSession_get = asyncHandler(async (req, res) => { 
  // Save a token to the response head as a cookie
  var cookieOptions = {
    maxAge: process.env.COOKIE_TIMEOUT_MILLISECONDS,
    httpOnly: true,     // Forbids JavaScript from accessing the cookie
    secure: true,       // If true, cookie is sent only through the HTTPS scheme except for localhost
    sameSite: 'Strict'  // Sends cookie only to the same site that set it (requires 'secure')
  }
  res.cookie(process.env.COOKIE_NAME, 
    utilities.generateJWT(res.locals.weblogActiveUser._id.toJSON(), process.env.COOKIE_KEY),
    cookieOptions);
    var minutes = parseInt(process.env.COOKIE_TIMEOUT_MILLISECONDS / 60000);
    res.json(minutes);
});

// Handle User dashboard on GET.
exports.userDashboard_get = asyncHandler(async (req, res) => { 
  res.render('userDashboard', {user: res.locals.weblogActiveUser});
});

// Handle User dashboard on POST.
exports.userDashboard_post = asyncHandler(async (req, res) => { 

  // Check if a new password is provided
  if (req.body.password !=='' ) {
    if (req.body.password !== req.body.confirm_password ) { res.status(400).json('Password and confirmation do not match'); return; }
    if (req.body.password.length < 8 ||  req.body.password.length > 24) { res.status(400).json('8 ≤ Password length ≤ 24'); return; }
    let pattern = new RegExp( "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-+_!@#$%^&*.,?]).+$");
    if (!pattern.test(req.body.password)) { res.status(400).json('Alphanumeric password with at least 1 symbol, 1 Uppercase & lowercase letter'); return; }

    // Save the new password. The pre hook that hashes the password works with the save method only.
    res.locals.weblogActiveUser.password = req.body.password;
    await res.locals.weblogActiveUser.save();
  }

  await res.locals.weblogActiveUser.updateOne({
    gender: ((!req.body.gender)? 'male' : req.body.gender),
    shareEmail: ((!req.body.shareEmail)? false : true),
    language: ((!req.body.language)? 'en' : req.body.language),
    theme: ((!req.body.theme)? 'light' : req.body.theme),
    customTheme: [req.body.rgb[0], req.body.rgb[1], req.body.rgb[2], req.body.invert]
  });

  // Allow the user to update then send it back to browser
  var user = await User.findById(res.locals.weblogActiveUser.id);
  res.json(user);
});


// Handle User logout on GET.
exports.userLogout_get = asyncHandler(async (req, res) => { 
  res.setHeader('Clear-Site-Data', '"*"');
  res.redirect(req.get('Referrer') || '/');
});

// Display User password reset form on GET.
exports.userResetPassword_get = asyncHandler(async (req, res) => { res.render('userResetPass'); });

// Handle User password reset form on POST.
exports.userResetPassword_post = asyncHandler(async (req, res) => { 
  var environment = process.env.NODE_ENV || 'development';
  const siteURL = (environment === 'development')? process.env.SITE_URL_LOCAL : process.env.SITE_URL;

  var resetUrl = siteURL + "/users/" + res.locals.weblogUser._id + "/reset/" + res.locals.weblogUser.emailToken;
  var htmlContent= '<p>&emsp; Here\'s your rest password: <a href="'+ resetUrl + 
  '"> link </a></p><p>Or copy/paste: ( ' + resetUrl + 
  ' )</p><p>By using this link, you will recieve a new random password. Use it to log in, then assign a new one.</p>'
  await utilities.sendEMail(res.locals.weblogUser.email, 'Password reset request', htmlContent);

  res.redirect(req.get('Referrer') || '/');
});

// Handle Password reset on GET.
exports.userPassReset_get = asyncHandler(async (req, res) => {
  var newPassword = utilities.randomHexString(8);
  var hasedPassword = await utilities.hashString(process.env.SALT_ROUNDS, newPassword);
  
  await res.locals.weblogUser.updateOne({password: hasedPassword});

  var htmlContent= '<p>&emsp; Here\'s your new password: <br>' + newPassword + 
  '</p><br><p>Please assign a new one ASAP.</p>'
  await utilities.sendEMail(res.locals.weblogUser.email, 'New Password', htmlContent);

  res.redirect('/users/login');
});

// Display Users list on GET.
exports.usersList = asyncHandler(async (req, res) => {
  var allUsers = await User.find().select('+emailToken');
  var timeStamps = [allUsers.length];
  var dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' });
  for (let i = 0; i < allUsers.length; i++) { 
    timeStamps[i] = dateFormat.format(allUsers[i]._id.getTimestamp());
  }
  var banDuration = process.env.BAN_DURATION_MILLISECONDS;
  res.render('usersList', { users: allUsers, created: timeStamps, banDuration: banDuration });
});

// Handle User promotion on GET.
exports.userPromote_get = asyncHandler(async (req, res) => { 
  if (res.locals.weblogUser.role === 'user') await res.locals.weblogUser.updateOne({role: 'admin'});
  else if (res.locals.weblogUser.role === 'admin') await res.locals.weblogUser.updateOne({role: 'moderator'});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User demotion on GET.
exports.userDemote_get = asyncHandler(async (req, res) => { 
  if (res.locals.weblogUser.role === 'admin') await res.locals.weblogUser.updateOne({role: 'user'});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User ban on GET.
exports.userBan_get = asyncHandler(async (req, res) => { 
  var banDuration =+ process.env.BAN_DURATION_MILLISECONDS
  await res.locals.weblogUser.updateOne({banned_until: Date.now() + banDuration, role:'user'});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User unban on GET.
exports.userUnban_get = asyncHandler(async (req, res) => { 
  await res.locals.weblogUser.updateOne({banned_until: Date.now()});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User blacklist on GET.
exports.userBlacklist_get = asyncHandler(async (req, res) => { 
  await res.locals.weblogUser.updateOne({blacklisted: true, role:'user', verified: false});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User whitelist on GET.
exports.userWhitelist_get = asyncHandler(async (req, res) => { 
  await res.locals.weblogUser.updateOne({blacklisted: false});
  res.redirect(req.get('Referrer') || '/');
});

// Handle User deletion on GET.
exports.userDelete_get = asyncHandler(async (req, res) => { 
  await res.locals.weblogUser.deleteOne();
  res.redirect(req.get('Referrer') || '/');
});

// Display User email on GET.
exports.userEmail_get = asyncHandler(async (req, res) => { res.render('userEmail'); });

// Handle User email on POST.
exports.userEmail_post = asyncHandler(async (req, res) => { 
  var htmlContent= '<p><u>From:</u> ' + res.locals.weblogActiveUser.user_name + '</p><p>&emsp; Dear ' + res.locals.weblogUser.user_name + ',</p><p>' + req.body.message + '</p>'
  await utilities.sendEMail(res.locals.weblogUser.email, req.body.subject, htmlContent);
  res.redirect(req.get('Referrer') || '/');
});

// Handle User deleting own account on GET.
exports.userDeleteOwn_get = asyncHandler(async (req, res) => { 
  await res.locals.weblogActiveUser.deleteOne();
  res.redirect(req.get('Referrer') || '/');
});
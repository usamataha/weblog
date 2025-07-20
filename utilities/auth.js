var { body } = require('express-validator');
var User = require('../models/user');
var Book = require('../models/cBook');
var Tag = require('../models/cTag');
var Tutorial = require('../models/cTutorial');
var Video = require('../models/cVideo');
var utilities = require('./utilities');

/**
 * Sanitizes and validates the sign-up form entries.
 */
var validateSignup = [
    body('user_name').escape().trim()   
    .isLength({min: 4 , max: 12})
    .withMessage('User name is required. 4 ≤ Name length ≤ 12'),

    body('password').trim()
    .isLength({min: 8, max: 24})
    .withMessage('Pasword is required. 8 ≤ Password length ≤ 24')
    // Strong password defaults (https://github.com/validatorjs/validator.js/blob/master/src/lib/isStrongPassword.js)
    .isStrongPassword()
    .withMessage('Alphanumeric password with at least 1 symbol, 1 Uppercase & lowercase letter')
    .custom((value, { req }) =>
        { if (value !== req.body.confirm_password)
            { throw new Error('Password and confirmation do not match'); }
            else { return value; } }),
    
    body('email').escape().trim().isEmail().withMessage('A valid email address is required')
];


/**
 * Checks if 'req.body.user_name' and / or 'req.body.email' exist in the database.
 */
async function IsTaken(req, res, next) { 
    var userExists = await User.findOne({user_name: req.body.user_name});
    var emailExists = await User.findOne({email: req.body.email});
    if (userExists) { 
        const err = new Error('Forbidden! User name already taken.');
        err.status = 403;
        return next(err);
    }
    if (emailExists) { 
        const err = new Error('Forbidden! Email already taken.');
        err.status = 403;
        return next(err);
    }
    next();
}

/**
 * Returns 'res.locals.weblogUser' if 'req.body.user_name' || 'req.body.email' || 'req.params.id' exists.
 * Call it before other check ups.
 */
async function IsRegistered(req, res, next) { 
    // Query the database to get the user. Also check for a valid JWT.
    var userExists;
    if(req.body.user_name) { userExists = await User.findOne({user_name: req.body.user_name}).select('+password +emailToken'); }
    else if (req.body.email) { userExists = await User.findOne({email: req.body.email}).select('+password +emailToken'); }
    else if (req.params.id) { userExists = await User.findById(req.params.id).select('+password +emailToken'); }

    if (!userExists) { 
        const err = new Error('Unauthorized! Not a registered user.');
        err.status = 401;
        return next(err);
    }
    else { res.locals.weblogUser = userExists; next(); }
}

/**
 * Returns a 'res.locals.weblogActiveUser' if the JWT is valid.
 * Call it before other check ups.
 */
async function IsLogged(req, res, next) { 
    var id = utilities.decodeJWT(req, process.env.COOKIE_NAME, process.env.COOKIE_KEY);
    if (!id) { 
        res.redirect('/users/login');
        return;
    }
    else { 
        var userExists = await User.findById(id); 
        if (!userExists) { 
            const err = new Error('Unauthorized! You are not a registered user.');
            err.status = 401;
            return next(err);
        }
        else { res.locals.weblogActiveUser = userExists; next(); }
    }
}

/**
 * If neither res.locals.weblogActiveUser, nor res.locals.weblogUser is found it returns null 
 */
function getUser(res) { 
    if (!res.locals.weblogActiveUser) {
        if (!res.locals.weblogUser) { return null; }
        else { return res.locals.weblogUser; }
    }
    else { return res.locals.weblogActiveUser; }
}

/**
 * Checks if the user is blacklisted.
 * Call IsRegistered() first
 */
async function IsBlacklisted(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if (!User.blacklisted) { next(); }
    else { 
        const err = new Error('Unauthorized! This account is blacklisted.');
        err.status = 401;
        return next(err);
    }
}

/**
 * Checks if the user is banned.
 * Call IsRegistered() first
 */
async function IsBanned(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if (User.banned_until < Date.now()) { next(); }
    else { 
        var remainingHours = Math.ceil((User.banned_until - Date.now()) / (60 * 60 * 1000));
        const err = new Error(`Unauthorized! Your ban is in act for ${remainingHours} hour(s) more.`);
        err.status = 401;
        return next(err);
    }
}

/**
 * Checks if the 'req.body.password' is okay.
 * Call IsRegistered() first
 */
async function IsAuthentic(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else {
        var valid = await utilities.hashCompare(req.body.password, User.password);
        if (!valid) { 
            const err = new Error('Unauthorized! You have entered a wrong password.');
            err.status = 401;
            return next(err);
        }
        else { next(); }
    }
}

/**
 * Checks if the 'req.params.emailToken' is okay.
 * Call IsRegistered() first
 */
async function IsValidToken(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if ( req.params.emailToken === User.emailToken ) { next(); }
    else { 
        const err = new Error('Unauthorized! Contact adminstrator for a valid token.');
        err.status = 401;
        return next(err);
    }
}

/**
 * Checks if the user is verified.
 * Call IsRegistered() first
 */
async function IsVerified(req, res, next) {
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if (User.verified ) { next(); }
    else { 
        const err = new Error('Unauthorized! You have to verify your email first.');
        err.status = 401;
        return next(err);
    }
}

/**
 * Checks if the user is an admin or better.
 * Call IsLogged() first.
 */
async function IsAdmin(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if (User.role === 'admin' || User.role === 'moderator') { next(); }
    else { 
        const err = new Error('Unauthorized! Only moderators or admins are allowed.');
        err.status = 401;
        return next(err);
    }
}

/**
 * Checks if the user is a moderator.
 * Call IsLogged() first.
 */
async function IsModerator(req, res, next) { 
    var User = getUser(res);
    if (!User) { res.end; return; }
    else if (User.role === 'moderator') { next(); }
    else {
        const err = new Error('Unauthorized! Only moderators are allowed.');
        err.status = 401;
        return next(err);
    }
}

/**
 * Validates the chain of command.
 * Call IsRegistered() & IsLogged() first.
 */
async function chainOfCommand(req, res, next) { 
    if (res.locals.weblogUser.role === 'moderator') { 
        const err = new Error("Unauthorized! A moderator can't be edited even by another moderator.");
        err.status = 401;
        return next(err);
    }
    else if (res.locals.weblogActiveUser.role === res.locals.weblogUser.role) { 
        const err = new Error('Unauthorized! Invalid chain of command.');
        err.status = 401;
        return next(err);
    }
    else if (res.locals.weblogActiveUser.role === 'user') { 
        const err = new Error('Unauthorized! Only moderators or admins are allowed.');
        err.status = 401;
        return next(err);
    }
    next();
}

/**
 * Returns 'res.locals.tag' if 'req.params.id' exists.
 */
async function TagExists(req, res, next) {
    var tag = await Tag.findById(req.params.id);
    if (!tag) {
        const err = new Error('Tag not found!');
        err.status = 404;
        return next(err);
    }
    else { res.locals.tag = tag; next(); }
}

/**
 * Returns 'res.locals.tutorial' if 'req.params.id' exists.
 */
async function TutorialExists(req, res, next) {
    var tutorial = await Tutorial.findById(req.params.id).populate('tag');
    if (!tutorial) {
        const err = new Error('Tutorial not found!');
        err.status = 404;
        return next(err);
    }
    else { res.locals.tutorial = tutorial; next(); }
}

/**
 * Returns 'res.locals.video' if 'req.params.id' exists.
 */
async function VideoExists(req, res, next) {
    var video = await Video.findById(req.params.id).populate('tag');
    if (!video) {
        const err = new Error('Video not found!');
        err.status = 404;
        return next(err);
    }
    else { res.locals.video = video; next(); }
}

/**
 * Returns 'res.locals.book' if 'req.params.id' exists.
 */
async function BookExists(req, res, next) {
    var book = await Book.findById(req.params.id).populate('tag');
    if (!book) {
        const err = new Error('Book not found!');
        err.status = 404;
        return next(err);
    }
    else { res.locals.book = book; next(); }
}

module.exports = { 
    validateSignup,
    IsTaken,
    IsRegistered,
    IsBlacklisted,
    IsBanned,
    IsAuthentic,
    IsValidToken,
    IsVerified,
    IsLogged,
    IsAdmin,
    IsModerator,
    chainOfCommand,
    TagExists,
    TutorialExists,
    VideoExists,
    BookExists
}
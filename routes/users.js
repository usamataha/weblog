var express = require('express');
var router = express.Router();
var userController = require ('../controllers/userController');
var auth = require("../utilities/auth");

// GET request for user sign up.
router.get('/signup', userController.userSignup_get);

// POST request for user sign up.
router.post('/signup', [auth.IsTaken, auth.validateSignup], userController.userSignup_post);

// GET request to verify User.
router.get("/:id/verify/:emailToken", [auth.IsRegistered, auth.IsValidToken], userController.userVerify_get);

// GET request for user login.
router.get('/login', userController.userLogin_get);

// POST request for user login.
router.post('/login', [auth.IsRegistered, auth.IsBlacklisted, auth.IsBanned, auth.IsAuthentic],
    userController.userLogin_post);

// GET request to refresh session.
router.get('/refresh', auth.IsLogged, userController.userRefreshSession_get);

// GET request for user dashboard.
router.get('/dashboard', [auth.IsLogged, auth.IsBlacklisted, auth.IsBanned, auth.IsVerified], userController.userDashboard_get);

// POST request for user dashboard.
router.post('/dashboard', [auth.IsLogged, auth.IsBlacklisted, auth.IsBanned, auth.IsVerified], userController.userDashboard_post);

// GET request for user logout.
router.get('/logout', userController.userLogout_get);

// GET request to password reset form.
router.get('/resetpassword', userController.userResetPassword_get);

// POST request to password reset form.
router.post('/resetpassword', auth.IsRegistered, userController.userResetPassword_post);

// GET request to reset password.
router.get("/:id/reset/:emailToken", [auth.IsRegistered, auth.IsValidToken], userController.userPassReset_get);

// GET request for users list.
router.get("/list", [auth.IsLogged, auth.IsAdmin], userController.usersList);

// GET request to promote User.
router.get("/:id/promote", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand], userController.userPromote_get);

// GET request to demote User.
router.get("/:id/demote", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand], userController.userDemote_get);

// GET request to ban User.
router.get("/:id/ban", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand], userController.userBan_get);

// GET request to unban User.
router.get("/:id/unban", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand, auth.IsBlacklisted], userController.userUnban_get);

// GET request to blacklist User.
router.get("/:id/blacklist", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand, auth.IsModerator], userController.userBlacklist_get);

// GET request to whitelist User.
router.get("/:id/whitelist", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand, auth.IsModerator], userController.userWhitelist_get);

// GET request to delete User.
router.get("/:id/delete", [auth.IsRegistered, auth.IsLogged, auth.chainOfCommand, auth.IsModerator], userController.userDelete_get);

// GET request to email User.
router.get("/:id/email", userController.userEmail_get);

// POST request to email User.
router.post("/:id/email", [auth.IsRegistered, auth.IsLogged, auth.IsAdmin], userController.userEmail_post);

// GET request to delete own account
router.get("/delete", [auth.IsLogged, auth.IsBlacklisted, auth.IsBanned], userController.userDeleteOwn_get);

module.exports = router;
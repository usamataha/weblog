var express = require('express');
var router = express.Router();
var appController = require ('../controllers/appController');
var auth = require('../utilities/auth');

// GET request for chat app
router.get('/chat', [auth.IsLogged, auth.IsBlacklisted, auth.IsBanned], appController.chatApp_get);

module.exports = router;
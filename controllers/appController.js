var asyncHandler = require('express-async-handler');

// Chat App.
exports.chatApp_get = asyncHandler(async (req, res) => {

    var environment = process.env.NODE_ENV || 'development';
    const siteURL = (environment === 'development')? process.env.SITE_URL_LOCAL : process.env.SITE_URL;
    var path= '/apps/chat/';

    var chatApp = require('../apps/chat').init(req.socket.server, path);
    var connectedUser = require('../apps/chat').connected(res.locals.weblogActiveUser);
    res.render('appChat', { siteURL: siteURL, path: path, user_name: res.locals.weblogActiveUser.user_name });
});
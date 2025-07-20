var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');
var appsRouter = require('./routes/apps');

var compression = require('compression');
var helmet = require('helmet');
var RateLimit = require('express-rate-limit');

var app = express();

// Use Compression before using any router 
app.use(compression());

// Configure the CSP Content-Security-Policy header.
app.use(helmet.contentSecurityPolicy({ directives: { 
  "script-src": ["'self'", "cdn.socket.io", "'unsafe-inline'"],
  "script-src-attr": ["'unsafe-inline'"],
  "frame-src": ["*.google.com", "*.youtube.com"],
  "img-src": ["'self'", "https: data:"],
  }
}));

var limiter = RateLimit({
  windowMs: 60000,    // How long to remember requests for, in milliseconds. (1 minute)
  limit: parseInt(process.env.REQ_RATE_LIMIT_PER_MIN)
});
// Apply rate limiter to all requests
app.use(limiter);

var debug = require('debug')('weblog:app');
var dotenv = require('dotenv').config();          // Responsible for environment variables.
var mongoose = require('mongoose');               // Responsible for the database.
// Get the proper database url, detect environment defaulting to development.
var environment = process.env.NODE_ENV || 'development';
const mongoDB = (environment === 'development')? process.env.MONGODB_URI_LOCAL : process.env.MONGODB_URI_CLOUD;

connectToDB().catch((err) => { debug(err); });    // Try to connect, forward errors to debug.
async function connectToDB() { await mongoose.connect(mongoDB); debug('connected to database'); }

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (environment === 'development') app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);
app.use('/apps', appsRouter);
// Chat app client-side scipt
// app.get("/javascripts/socket.io.js", function(req, res) { res.sendFile(path.join(__dirname, "node_modules/socket.io/client-dist/socket.io.js")); });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var express = require('express');
var router = express.Router();

var Book = require('../models/cBook');
var Tutorial = require('../models/cTutorial');
var Video = require('../models/cVideo');
var Tag = require('../models/cTag');

var debug = require('debug')('weblog:index');

/* GET home page. */
router.get('/', async function(req, res) {
  var tutorials = await Tutorial.find().sort({ title: 1 });
  var videos= await Video.find().sort({ title: 1 });
  var books = await Book.find().sort({ title: 1 });
  var tags = await Tag.find().sort({ name: 1 });

  res.render('index', { tutorials: tutorials, videos: videos, books: books, tags: tags });
});

/* GET request to contact page */
router.get('/contact', async function(req, res) { 
  res.render('iContact', 
    { mailAccount: process.env.MAIL_ACCOUNT,
      phoneNumber: process.env.PHONE_NUMBER,
      address: process.env.ADDRESS,
      location:process.env.LOCATION });
  });

/* Search */
router.post('/search', async function(req, res) {
  var keywords = req.body.keywordFilter.split(/[ ,-/./+]+/).filter(Boolean);
  if (keywords.length === 0) { res.status(400).json('Bad Request'); return; }
  var searchResults=[];
  var regexStr = keywords.map(String).join('|');

  try {
    if (req.body.tutorialsOption) {
  
      var tutorials = await Tutorial.find({
        title: {$regex: regexStr, $options: 'i'},
        tag: {$in: req.body.tagFilter}
      },
      { title: 1, url: 1 });
  
      tutorials.forEach((tutorial) => {
        searchResults.push({type: 'Tutorial', title: tutorial.title, url: tutorial.url});
      });
    }
  
    if (req.body.videosOption) {
  
      var videos = await Video.find({
        title: {$regex: regexStr, $options: 'i'},
        tag: {$in: req.body.tagFilter}
      },
      { title: 1, url: 1 });
  
      videos.forEach((video) => {
        searchResults.push({type: 'Video', title: video.title, url: video.url});
      });
    }

    if (req.body.booksOption) {

      var books = await Book.find({
        title: {$regex: regexStr, $options: 'i'},
        tag: {$in: req.body.tagFilter}
      },
      { title: 1, url: 1 });
  
      books.forEach((book) => {
        searchResults.push({type: 'Book', title: book.title, url: book.url});
      });
    }
  }
  catch (error) { debug(error); }

  if (searchResults.length === 0) { res.status(404).json('Not Found'); return; }
  res.json(Object.values(searchResults));
});

/* Quick Search */
router.get("/qsearch/:searchString", async function(req, res) {
  var searchResults=[];
  var regexStr = req.params.searchString.split(/[ ,-/./+]+/).filter(Boolean).map(String).join("|");
  if (regexStr === "") { res.status(400).json('Bad Request'); return; }
  var query = {title: {$regex: regexStr, $options: "i"}};
  var projection = {title: 1, url: 1, cover_s_url: 1};
  var options = {sort: {title: 1}};
  var maxCount = parseInt(process.env.QSEARCH_ITEMS);

  try {
    var [tutorials, videos] = await Promise.all([
      Tutorial.find(query, projection, options).limit(maxCount),
      Video.find(query, projection, options).limit(maxCount)
    ]);

    tutorials.forEach((tutorial) => { searchResults.push({title: tutorial.title, url: tutorial.url, img: tutorial.cover_s_url, type: "Tutorial"}); });
    videos.forEach((video) => { searchResults.push({title: video.title, url: video.url, img: video.cover_s_url, type: "Video"}); });
  }
  catch (error) { debug(error); }

  if (searchResults.length === 0) { res.status(404).json('Not Found'); return; }
  res.json(searchResults);
});

module.exports = router;

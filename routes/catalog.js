var express = require('express');
var router = express.Router();
var catalogController = require ('../controllers/catalogController');
var auth = require('../utilities/auth');

//#region Tags

// GET request for tags listing
router.get('/tag/list', catalogController.tagsList_get);

// GET request for tag addition.
router.get('/tag/add', [auth.IsLogged, auth.IsModerator], catalogController.addTag_get);

// POST request for tag addition.
router.post('/tag/add', [auth.IsLogged, auth.IsModerator], catalogController.addTag_post);

// GET request for tag details
router.get('/tag/:id/details', auth.TagExists, catalogController.tagDetails_get);

// GET request for tag edit
router.get('/tag/:id/edit', [auth.IsLogged, auth.IsModerator, auth.TagExists], catalogController.tagEdit_get);

// POST request for tag edit
router.post('/tag/:id/edit', [auth.IsLogged, auth.IsModerator, auth.TagExists], catalogController.tagEdit_post);

// GET request for tag delete
router.get('/tag/:id/delete', [auth.IsLogged, auth.IsModerator, auth.TagExists], catalogController.tagDelete_get);

//#endregion

//#region Tutorials

// GET request for tutorials listing
router.get('/tutorial/list', catalogController.tutorialsList_get);

// GET request for tutorial addition.
router.get('/tutorial/add', [auth.IsLogged, auth.IsModerator], catalogController.addTutorial_get);

// POST request for tutorial addition.
router.post('/tutorial/add', [auth.IsLogged, auth.IsModerator], catalogController.addTutorial_post);

// GET request for tutorial details
router.get('/tutorial/:id/details', [auth.IsLogged, auth.IsBanned, auth.IsBlacklisted, auth.TutorialExists], catalogController.tutorialDetails_get);

// GET request for tutorial edit
router.get('/tutorial/:id/edit', [auth.IsLogged, auth.IsModerator, auth.TutorialExists], catalogController.tutorialEdit_get);

// POST request for tutorial edit
router.post('/tutorial/:id/edit', [auth.IsLogged, auth.IsModerator, auth.TutorialExists], catalogController.tutorialEdit_post);

// GET request for tutorial delete
router.get('/tutorial/:id/delete', [auth.IsLogged, auth.IsModerator, auth.TutorialExists], catalogController.tutorialDelete_get);

//#endregion

//#region Videos

// GET request for videos listing
router.get('/video/list', catalogController.videosList_get);

// GET request for video addition.
router.get('/video/add', [auth.IsLogged, auth.IsModerator], catalogController.addVideo_get);

// POST request for video addition.
router.post('/video/add', [auth.IsLogged, auth.IsModerator], catalogController.addVideo_post);

// GET request for video details
router.get('/video/:id/details', [auth.IsLogged, auth.IsBanned, auth.IsBlacklisted, auth.VideoExists], catalogController.videoDetails_get);

// GET request for video edit
router.get('/video/:id/edit', [auth.IsLogged, auth.IsModerator, auth.VideoExists], catalogController.videoEdit_get);

// POST request for video edit
router.post('/video/:id/edit', [auth.IsLogged, auth.IsModerator, auth.VideoExists], catalogController.videoEdit_post);

// GET request for video delete
router.get('/video/:id/delete', [auth.IsLogged, auth.IsModerator, auth.VideoExists], catalogController.videoDelete_get);

//#endregion

//#region Books

// GET request for books listing
router.get('/book/list', catalogController.booksList_get);

// GET request for book addition.
router.get('/book/add', [auth.IsLogged, auth.IsModerator], catalogController.addBook_get);

// POST request for book addition.
router.post('/book/add', [auth.IsLogged, auth.IsModerator], catalogController.addBook_post);

// GET request for book details
router.get('/book/:id/details', [auth.IsLogged, auth.IsBanned, auth.IsBlacklisted, auth.BookExists], catalogController.bookDetails_get);

// GET request for book edit
router.get('/book/:id/edit', [auth.IsLogged, auth.IsModerator, auth.BookExists], catalogController.bookEdit_get);

// POST request for book edit
router.post('/book/:id/edit', [auth.IsLogged, auth.IsModerator, auth.BookExists], catalogController.bookEdit_post);

// GET request for book delete
router.get('/book/:id/delete', [auth.IsLogged, auth.IsModerator, auth.BookExists], catalogController.bookDelete_get);

//#endregion

module.exports = router;
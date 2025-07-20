var asyncHandler = require('express-async-handler');
var Book = require('../models/cBook');
var Tag = require('../models/cTag');
var Tutorial = require('../models/cTutorial');
var Video = require('../models/cVideo');

//#region Tags

// Display list of all tags.
exports.tagsList_get = asyncHandler(async (req, res) => {
    var tags = await Tag.find().sort({ name: 1 });
    res.render('cTagsList', { tags: tags });
});

// Display Tag addition form on GET.
exports.addTag_get = asyncHandler(async (req, res) => {
    // Add a dummy tag since the form is shared with, editing an 'existing' tag page
    var dummy_tag = new Tag({
      name: 'Tag Name',
      summary: 'Tag Summary',
      cover_s_url: 'Tag Cover (Small) URL',
      cover_l_url: 'Tag Cover (Large) URL'
    })
    res.render('cTagAddEdit', { title: 'Add New Tag', tag: dummy_tag });
});

// Handle Tag addition on POST.
exports.addTag_post = asyncHandler(async (req, res) => {
    
    var new_tag = new Tag({
      name: req.body.name,
      summary: req.body.summary,
      cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
      cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
    })
    
    await new_tag.save();
    res.redirect(`${new_tag.url}/details`);
});
  
// Display details page for a specific tag on GET.
exports.tagDetails_get = asyncHandler(async (req, res) => {

    // Get all items from the database
    var[tutorials, videos, books] = await Promise.all([
        Tutorial.find({ tag: res.locals.tag }).sort({ title: 1 }),
        Video.find({ tag: res.locals.tag }).sort({ title: 1 }),
        Book.find({ tag: res.locals.tag }).sort({ title: 1 })
    ]);
    res.render('cTag', { tag: res.locals.tag, tutorials: tutorials, videos: videos, books: books });
});
  
// Display Tag edit form on GET.
exports.tagEdit_get = asyncHandler(async (req, res) => { 
    res.render('cTagAddEdit', { title: 'Edit Tag', tag: res.locals.tag });
});

// Handle Tag edit on POST.
exports.tagEdit_post = asyncHandler(async (req, res) => {
    await res.locals.tag.updateOne({
        name: req.body.name,
        summary: req.body.summary,
        cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
        cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url)
    });
    res.redirect(`${res.locals.tag.url}/details`);
});

// Display Tag delete on GET.
exports.tagDelete_get = asyncHandler(async (req, res) => {
    await res.locals.tag.deleteOne();
    res.redirect('/catalog/tag/list');
});

//#endregion

//#region Tutorials

// Display list of all tutorials.
exports.tutorialsList_get = asyncHandler(async (req, res) => {
    const tutorials = await Tutorial.find().sort({ title: 1 }).populate('tag');
    res.render('cTutorialsList', {tutorials: tutorials});
});

// Display Tutorial addition form on GET.
exports.addTutorial_get = asyncHandler(async (req, res) => {
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    // Add a dummy tutorial since the form is shared with, editing an 'existing' tag page
    var dummy_tutorial = new Tutorial({
        title: 'Tutorial Title',
        summary: 'Tutorial Summary',
        tutorial_url: 'Tutorial URL',
        date_added: Date.now(),
        cover_s_url: 'Tutorial Cover (Small) URL',
        cover_l_url: 'Tutorial Cover (Large) URL'
    })
    res.render('cTutorialAddEdit', { title: 'Add New Tutorial', tutorial: dummy_tutorial, tags: allTags });
});

// Handle Tutorial addition on POST.
exports.addTutorial_post = asyncHandler(async (req, res) => {
    var new_tutorial = new Tutorial({
        title: req.body.title,
        summary: req.body.summary,
        tutorial_url: req.body.tutorial_url,
        cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
        cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
        tag: req.body.tag
    })
    
    await new_tutorial.save();
    res.redirect(`${new_tutorial.url}/details`);
});

// Display details page for a specific tutorial on GET.
exports.tutorialDetails_get = asyncHandler(async (req, res) => {
    res.render('cTutorial', { tutorial: res.locals.tutorial });
});
  
// Display Tutorial edit form on GET.
exports.tutorialEdit_get = asyncHandler(async (req, res) => { 
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    res.locals.tutorial.tag.forEach((tutorialTag) => {
        allTags.forEach((tag) => {
            if (tag.name === tutorialTag.name) { tag.checked = 'true'; return; }
        });
    });

    res.render('cTutorialAddEdit', { title: 'Edit Tutorial', tags: allTags });
});

// Handle Tutorial edit on POST.
exports.tutorialEdit_post = asyncHandler(async (req, res) => {
    await res.locals.tutorial.updateOne({
        title: req.body.title,
        summary: req.body.summary,
        tutorial_url: req.body.tutorial_url,
        cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
        cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
        tag: req.body.tag
    });
    res.redirect(`${res.locals.tutorial.url}/details`);
});

// Display Tutorial delete on GET.
exports.tutorialDelete_get = asyncHandler(async (req, res) => {
    await res.locals.tutorial.deleteOne();
    res.redirect('/catalog/tutorial/list');
});
  
//#endregion

//#region Videos

// Display list of all videos.
exports.videosList_get = asyncHandler(async (req, res) => {
    const videos = await Video.find().sort({ title: 1 }).populate('tag');
    res.render('cVideosList', {videos: videos});
});

// Display Video addition form on GET.
exports.addVideo_get = asyncHandler(async (req, res) => {
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    // Add a dummy video since the form is shared with, editing an 'existing' tag page
    var dummy_video = new Video({
        title: 'Video Title',
        summary: 'Video Summary',
        video_url: 'Video URL',
        date_added: Date.now(),
        cover_s_url: 'Video Cover (Small) URL',
        cover_l_url: 'Video Cover (Large) URL'
    })
    res.render('cVideoAddEdit', { title: 'Add New Video', video: dummy_video, tags: allTags });
});

// Handle Video addition on POST.
exports.addVideo_post = asyncHandler(async (req, res) => {
    var new_video = new Video({
        title: req.body.title,
        summary: req.body.summary,
        video_url: req.body.video_url,
        cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
        cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
        tag: req.body.tag
    })
    
    await new_video.save();
    res.redirect(`${new_video.url}/details`);
});

// Display details page for a specific video on GET.
exports.videoDetails_get = asyncHandler(async (req, res) => {
    res.render('cVideo', { video: res.locals.video });
});
  
// Display Video edit form on GET.
exports.videoEdit_get = asyncHandler(async (req, res) => { 
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    res.locals.video.tag.forEach((videoTag) => {
        allTags.forEach((tag) => {
            if (tag.name === videoTag.name) { tag.checked = 'true'; return; }
        });
    });

    res.render('cVideoAddEdit', { title: 'Edit Video', tags: allTags });
});

// Handle Video edit on POST.
exports.videoEdit_post = asyncHandler(async (req, res) => {
    await res.locals.video.updateOne({
        title: req.body.title,
        summary: req.body.summary,
        video_url: req.body.video_url,
        cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_s_url),
        cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
        tag: req.body.tag
    });
    res.redirect(`${res.locals.video.url}/details`);
});

// Display Video delete on GET.
exports.videoDelete_get = asyncHandler(async (req, res) => {
    await res.locals.video.deleteOne();
    res.redirect('/catalog/video/list');
});
  
//#endregion

//#region Books

// Display list of all books.
exports.booksList_get = asyncHandler(async (req, res) => {
    const books = await Book.find().sort({ title: 1 }).populate('tag');
    res.render('cBooksList', {books: books});
});

// Display Book addition form on GET.
exports.addBook_get = asyncHandler(async (req, res) => {
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    // Add a dummy book since the form is shared with, editing an 'existing' tag page
    var dummy_book = new Book({
    	title: 'Book Title',
    	author: 'Book Author',
    	summary: 'Book Summary',
    	book_url: 'Book URL',
    	date_published: Date.now(),
    	cover_s_url: 'Book Cover (Small) URL',
    	cover_l_url: 'Book Cover (Large) URL'
    })
    res.render('cBookAddEdit', { title: 'Add New Book', book: dummy_book, tags: allTags });
});

// Handle Book addition on POST.
exports.addBook_post = asyncHandler(async (req, res) => {
    var new_book = new Book({
    	title: req.body.title,
    	author: req.body.author,
    	summary: req.body.summary,
    	book_url: req.body.book_url,
    	date_published: req.body.date_published,
    	cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_l_url),
    	cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
    	tag: req.body.tag
    })
    
    await new_book.save();
    res.redirect(`${new_book.url}/details`);
});

// Display details page for a specific book on GET.
exports.bookDetails_get = asyncHandler(async (req, res) => {
    res.render('cBook', { book: res.locals.book });
});
  
// Display Book edit form on GET.
exports.bookEdit_get = asyncHandler(async (req, res) => { 
    // Get all tags
    const allTags = await Tag.find().sort({ name: 1 });

    res.locals.book.tag.forEach((bookTag) => {
        allTags.forEach((tag) => {
            if (tag.name === bookTag.name) { tag.checked = 'true'; return; }
        });
    });

    res.render('cBookAddEdit', { title: 'Edit Book', tags: allTags });
});

// Handle Book edit on POST.
exports.bookEdit_post = asyncHandler(async (req, res) => {
    await res.locals.book.updateOne({
    	title: req.body.title,
    	author: req.body.author,
    	summary: req.body.summary,
    	book_url: req.body.book_url,
    	date_published: req.body.date_published,
    	cover_s_url: ((req.body.cover_s_url === '')? process.env.DEFAULT_IMG_SMALL : req.body.cover_l_url),
    	cover_l_url: ((req.body.cover_l_url === '')? process.env.DEFAULT_IMG_LARGE : req.body.cover_l_url),
    	tag: req.body.tag
    });
    res.redirect(`${res.locals.book.url}/details`);
});

// Display Book delete on GET.
exports.bookDelete_get = asyncHandler(async (req, res) => {
    await res.locals.book.deleteOne();
    res.redirect('/catalog/book/list');
});
  
//#endregion

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var BookSchema = new Schema({
  title: { type: String, unique: true, required: true },
  author: { type: String, required: true },
  summary: { type: String, required: true },
  book_url: { type: String, required: true },
  date_published: {type: Date},
  date_added: {type: Date, default: Date.now()},
  cover_s_url: { type: String },
  cover_l_url: { type: String },
  tag: [{type: Schema.Types.ObjectId, ref: 'Tag'}]
  
});

// Virtual for book's URL
BookSchema.virtual('url').get(function () { return `/catalog/book/${this._id}`; });

// Export model
module.exports = mongoose.model('Book', BookSchema, 'Books');

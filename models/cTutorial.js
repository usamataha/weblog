const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var TutorialSchema = new Schema({
  title: { type: String, unique: true, required: true },
  summary: { type: String, required: true },
  tutorial_url: { type: String, required: true },
  date_added: {type: Date, default: Date.now()},
  cover_s_url: { type: String },
  cover_l_url: { type: String },
  tag: [{type: Schema.Types.ObjectId, ref: 'Tag'}]

});

// Virtual for tutorial's URL
TutorialSchema.virtual('url').get(function () { return `/catalog/tutorial/${this._id}`; });

// Export model
module.exports = mongoose.model('Tutorial', TutorialSchema, 'Tutorials');
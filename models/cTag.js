const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var TagSchema = new Schema({
  name: { type: String, unique: true, required: true },
  summary: { type: String, required: true },
  cover_s_url: { type: String },
  cover_l_url: { type: String }
  
});

// Virtual for users's URL
TagSchema.virtual('url').get(function () { return `/catalog/tag/${this._id}`; });

// Export model
module.exports = mongoose.model('Tag', TagSchema, 'Tags');
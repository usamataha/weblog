const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var VideoSchema = new Schema({
  title: { type: String, unique: true, required: true },
  summary: { type: String, required: true },
  video_url: { type: String, required: true },
  date_added: {type: Date, default: Date.now()},
  cover_s_url: { type: String },
  cover_l_url: { type: String },
  tag: [{type: Schema.Types.ObjectId, ref: 'Tag'}]
  
});

// Virtual for video's URL
VideoSchema.virtual('url').get(function () { return `/catalog/video/${this._id}`; });

// Export model
module.exports = mongoose.model('Video', VideoSchema, 'Videos');
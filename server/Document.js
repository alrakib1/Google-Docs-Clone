const { Schema, mongoose } = require("mongoose");

const Document = new Schema({
  _id: String,
  data: Object,
});

module.exports = mongoose.model("Document", Document);

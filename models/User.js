const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  mobile: { type: String },
  profileImage: { type: String }
});

module.exports = mongoose.model('User', userSchema);
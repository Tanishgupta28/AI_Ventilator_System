const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "Full name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  contactno: {
    type: String,
    required: [true, "Contact number is required"]
  },
  role:{
    type: String,
    required: [true, "Role is required"]
  }
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;

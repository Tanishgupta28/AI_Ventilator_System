const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "Full name is required"]
  },
  email : {
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
  gender: {
    type: String,
    required: [true, "Gender is required"]
  },
  patient: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }]
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;

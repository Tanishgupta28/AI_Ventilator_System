const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
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
  contactno_Primary: {
    type: String,
    required: [true, "Contact number is required"]
  },
  contactno_Secondary: {
    type: String,
    required: [true, "Contact number is required"]
  },
  gender: {
    type: String,
    required: [true, "Gender is required"]
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"]
  },
  assigned_bed: {
    type: String,
    required: [true, "Assigned bed is required"]
  },
  address: {
    type: String,
    required: [true, "Address is required"]
  },
  member: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
  }],
  notification: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  doctor:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  nurse: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nurse'
  }]
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

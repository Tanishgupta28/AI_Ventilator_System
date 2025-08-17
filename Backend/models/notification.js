const mongoose = require('mongoose');
const Patient = require('./patient');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, "Message is required"]
  },
  success: {
    type: Boolean,
    default: false
  },
  UploadAt: {
    type: Date,
    default: Date.now
  },
  Patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, "Patient is required"]
  },
  alert: {
    type: Boolean,
    default: false
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

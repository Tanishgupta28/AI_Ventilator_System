import { Schema, model } from 'mongoose';
import Patient from './patient';

const notificationSchema = new Schema({
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
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, "Patient is required"]
  },
  alert: {
    type: String,
    default: "green"
  }
});

const Notification = model('Notification', notificationSchema);

export default Notification;

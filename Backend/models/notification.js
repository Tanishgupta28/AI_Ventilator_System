import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  message: {
    type: String,
    required: [true, "Message is required"]
  },
  success: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, "Patient is required"]
  },
  alert: {
    type: String,
    enum: ["green", "red", "orange", "yellow"],
    default: "green"
  }
});

const Notification = model('Notification', notificationSchema);

export default Notification;

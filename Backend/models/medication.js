import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  msg: {
    type: String,
    required: true
  }
});

const Message = model('Message', messageSchema);

export default Message;

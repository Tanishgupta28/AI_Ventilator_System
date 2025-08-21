import { Schema, model } from 'mongoose';

const voiceSchema  = new Schema({
  voice: {
    type: String,
    required: [true, "Voice is required"]
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, "Patient is required"]
  },
  text: {
    type: String,
    required: [true, "Text is required"]
  }
});

const Voice = model('Voice', voiceSchema);

export default Voice;

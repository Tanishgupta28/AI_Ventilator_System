import { Schema, model } from 'mongoose';

const medicationSchema = new Schema({
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

const Medication = model('Medication', medicationSchema);

export default Medication;

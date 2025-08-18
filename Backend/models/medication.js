import { Schema, model } from 'mongoose';

const medicationSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  prescribedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }
});

const Medication = model('Medication', medicationSchema);

export default Medication;

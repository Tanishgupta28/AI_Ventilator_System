import { Schema, model } from 'mongoose';

const doctorSchema = new Schema({
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
  patients: [{
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  }]
});

const Doctor = model('Doctor', doctorSchema);

export default Doctor;

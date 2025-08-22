import { Schema, model } from "mongoose";

const memberSchema = new Schema({
  fullname: {
    type: String,
    required: [true, "Full name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  contactno: {
    type: String,
    required: [true, "Contact number is required"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
  },
  image: {
    type: Schema.Types.ObjectId,
    ref: "Image",
  },
  membervoice: [
    {
      type: Schema.Types.ObjectId,
      ref: "Voice",
    },
  ],
  patient: {
    type: Schema.Types.ObjectId,
    ref: "Patient",
  },
});

const Member = model("Member", memberSchema);

export default Member;

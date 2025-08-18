import { Schema, model } from "mongoose";

const adminSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  }});

const Admin = model("Admin", adminSchema);

export default Admin;

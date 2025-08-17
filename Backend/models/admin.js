const mongoose = reuqire("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  }});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;

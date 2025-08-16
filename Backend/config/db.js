import mongoose from "mongoose";

export default async function connectMongo() {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Could not connect to MongoDB. Error:", err);
    process.exit(1);
  }
}

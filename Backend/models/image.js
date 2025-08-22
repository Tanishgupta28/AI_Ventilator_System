import { Schema, model } from 'mongoose';

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
    },
  }
);

const Image = model('Image', imageSchema);

export default Image;
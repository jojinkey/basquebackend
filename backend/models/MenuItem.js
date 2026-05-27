import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    desc: { type: String, default: "" },
    category: { type: String, required: true },
    image: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
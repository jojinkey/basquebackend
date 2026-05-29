import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "restaurant_manager", "floor_manager", "server", "kitchen"],
      required: true,
    },
    pin: { type: String },
    password: { type: String },
    section: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

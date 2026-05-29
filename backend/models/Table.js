import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableId: { type: String, required: true, unique: true },
    section: {
      type: String,
      enum: ["Indoor", "Terrace", "Garden", "Bar"],
      required: true,
    },
    pax: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "seated", "reserved", "needs_bussing"],
      default: "available",
    },
    guest: { type: String, default: null },
    isVip: { type: Boolean, default: false },
    seatedAt: { type: Date, default: null },
    reservation: { type: String, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);

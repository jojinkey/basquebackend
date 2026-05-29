import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    service: {
      type: String,
      enum: ["table", "event", "golf", "golf_dining"],
      required: true,
    },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    guests: { type: Number, default: 2 },
    source: { type: String, default: "website" },
    stage: {
      type: String,
      enum: ["new", "contacted", "confirmed", "declined", "checked_in"],
      default: "new",
    },
    stageNote: { type: String, default: "" },
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);

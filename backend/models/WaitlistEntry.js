import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true },
    partySize: { type: Number, required: true },
    source: {
      type: String,
      enum: ["WALK_IN", "PHONE", "WEBSITE", "HOST_STAND"],
      default: "WALK_IN",
    },
    phone: { type: String, default: "" },
    waitStart: { type: Date, default: Date.now },
    estimatedWait: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ["WAITING", "NOTIFIED", "SEATED", "DECLINED"],
      default: "WAITING",
    },
    notes: { type: String, default: "" },
    priority: { type: Number, default: 0 },
    isVip: { type: Boolean, default: false },
    sectionPreference: { type: String, default: null },
    declineReason: { type: String, default: null },
    declinedAt: { type: Date, default: null },
    declinedBy: {
      name: { type: String, default: null },
      role: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("WaitlistEntry", waitlistSchema);

import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    tableId: { type: String, required: true },
    tableName: { type: String, required: true },
    type: {
      type: String,
      enum: ["call_waiter", "bill_request"],
      default: "call_waiter",
    },
    status: {
      type: String,
      enum: ["new", "acknowledged", "completed"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceRequest", serviceRequestSchema);
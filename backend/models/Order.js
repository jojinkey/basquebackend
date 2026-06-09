import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      required: true,
    },

    tableName: {
      type: String,
      required: true,
    },

    items: [orderItemSchema],

    total: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending_approval",
        "approved",
        "rejected",
        "preparing",
        "ready",
        "served",
        "cancelled",
      ],
      default: "pending_approval",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
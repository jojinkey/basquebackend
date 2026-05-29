import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    performer: {
      name: { type: String, default: "System" },
      role: { type: String, default: "system" },
    },
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);

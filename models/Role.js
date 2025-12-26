import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 'owner', 'vendor'
});

export default mongoose.model("Role", RoleSchema);

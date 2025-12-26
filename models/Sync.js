import mongoose from "mongoose";

const syncSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  lastSyncedAt: Date,
});

export default mongoose.model("Sync", syncSchema);

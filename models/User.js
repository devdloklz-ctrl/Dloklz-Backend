import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],

  // vendor related fields
  vendorId: {
    type: Number,
    index: true,
    default: null,
  },
});

export default mongoose.model("User", UserSchema);

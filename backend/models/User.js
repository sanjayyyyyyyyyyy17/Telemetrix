import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["pending", "driver", "engineer", "admin"],
    default: "pending",
  },

  pendingRole: {
    type: String,
    enum: {
      values: ["driver", "engineer", null],
      message: "{VALUE} is not valid for pendingRole",
    },
    default: null,
    required: false,
  },

  approved: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);

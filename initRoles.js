import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "./models/Role.js";

dotenv.config();

const roles = ["owner", "vendor"];

async function init() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const roleName of roles) {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        await new Role({ name: roleName }).save();
        console.log(`Role '${roleName}' created`);
      }
    }
    console.log("Roles initialization complete");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

init();

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const dbConnect = async () => {
    try {
        const dbConstraints = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Database connected !! HOST NAME: ${dbConstraints.connection.host}`);
    } catch (error) {
        console.log("Database connection FAILED ",error);
        process.exit(1)
    }
}

export default dbConnect
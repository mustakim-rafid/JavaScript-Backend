import dotenv from "dotenv"
import dbConnect from "./db/index.js";

dotenv.config()
dbConnect()
.then(() => {
    console.log("Database connected successfully.");
})
.catch((err) => {
    console.log("Database connection FAILED !! ", err);
})






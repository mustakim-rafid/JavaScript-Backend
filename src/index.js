import dotenv from "dotenv"
import dbConnect from "./db/index.js";
import { app } from "./app.js";

dotenv.config()
dbConnect()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection FAILED !! ", err);
})





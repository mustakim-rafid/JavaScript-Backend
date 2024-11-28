import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.ORIGIN_CORS,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Import routes
import userRoute from "../src/routes/user.routes.js"
import videoRoute from "../src/routes/video.routes.js"

// Declare routes
app.use("/api/v1/users", userRoute)
app.use("/api/v1/videos", videoRoute)

export { app }
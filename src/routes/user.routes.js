import { Router } from "express"
import { routeHandler } from "../controllers/user.controller.js"

const router = Router()

router.post("/register", routeHandler)

export default router
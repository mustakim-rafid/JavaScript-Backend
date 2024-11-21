import { Router } from "express"
import { logoutUser, loginUser, registerUser, refreshAccessToken, resetPassword, resetEmailandFullName, getUserData } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// router.post("/register", registerUser)
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/reset-password").post(verifyJWT, resetPassword)
router.route("/reset-email-fullname").post(verifyJWT, resetEmailandFullName)
router.route("/get-user-data").get(verifyJWT, getUserData)

export default router
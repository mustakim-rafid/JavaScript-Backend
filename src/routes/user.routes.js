import { Router } from "express"
import { logoutUser, loginUser, registerUser, refreshAccessToken, resetPassword, updateUserDetails, getUserData, changeAvatar, changeCoverImage, showChannelDetails } from "../controllers/user.controller.js"
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
router.route("/reset-email-fullname").patch(verifyJWT, updateUserDetails)
router.route("/get-user-data").get(verifyJWT, getUserData)
router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), changeAvatar)
router.route("/change-coverimage").patch(verifyJWT, upload.single("coverImage"), changeCoverImage)
router.route("/c/:username").get(verifyJWT, showChannelDetails)
router.route("/channel-profile").get(verifyJWT, showChannelDetails)

export default router
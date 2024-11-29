import { Router } from "express";
import { uploadVideo, getAllVideosofUser, deleteVideo, changeThumbnail, updateVideoDetails } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/upload-video").post(verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadVideo)

router.route("/get-user-videos").get(verifyJWT, getAllVideosofUser)
router.route("/delete-video").delete(verifyJWT, deleteVideo)
router.route("/change-thumbnail").patch(verifyJWT, upload.single("thumbnail"), changeThumbnail)
router.route("/update-video-details").patch(verifyJWT, updateVideoDetails)

export default router
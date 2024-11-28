import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const uploadVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body

    const videoLocalFilePath = req.files["video"][0].path
    if (!videoLocalFilePath) {
        throw new ApiError(400, "No video uploaded")
    }
    const thumbnailLocalFilePath = req.files["thumbnail"][0].path
    if (!thumbnailLocalFilePath) {
        throw new ApiError(400, "No thumbnail uploaded")
    }
    // Upload on cloudinary
    const video = await uploadOnCloudinary(videoLocalFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath)
    // Save in db
    const newVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        title,
        description,
        duration: video.duration,
        views: 0
    })

    if (!newVideo) {
        throw new ApiError(500, "Something went wrong while creating new video document")
    }
    // write aggregation pipeline
    const videoWithOwner = await Video.aggregate([
        {
            $match: {
                _id: newVideo._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                ownerDetails: {
                    $arrayElemAt: ["$ownerDetails", 0]
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                ownerDetails: 1
            }
        }
    ])

    if (!videoWithOwner) {
        throw new ApiError(500, "Video not found from db")
    }

    res.status(200).json(
        new ApiResponse(200, videoWithOwner[0], "Video uploaded successfully")
    )
})

export {
    uploadVideo
}
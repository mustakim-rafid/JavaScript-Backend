import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    // Get user details from frontend
    const {username, email, fullName, password} = req.body
    // Validation
    if(
        [username, email, fullName, password].some(field => field.trim() === "")
    ) throw new ApiError(400, "All fields are required")
    // Cheak if user already exists
    const existingUser = await User.findOne({
        $or: [
            {username},
            {email}
        ]
    })
    if (existingUser) {
        throw new ApiError(401, "User already exists.")
    }
    // cheak for images
    const avatarLocalFilepath = req.files["avatar"][0].path

    let coverImageLocalFilepath
    if (req.files && Array.isArray(req.files["coverImage"]) && req.files["coverImage"].length > 0) {
        coverImageLocalFilepath = req.files["coverImage"][0].path
    }

    if (!avatarLocalFilepath) {
        throw new ApiError(400, "Avatar image is required")
    }
    // Upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFilepath)
    const coverImage = await uploadOnCloudinary(coverImageLocalFilepath)
    // Create user object ( in MongoDB )
    const newUser = await User.create({
        username: username.trim(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })
    // remove password and refresh token field from response
    const createdUser = await User.findById({_id: newUser._id}).select(
        "-password -refreshToken"
    )
    // cheak for user creation
    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }
    // sending response to frontend
    res.status(200).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

export {registerUser}

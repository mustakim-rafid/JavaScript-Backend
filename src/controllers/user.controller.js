import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save()

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh token")
    }
}

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

const loginUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    const {identifier, password} = req.body
    // cheak if user exists or not
    const user = await User.findOne({
        $or: [{username: identifier}, {email: identifier}]
    })
    if (!user) {
        throw new ApiError(400, "Invalid user credentials")
    }
    // check password correct or not
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(404, "Incorrect password")
    }
    // Generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)
    // get updated user
    const updatedUser = await User.findById(user._id).select("-password -refreshToken")
    // Set cookies and send user data
    const options = {
        httpOnly: true,
        secure: true
    }
    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
                updatedUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    const userId = req.user._id

    const user = await User.findByIdAndUpdate(userId, {
        $unset: { refreshToken: "1" }
    }, { new: true })
    if (!user) {
        throw new ApiError(401, "Unauthorized request")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "User logged Out successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser
}

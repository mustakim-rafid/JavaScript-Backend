import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

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

const registerUser = asyncHandler(async (req, res) => {
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

const loginUser = asyncHandler(async (req, res) => {
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

const logoutUser = asyncHandler(async (req, res) => {
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const user = await User.findById(token._id)
    if (!user) {
        throw new ApiError(400, "Invalid token")
    }
    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        if (decodedToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token not found or expired")
        }
        const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)
        const newUser = await User.findByIdAndUpdate({
            $set: {
                refreshToken
            }
        }, {new: true})
        if (!newUser) {
            throw new ApiError(500, "Something went wrong while updating the user")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing the access token")
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const userId = req.user._id
    const user = await User.findById(userId)
    if (oldPassword !== user.password) {
        throw new ApiError(400, "Incorrect current password")
    }
    const userWithNewPassword = await User.findByIdAndUpdate(user._id, {
        $set: { password: newPassword }
    }, {new: true})
    if (!userWithNewPassword) {
        throw new ApiError(500, "Something went wrong while reseting the password")
    }
    res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const resetEmailandFullName = asyncHandler(async (req, res) => {
    const {email, fullName} = req.body
    const userId = req.user._id
    const userWithNewEmailandFullName = await User.findByIdAndUpdate(userId, {
        $set: {
            email,
            fullName
        }
    }, {new: true})
    if (!userWithNewEmailandFullName) {
        throw new ApiError(500, "Something went wrong while reseting email and fullname")
    }
    res.status(200).json(
        new ApiResponse(200, {}, "Profile updated successfully")
    )
})

const getUserData = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const user = await User.findById(userId).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(500, "User not found")
    }
    res.status(200).json(
        new ApiResponse(200, user, "User data sended successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    resetPassword,
    resetEmailandFullName,
    getUserData
}

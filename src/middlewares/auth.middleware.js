import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers["Authorization"]?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Access denied, no token provided")
        }
    
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decoded) {
            throw new ApiError(400, "Invalid or expired token")
        }
    
        req.user = decoded
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Unauthorized credentials")
    }
})

export { verifyJWT }
import { asyncHandler } from "../utils/asyncHandler.js";

const routeHandler = asyncHandler((req, res) => {
    res.status(200).json({
        message: "chaa-backend"
    })
})

export {routeHandler}

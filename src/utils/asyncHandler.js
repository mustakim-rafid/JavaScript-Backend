const asyncHandler = (requestHandler) => {
    async (req, res, next) => {
        await Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}







// Another way to use asyncHandler (try-catch)

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 400).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

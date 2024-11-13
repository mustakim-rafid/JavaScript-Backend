import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary = async (localFilePath) => {
    
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if(!localFilePath) return null
        const uploadFile = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        fs.unlinkSync(localFilePath)
        return uploadFile
    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}
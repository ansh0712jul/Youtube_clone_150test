
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiErros.js";

export const verifyJwt = asyncHandler(async(req,res,next) =>{
    try{
        const token = req.cookies?.access_token || req.headers.authorization.split(" ")[1];

        if(!token){
            throw new ApiError(401,"unauthorized access")
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        if(!user){
            throw new ApiError(401,"Invalid Token")
        }

        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(401,error.message || "unauthorised access");
    }
})
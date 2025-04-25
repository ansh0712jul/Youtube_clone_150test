
import asyncHandler from "../utils/asyncHandler.js"
import User from "../models/user.model.js";
import ApiError from "../utils/apiErros.js";
import ApiResponse from  "../utils/apiResponse.js"




//  helper function to generate access and refresh token 

const generateAccessTokenAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId);

        if(!user){
            throw new ApiError(404,"user not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ValidateBeforeSave:false});

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token");
    }
}


// endpoint to register a user 
export const registerUser = asyncHandler(async (req , res) =>{

    const {name, email , password} = req.body;

    if(
        [name,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"all fields are required");
    }

    //check for existing user

    const existedUser = await User.findOne({
        $or: [{ email }, { name }]
    });

    if(existedUser){
        throw new ApiError(409,"user already exist")
    }

    const user = await User.create({
        name:name.toLowerCase(),
        email,
        password
    });
    await user.save();

    const createdUser = await User.findOne(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user . please try again later");
    }

    return res
        .status(201)
        .json(
            new ApiResponse (201,createdUser,"user created successfully")
        )
})


// endpoin to login user 

export const loginUser = asyncHandler(async (req , res) =>{

    const {email , password,name} = req.body;

    if(!email && !password) {
        throw new ApiError(400,"email or password are required");
    }

    const loggedInUser = await User.findOne({
        $or: [{ email }, { name }]
    })

    if(!loggedInUser){
        throw new ApiError(401,"user does not exist ");
    }

    const isPasswordCorrect = await loggedInUser.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid user credentials");
    }

    const { accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(loggedInUser._id);

    const user = await User.findById(loggedInUser._id).select("-password -refreshToken");

    // send cookies 

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user,
                    accessToken,
                    refreshToken
                },
                "user logged in succesfully"
            )
        )
})


// endpoint to logout a user 
export const logoutUser = asyncHandler(async (req , res) =>{
    
    if(!req.user){
        throw new ApiError(401,"unauthorised access");
    }

    await User.findByIdAndUpdate(
        req.user._id , 
        {
            $set:{refreshToken:""}
        },
        {
            new: true 
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken","",options)
    .cookie("refreshToken","",options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out successfully"
        )
    )
})

// endpoint to referesh access token 

export const refreshAccessToken = asyncHandler( async(req , res) =>{
    const IncomingRefreshToken = req.cookies?.refreshToken || req.headers["authorization"]?.split(" ")[1] || req.body.refreshToken;

    if(!IncomingRefreshToken){
        throw new ApiError(400 , "refresh token is required");
    }

    try {
        const decodedToken = jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(400 , "Invalid Refresh token ");
        }
    
        const { accessToken , refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    
        const options = {
            httpsOnly : true,
            secure : true,
        }
    
        return res
        .status(200)
        .cookie("refreshToken" , refreshToken , options)
        .cookie("accessToken" , accessToken , options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken , refreshToken
                },
                "access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(400 , error?.message || "something went wrong while refreshing access token ");
    }


})



import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDb = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
        console.log(`mongo db connection established 🥳🥳  ${connectionInstance.connection.host}`);
        console.log("Registered Models:", mongoose.modelNames());
        
    } catch (error) {
        console.log("mongo Db connection error ",error);
        process.exit(1);
    }
}

export default connectDb;
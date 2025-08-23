import mongoose from "mongoose";

export const connectDB=async()=>{
    try{
         await mongoose.connect(process.env.Mongo_url);
         console.log("database connected successfully!");
    }catch(err){
          console.log("mongoDB connection error: ",error);
    }
}
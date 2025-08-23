const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

main()
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch(err => console.error("MongoDB connection error:", err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    require:true,
  },
  email: String,
  age: Number,
  confirmPassword: String, 
  password: String,
  mobile: Number,
  gender: String,
  city: String,
  description: String,
  hobbies: [String],
  image: String,
  photos: [String],
});

const User = mongoose.model("User", userSchema);

module.exports = User;

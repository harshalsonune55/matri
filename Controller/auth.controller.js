// import User from "../database/data";
import { generateToken } from "../lib/utils";
export const signup =async(req,res)=>{
    const { name, gender, age, email, mobile, password,city } = req.body;
    try{
      const user=await User.findOne({email});
      if(user) return res.status(400).json({msg:"email already exist!!"});
      const salt=await bycrypt.genSalt(10);
      const hashed_password=await bycrypt.hash(CgPassword,salt);
      const newUser=new User({
        name,
        gender,
        age,
        email,
        mobile,
        city,
        password: hashedPassword,
      })
      if(newuser){
        generateToken(newUser._id,res)
        await newUser.save();
        res.status(201).json({
            _id:newUser._id,
            name:newUser.name,
            gender:newUser.gender,
            age:newUser.age,
            email:newUser.email,
            mobile:newUser.mobile,
            city:newUser.city,
            
        })

      }else{
        return res.status(400).json({msg:"invalid user data!!"});
      }
    }catch(e){
         console.log("error in sign controller ",e);
         res.status(500).json({msg:"internal server error!"});
    }
}

export const login =async(req,res)=>{
    try{
       const user= await User.find({email});
       if(!user) return res.status(400).json({msg:"Invalid cradentials"});
       const ispassCorrect=await bycrypt.compare(password,user.password);
       if(!ispassCorrect){
        if(!user) return res.status(400).json({msg:"Invalid cradentials"});
       }
       generateToken(user._id,res);
       res.status(200).json({
        _id:newUser._id,
        name:newUser.name,
        gender:newUser.gender,
        age:newUser.age,
        email:newUser.email,
        mobile:newUser.mobile,
        city:newUser.city,
       })

    }catch(e){
        console.log("error in sign controller ",e);
        res.status(500).json({msg:"internal server error!"});
    }
}
export const logout =(req,res)=>{
    res.send("");
}
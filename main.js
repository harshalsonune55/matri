const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("./database/data");
const initializePassport = require("./auth/passport_config");
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require('dotenv')
// const authRoutes=require("./Routes/auth.route.js");
dotenv.config();
const app = express();
const port = process.env.PORT||5000;
const Message = require("./model/message.js");

initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/views"));
// app.use('/auth', authRoutes);
app.use(cors({
  origin: "*", // or restrict to your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
  }));

  const sessionMiddleware = session({
    secret: "secretshaadikeys",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 },
  });
  
  app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());



app.post("/updateProfile", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const updatedData = {
      name: req.body.name,
      email: req.body.email,
      age: req.body.age,
      gender: req.body.gender,
      city: req.body.city,
      mobile: req.body.mobile,
      description: req.body.description,
      hobbies: req.body.hobbies,
      image: req.body.image
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedData,
      { new: true }
    ).select("-password -__v");

    res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

app.get("/api/profiles", async (req, res) => {
  try {
    const profiles = await User.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }); // oldest → newest
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

app.post("/signup", async (req, res, next) => {
    const { name, gender, age, email, mobile, password,city } = req.body;
    console.log(req.body);
  
    try {
      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).send("User already exists");
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        name,
        gender,
        age,
        email,
        mobile,
        city,
        password: hashedPassword,
      });
  
      await newUser.save();

      req.login(newUser, (err) => {
        if (err) {
          console.error("Auto-login error after signup:", err);
          return res.status(500).send("Auto-login failed");
        }
        return res.status(201).send("User registered and logged in successfully");
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).send("Server error");
    }
  });


  app.post("/send-otp", async (req, res) => {
    const { mobile } = req.body;
    try {
      await axios.post(
        "https://control.msg91.com/api/v5/otp",
        {
          mobile: `91${mobile}`,
          authkey: MSG91_AUTH_KEY,
          flow_id: FLOW_ID,
        }
      );
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("OTP Send Error:", error?.response?.data || error.message);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/verify-otp", async (req, res) => {
    const { mobile, otp } = req.body;
    try {
      const response = await axios.get(
        `https://control.msg91.com/api/v5/otp/verify?authkey=${MSG91_AUTH_KEY}&mobile=91${mobile}&otp=${otp}`
      );
      if (response.data.type === "success") {
        res.status(200).json({ message: "OTP verified" });
      } else {
        res.status(400).json({ message: "Invalid OTP" });
      }
    } catch (error) {
      console.error("OTP Verify Error:", error?.response?.data || error.message);
      res.status(500).json({ message: "Verification failed" });
    }
  });



  app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Auth error:", err);
        return res.status(500).send("Auth error");
      }
      if (!user) {
        return res.status(401).send(info?.message || "Invalid credentials");
      }
  
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).send("Login error");
        }
  
        const { password, __v, ...safeUser } = user.toObject();
  
        return res.status(200).json({
          message: "Logged in successfully",
          user: safeUser, 
        });
      });
    })(req, res, next);
  });
  


app.get("/logout", (req, res) => {
  req.logout(() => {
    res.send("Logged out successfully");
  });
});

app.get("/me", (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Not logged in" });
    }
  
    const { password, __v, ...safeUser } = req.user.toObject();
    res.json(safeUser);
  });



  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173/", 
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });
  
  io.use((socket, next) => {
    passport.initialize()(socket.request, {}, () => {
      passport.session()(socket.request, {}, next);
    });
  });

  io.on("connection", (socket) => {
    const user = socket.request.user; 
    if (user && user.name) {
      console.log(`User connected: ${user.name}`);
    } else {
      console.log("A guest connected");
    }
  
    socket.on("send_message", async (text) => {
      const msgData = {
        user: user?.name || "Guest",
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
  
      try {
        const newMsg = new Message(msgData);
        await newMsg.save(); 
      } catch (err) {
        console.error("Error saving message:", err);
      }
  
      io.emit("receive_message", msgData);
    });
  
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user?.name || "Guest"}`);
    });
  });


  app.get("/api/users", async (req, res) => {
    try {
      let data=req.body;
      console.log(data);
      const profiles = await User.find();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

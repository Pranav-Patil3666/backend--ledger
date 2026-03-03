const userModel = require("../models/user.model")
const jwt= require('jsonwebtoken')
const emailService= require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklist.model")

async function userRegisterController(req,res)
{
    const {email,password,name}= req.body

    const existingUser = await userModel.findOne({
        email:email
    })
    if(existingUser)
    {
        return res.status(400).json({
            message:"Email already exists",
            status:"failed",
            success:false
        })
    }

    const user= await userModel.create({
        email:email,
        password:password,
        name:name
    })

    const token= jwt.sign({userID:user._id}, process.env.JWT_SECRET, {expiresIn :"3d" })
    
    // to send token we send it in cookie so cookie-parser needed
    res.cookie("token", token)

    res.status(201).json({
        user:{
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token,
        message:"Registration successfull"
    })

    await emailService.sendRegistrationEmail(user.email, user.name)


}

/**
 * - User Login Controller
 * - POST/api/auth/login
 */

async function userLoginController(req, res) {
  const { email, password } = req.body

  const user = await userModel
    .findOne({ email })
    .select("+password +systemUser")

  if (!user) {
    return res.status(401).json({
      message: "No user exists with such mail",
      success: false,
    })
  }

  const isValidPassword = await user.comparePassword(password)

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Wrong password",
      success: false,
    })
  }

  // ✅ FIXED PAYLOAD
  const token = jwt.sign(
    {
      userId: user._id,          // ✅ camelCase
      systemUser: user.systemUser // ✅ embed role
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  )

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
  })

  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      systemUser: user.systemUser,
    },
    token,
    message: "Login successful",
  })
}

async function userLogoutController(req,res)
{
  const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

  if(!token)
  {
    return res.status(200).json({
      message : "User logged out successfully"
    })
  }



  await tokenBlacklistModel.create({
    token : token,
  })

    res.clearCookie("token")  // clear token
  return res.status(200).json({
      message : "User logged out successfully"
    })


}

module.exports={
    userRegisterController,
    userLoginController,
    userLogoutController
}
const mongoose= require('mongoose')
const bcrypt = require('bcryptjs')


const userSchema= new mongoose.Schema({
    email:{
        type: String,
        reuired: [true, "Email is required"],
        trim:true,
        lowercase:true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
        unique: [true, "Email already exists"]
    },
    name:{
        type:String,
        required: [true, "Name is required for creating account"]
    },
    password: {
        type:String,
        required:[true, "Password is required"],
        minlength: [6, "Password must be atleast 6 characters long"],
        select: false    //to execlude password field when fetching user data from DB

    },
    systemUser :{
        type :Boolean,
        default: false,
        immutable: true,
        select: false,
    }

},{
    timestamps:true
})

userSchema.pre("save", async function()
{
    if(!this.isModified("password")){
        return 
    }

    const hash = await bcrypt.hash(this.password, 10)
    this.password=hash
    return 

})

userSchema.methods.comparePassword = async function(password)
{
    return await bcrypt.compare(password,this.password)
}

const userModel= mongoose.model("user", userSchema)

module.exports= userModel
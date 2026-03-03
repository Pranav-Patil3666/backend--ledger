/**
 * - this model is created for logout purpose , not simple logout , bu we need to blacklist the token , so if any hacker has a copy of token , can't use it for any further operation through that id
 */


const mongoose = require("mongoose");



const tokenBlacklistSchema = new mongoose.Schema({
    token :{
        type :String,
        required: [true, "Token is required to blacklist"],
        unique: [true, "Token is already blacklisted"]
    },


}, {
    timestamps:true
})

tokenBlacklistSchema.index({ createdAt :1},{
    expireAfterSeconds: 60 * 60 * 24 *3   // 3 days
})


const tokenBlacklistModel= mongoose.model("tokenBlacklist",tokenBlacklistSchema);

module.exports= tokenBlacklistModel;
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
    {
        username:{type:String,require:true},
        email:{type:String,require:true,unique:true},
        password:{type:String,require:true},
        isActive:{type:Boolean,default:true},
        isDeleted:{type:Boolean,default:false},
        isVerified:{type:Boolean,default:false},
        verificationToken: { type: String }, // Doğrulama token'ı
        fcmToken: { type: String }, // Firebase Cloud Messaging token
    },
    {timestamps:true}
)

const User = mongoose.model("users",UserSchema);

module.exports = User;
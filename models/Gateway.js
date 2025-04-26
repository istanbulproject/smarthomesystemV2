const mongoose = require("mongoose");

const GatewaySchema = mongoose.Schema(
    {
        gatewayId:{type:String,require:true},
        gatewayName:{type:String,require:true},
        isActive:{type:Boolean,default:true},
        isDeleted:{type:Boolean,default:false},
        isOnline:{type:Boolean,default:false}
    },
    {timestamps:true}
)

const Gateway = mongoose.model("gateways",GatewaySchema);

module.exports = Gateway;
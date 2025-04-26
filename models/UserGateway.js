const mongoose = require("mongoose");

const UserGatewaySchema = mongoose.Schema(
    {
        gatewayId:{type:String,require:true},
        userId:{type:String,require:true},
        isActive:{type:Boolean,default:true},
        isDeleted:{type:Boolean,default:false},
    },
    {timestamps:true}
)

const UserGateway = mongoose.model("usergateway",UserGatewaySchema);

module.exports = UserGateway;
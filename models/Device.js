const mongoose = require("mongoose");

const DeviceSchema = mongoose.Schema(
    {
        deviceId:{type:String,require:true},
        deviceName:{type:String,require:true},
        gatewayId:{type:String,require:true},
        userId:{type:String,require:true},
        isDeleted:{type:Boolean,default:false},
        isOnline:{type:Boolean,default:false},
        deviceType:{type:Number,require:true},
        revNo:{type:Number,require:true},
        output:{type:Number,require:true},

        // serialNumber:{type:String,require:true},
        // isActive:{type:Boolean,default:false},
        // // isPairDevice:{type:Boolean,default:true},
        // minTemperature: { type: Number, default: 0 },
        // maxTemperature: { type: Number, default: 0 },
        // minHumidity: { type: Number, default: 0 },
        // maxHumidity: { type: Number, default: 0 },
        // batteryPercentage:{ type: Number, default: 0 },
        // batteryVoltage:{ type: Number, default: 0 },
        // humidity:{ type: Number, default: 0 },
        // temperature:{ type: Number, default: 0 },
        // offsetTemp:{ type: Number, default: 0 },
        // offsetHum:{ type: Number, default: 0 },
        // interval:{ type: Number, default: 0 },
        // threshold:{ type: Number, default: 0 },
        // isAlarm:{type:Boolean,default:false},
        // sensorTimestamp:{ type: Date, default: Date.now },
        // temperatureData: [
        //     {
        //         temperature: Number,
        //         timestamp: Date,
        //     },
        // ],
    },
    {
        strict: false,
        timestamps: { currentTime: () => Date.now() + 3 * 60 * 60 * 1000 } // +3 saat
    }
)

const Device = mongoose.model("devices",DeviceSchema);

module.exports = Device;
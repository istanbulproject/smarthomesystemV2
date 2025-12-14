const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../Util/authMiddleware.js');
const Device = require("../models/Device.js");
const User = require("../models/User.js")
const { mqttClient } = require('../server.js'); // MQTT istemcisini import et



router.post("/add",async (req,res)=>{
    try {

        const { deviceId,gatewayId,deviceName,userId } = req.body; // req.body'den userId ve deviceNo alınır

        const deviceIdParam=deviceId.substring(0, 16);
        const revNoParam=deviceId.substring(16,19);
        const deviceTypeParam = deviceId.slice(19,22);
        const outputParam=deviceId.slice(22,24);

        const device = await Device.findOne({deviceId: deviceIdParam, isDeleted: false });

        if (device) {
            res.status(404).json("Cihaz daha önce eklenmiş.!");
            return;
        }

        const newDevice=new Device(req.body);

        newDevice.gatewayId=gatewayId;
        newDevice.userId=userId;
        newDevice.deviceName=deviceName

        newDevice.deviceId=deviceIdParam;    
        newDevice.revNo=String(revNoParam).split('').join('.');
        newDevice.deviceType=deviceTypeParam;
        newDevice.output=outputParam;        
        

        if (parseInt(outputParam) == 1) {
             newDevice.set("output1", false);
        }
        else if (parseInt(outputParam) == 2) {
             newDevice.set("output1", false);
             newDevice.set("output2", false);
        }
        else if (parseInt(outputParam) == 3) {
             newDevice.set("output1", false);
             newDevice.set("output2", false);
             newDevice.set("output3", false);
        }


        if (parseInt(deviceTypeParam) == 1 ) {
            newDevice.set("isActive", false);
            // newDevice.set("isActiveTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("isActiveTime", null);
        }
        else if (parseInt(deviceTypeParam) == 2 ) {
            newDevice.set("isActive", false);
            // newDevice.set("isActiveTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("isActiveTime", null);
        }
         else if (parseInt(deviceTypeParam) == 3 ) {
            // newDevice.set("lastSensörTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("lastSensorTime",null);
            newDevice.set("temperature",0);
            newDevice.set("temperatureData", []);
            newDevice.set("humidity",0);
            newDevice.set("batteryPercentage",0);
            newDevice.set("interval",0);
            newDevice.set("isAlarm",false);
        }
         else if (parseInt(deviceTypeParam) == 4 ) {
            newDevice.set("isActive", false);
            // newDevice.set("isActiveTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("isActiveTime", null);
        }
         else if (parseInt(deviceTypeParam) == 5 ) {
            newDevice.set("isActive", false);
            // newDevice.set("isActiveTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("isActiveTime", null);
            newDevice.set("min", 0);
            newDevice.set("max", 0);
            newDevice.set("threshold", 0);
        }
         else if (parseInt(deviceTypeParam) == 6 ) {
            newDevice.set("lastTrigger", false);
            newDevice.set("lastTriggerTime", null);
        }
         else if (parseInt(deviceTypeParam) == 7 ) {
            newDevice.set("IsWaterLeak", false);
            // newDevice.set("IsWaterLeakTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsWaterLeakTime", null);
        }
         else if (parseInt(deviceTypeParam) == 8 ) {
            newDevice.set("IsGasLeak", false);
            // newDevice.set("IsGasLeakTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsGasLeakTime", null);
        }
         else if (parseInt(deviceTypeParam) == 9 ) {
            newDevice.set("IsOpenClose", false);
            // newDevice.set("IsOpenCloseTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsOpenCloseTime", null);
            newDevice.set("IsGasLeak", false);
            // newDevice.set("IsGasLeakTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsGasLeakTime", null);
        }
         else if (parseInt(deviceTypeParam) == 10 ) {
            newDevice.set("IsOpenClose", false);
            // newDevice.set("IsOpenCloseTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsOpenCloseTime", null);
            newDevice.set("IsWaterLeak", false);
            // newDevice.set("IsWaterTime", new Date(new Date().getTime() + 3 * 60 * 60 * 1000));
            newDevice.set("IsWaterTime", null);
        }
         
         await newDevice.save();
        

        // Cihaz başarıyla eklendikten sonra MQTT mesajı gönder
        const mqttMessage = JSON.stringify({ gatewayId:gatewayId,deviceId:deviceIdParam, status: "added" });
        // mqttClient.publish('a1/device/add', mqttMessage, (err) => {
        mqttClient.publish('intdens/'+gatewayId+'/device_add', mqttMessage, (err) => {
            if (err) {
                console.error("MQTT mesajı gönderilemedi:", err);
            } else {
                console.log("MQTT mesajı başarıyla gönderildi:", mqttMessage);
            }
        });

        res.status(200).json("Device Eklendi")
    } catch (error) {
        res.status(400).json(error);
    }
});

router.post("/delete", async (req, res) => {
    try {

        const { deviceId,gatewayId} = req.body;
        // console.log(deviceId);
        
        // const devices = await Device.find({ deviceId: deviceId, isDeleted: false });

        // res.status(200).json(devices);

         // Cihazın isPairDevice alanını true olarak güncelle
         const deletedDevice = await Device.findOneAndUpdate(
            { deviceId: deviceId,isDeleted:false },
            { isDeleted: true },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );

        console.log(deletedDevice);
        

        if (!deletedDevice) {
            return res.status(404).json("Cihaz bulunamadı");
        }

         // Cihaz başarıyla eklendikten sonra MQTT mesajı gönder
        const mqttMessage = JSON.stringify({ gatewayId:gatewayId,deviceId:deviceId, status: "deleted" });
        // mqttClient.publish('a1/device/add', mqttMessage, (err) => {
        mqttClient.publish('intdens/'+gatewayId+'/device_delete', mqttMessage, (err) => {
            if (err) {
                console.error("MQTT mesajı gönderilemedi:", err);
            } else {
                console.log("MQTT mesajı başarıyla gönderildi:", mqttMessage);
            }
        });
         
        return res.status(200).json("Cihaz Silindi !");

    } catch (error) {
        res.status(400).json(error);
    }
});

router.get("/:gatewayId",async (req, res) => {
    try {

        const gatewayId = req.params.gatewayId;
        // console.log(gatewayId);
        

        // Cihazları çekiyoruz ve sadece belirli alanları seçiyoruz
        const devices = await Device.find(
            { gatewayId: gatewayId, isDeleted: false }
        );

        // console.log(devices);
        


        res.status(200).json(devices);


    } catch (error) {
        res.status(400).json(error);
    }
});

router.get("/fcm-token/:deviceId", async (req, res) => {
    try {
        console.log("FCM Token Request for deviceId:", req.params.deviceId);
        
        const deviceId = req.params.deviceId;

        // Cihazı bul
        const device = await Device.findOne(
            { deviceId: deviceId, isDeleted: false }
        ).select('userId deviceId deviceName');

        if (!device) {
            console.log("Device not found with deviceId:", deviceId);
            return res.status(404).json({ message: "Cihaz bulunamadı" });
        }

        console.log("Device found, userId:", device.userId);

        // Kullanıcıyı bul ve FCM token'ını al
        const user = await User.findById(device.userId).select('fcmToken username email');

        if (!user) {
            console.log("User not found with userId:", device.userId);
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        if (!user.fcmToken) {
            console.log("No FCM token found for user:", user.username);
            return res.status(404).json({ message: "Kullanıcının FCM token'ı yok" });
        }

        console.log("FCM token found for user:", user.username);

        res.status(200).json({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            userId: device.userId,
            username: user.username,
            email: user.email,
            fcmToken: user.fcmToken
        });

    } catch (error) {
        console.error("Error fetching FCM token:", error);
        res.status(400).json({ error: error.message });
    }
});






router.get("/getbydeviceid/:deviceid", async (req, res) => {
    try {
        const deviceId = req.params.deviceid;

        const device = await Device.findOne(
            { deviceId: deviceId, isDeleted: false }
        ).select(
            'deviceName deviceId isActive isPairDevice deviceType isOnline maxTemperature minTemperature minHumidity maxHumidity sensorTimestamp batteryPercentage batteryVoltage humidity temperature isAlarm -_id'
        );

        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        const deviceObj = device.toObject();

        if (deviceObj.deviceType === 2) {
            delete deviceObj.maxTemperature;
            delete deviceObj.minTemperature;
            delete deviceObj.minHumidity;
            delete deviceObj.maxHumidity;
            delete deviceObj.sensorTimestamp;
            delete deviceObj.batteryPercentage;
            delete deviceObj.batteryVoltage;
            delete deviceObj.humidity;
            delete deviceObj.temperature;
            delete deviceObj.isAlarm;
        }

        res.status(200).json(deviceObj);

    } catch (error) {
        console.error("Error fetching device:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post("/pairdevice",async (req,res)=>{

    try {
        const { deviceId,status } = req.body;

        // Cihazın isPairDevice alanını true olarak güncelle
        const updatedDevice = await Device.findOneAndUpdate(
            { deviceId: deviceId,isDeleted:false },
            { isPairDevice: status },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );

        if (!updatedDevice) {
            return res.status(404).json("Cihaz bulunamadı");
        }

        res.status(200).json("Cihaz Eşleşti.");
    } catch (error) {
        res.status(500).json(error.message);
    }

});

// router.post("/runningdevice",async (req,res)=>{

//     try {
//         const { deviceId,isActive } = req.body;

//         // Cihazın isPairDevice alanını true olarak güncelle
//         const updatedDevice = await Device.findOneAndUpdate(
//             { deviceId: deviceId },
//             { isActive: isActive },
//             { new: true } // Güncellenmiş dökümantasyonu geri döner
//         );

//         if (!updatedDevice) {
//             return res.status(404).json("Cihaz bulunamadı");
//         }

//         res.status(200).json("Cihaz Durumu Güncellendi.");
//     } catch (error) {
//         res.status(500).json(error.message);
//     }

// });

router.post("/renamedevicename",async (req,res)=>{

    try {
        const { deviceId,deviceName } = req.body;
        
        // // Cihazın deviceName alanını deviceName olarak güncelle
        const updatedDeviceName = await Device.findOneAndUpdate(
            { deviceId: deviceId,isDeleted:false },
            { deviceName: deviceName },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );
 

        if (!updatedDeviceName) {
            return res.status(404).json("Cihaz bulunamadı");
        }

        res.status(200).json("Cihaz Adi Güncellendi.");
    } catch (error) {
        res.status(500).json(error.message);
    }

});

router.post("/updateisonline",async (req,res)=>{

    try {
        const { deviceId, isOnline} = req.body;
        
        const updatedIsOnline = await Device.findOneAndUpdate(
            { deviceId: deviceId,isDeleted:false },
            { isOnline: isOnline },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );
 

        if (!updatedIsOnline) {
            return res.status(404).json("Cihaz bulunamadı");
        }

        res.status(200).json("Cihaz Durumu Güncellendi.");
    } catch (error) {
        res.status(500).json(error.message);
    }

});

router.post("/updateminmaxvalues",async (req,res)=>{

    try {
        // const { deviceId, isOnline} = req.body;
        
        // // Cihazın deviceName alanını deviceName olarak güncelle
        const updatedDeviceMinMax = await Device.findOneAndUpdate(
            { deviceId: req.body.deviceId,isDeleted:false },
              req.body,
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );
 

        if (!updatedDeviceMinMax) {
            return res.status(404).json("Cihaz bulunamadı");
        }

        res.status(200).json("Cihaz Değerleri Güncellendi.");
    } catch (error) {
        res.status(500).json(error.message);
    }

});

router.get("/gettemperaturelasttenvalues/:deviceid",async (req,res) => {
    try {
        
        const deviceId = req.params.deviceid;
       
        const device = await Device.findOne({ deviceId: deviceId, isDeleted: false });

        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        const formatted = device.temperatureData.map(g => ({
            ...g.toObject(),
            timestamp: new Date(g.timestamp).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul"
            }),
        }));

        // res.status(200).json(device.temperatureData);
        res.status(200).json(formatted);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})



module.exports=router;
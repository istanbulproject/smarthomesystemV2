const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../Util/authMiddleware.js');
const Device = require("../models/Device.js");
const { mqttClient } = require('../server.js'); // MQTT istemcisini import et



router.post("/add",async (req,res)=>{
    try {

        // const deviceNo = req.params.deviceNo;
        // const userId = req.params.userId;
        // const device = await Device.find({userId:userId,deviceNo:deviceNo,active: true, deleted: false});

        const { deviceId,gatewayId } = req.body; // req.body'den userId ve deviceNo alınır

        const deviceIdParam=deviceId.substring(0, 16);
        const serialNumberParam=deviceId.substring(16,29);
        const deviceTypeParam = deviceId.slice(-1);

        const device = await Device.findOne({deviceId: deviceIdParam, isDeleted: false });

        if (device) {
            res.status(404).json("Cihaz daha önce eklenmiş.!");
            return;
        }

        const newDevice=new Device(req.body);
        newDevice.deviceId=deviceIdParam;
        newDevice.serialNumber=serialNumberParam;
        newDevice.deviceType=deviceTypeParam;
        // newDevice.deviceType=newDevice.deviceId.slice(-1);
         
         await newDevice.save();
        // console.log(newDevice);
        

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
        ).select('deviceName deviceId isActive isPairDevice deviceType isOnline maxTemperature minTemperature minHumidity maxHumidity sensorTimestamp batteryPercentage batteryVoltage humidity temperature isAlarm -_id');

        console.log(devices);
        
        // Cihaz tipine göre yanıtı filtreliyoruz
        const filteredDevices = devices.map(device => {
            const deviceObj = device.toObject();

            if (deviceObj.deviceType === 2) {
                // Sıcaklık sensörleri için max/min sıcaklık alanları bırak
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


                return deviceObj;

            } else if (deviceObj.deviceType === 1 || deviceObj.deviceType === 3) {
                return deviceObj;
            }
            
        });

        res.status(200).json(filteredDevices.length > 0 ? filteredDevices : filteredDevices.length);


    } catch (error) {
        res.status(400).json(error);
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
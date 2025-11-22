const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const verifyToken = require('../Util/authMiddleware.js');
const Gateway = require("../models/Gateway.js");
const UserGateway=require("../models/UserGateway.js");
const Device = require("../models/Device.js");
const { mqttClient } = require('../server.js'); // MQTT istemcisini import et


// //Tekli talep ancak şuan boşta
// router.post("/add",async (req,res)=>{
//     try {
//          const newGateway=new Gateway(req.body);
//         //  await newGateway.save();
//          const savedGateway = await newGateway.save();

//          // Eklenen kaydın _id'sini al
//         const gatewayId = savedGateway._id;
//         const userId =req.body.userId;


//         res.status(200).json("Gateway Eklendi")
//     } catch (error) {
//         res.status(400).json(error);
//     }
// })

router.post("/add", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {

        const { gatewayId } = req.body; // req.body'den userId ve deviceNo alınır

        // const device = await Gateway.findOne({ gatewayId: gatewayId,isActive: true, isDeleted: false });
        const device = await Gateway.findOne({ gatewayId: gatewayId, isDeleted: false });

        if (device) {
            res.status(404).json("Gateway daha önce eklenmiş.!");
            return;
        }

        const newGateway = new Gateway(req.body);
        const savedGateway = await newGateway.save({ session });

        // Eklenen kaydın _id'sini al
        const addedGatewayId = savedGateway._id;
        const userId = req.body.userId;

        // Yeni bir kaydı user_gateway tablosuna ekle
        const newUserGateway = new UserGateway({ userId: userId, gatewayId: addedGatewayId });
        await newUserGateway.save({ session });


        // Cihaz başarıyla eklendikten sonra MQTT mesajı gönder
        const mqttMessage = JSON.stringify({ gatewayId:gatewayId, status: "added" });
        // mqttClient.publish('a1/device/add', mqttMessage, (err) => {
        mqttClient.publish('intdens/'+gatewayId+'/gw_add', mqttMessage, (err) => {
            if (err) {
                console.error("MQTT mesajı gönderilemedi:", err);
            } else {
                console.log("MQTT mesajı başarıyla gönderildi:", mqttMessage);
            }
        });

        // Transaction'ı commit et
        await session.commitTransaction();
        session.endSession();

        res.status(200).json("Gateway ve user_gateway tablosuna kayıt eklendi");
    } catch (error) {
        console.log(error);
        
        // Hata durumunda transaction'ı geri al
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: "Bir hata oluştu" });
    }
});

//gateway isdelete true
//usergateway isdelete true
//device isdelete true

router.post("/delete", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const {gatewayId} = req.body;

         // gateway silindi
         const deletedGateway = await Gateway.findOneAndUpdate(
            { gatewayId: gatewayId },
            { isDeleted: true },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );

        if (!deletedGateway) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json("Gateway Silinemedi");
        }

        //usergateway silindi.
        const deletedUserGateway = await UserGateway.updateMany(
            { gatewayId: deletedGateway._id },
            { isDeleted: true },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );

        if (!deletedUserGateway) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json("UserGateway bulunamadı");
        }

        //device'lar silindi.
        const deletedDavice = await Device.updateMany(
            { gatewayId: gatewayId },
            { isDeleted: true },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );

        if (!deletedDavice) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json("Device bulunamadı");
        }

        // Transaction'ı commit et
        await session.commitTransaction();
        session.endSession();
         
        return res.status(200).json("Cihaz Silindi !");

    } catch (error) {
       // Hata durumunda transaction'ı geri al
       await session.abortTransaction();
       session.endSession();
       res.status(400).json({ message: "Bir hata oluştu" });
    }
});

router.post("/renamegatewayname",async (req,res)=>{

    try {
        // console.log(req.body);
        const { gatewayId,gatewayName } = req.body;

        
        
        // // Cihazın deviceName alanını deviceName olarak güncelle
        const updatedGatewayName = await Gateway.findOneAndUpdate(
            { gatewayId: gatewayId },
            { gatewayName: gatewayName },
            { new: true } // Güncellenmiş dökümantasyonu geri döner
        );
 

        if (!updatedGatewayName) {
            return res.status(404).json("Cihaz bulunamadı");
        }

        res.status(200).json("Gateway Adi Güncellendi.");
    } catch (error) {
        res.status(500).json(error.message);
    }

});



module.exports=router;
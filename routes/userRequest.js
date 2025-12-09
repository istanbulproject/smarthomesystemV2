// const User = require("../models/User");

const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');
const UserGateway = require('../models/UserGateway'); // UserGateway modelini dahil edin
const Gateway = require('../models/Gateway'); // Gateway modelini dahil edin

router.get("/gateways/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Kullanıcının gatewayId'lerini al
        const userGateways = await UserGateway.find({ userId: userId, isActive: true, isDeleted: false }).select('gatewayId');

        // GatewayId'leri bir diziye aktar
        const gatewayIds = userGateways.map(ug => ug.gatewayId);

        // GatewayId'ler ile gateway bilgilerini al
        let gateways = await Gateway.find({ _id: { $in: gatewayIds } }).select('gatewayId gatewayName isOnline'); // İstediğiniz alanları seçin


        res.status(200).json(gateways.length > 0 ? gateways : gateways.length);
    } catch (error) {
        res.status(400).json(error);
    }
});

router.post("/update-fcm-token", async (req, res) => {
    try {
        console.log("FCM Token Update Request:", req.body);
        
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            console.log("Missing required fields - userId:", userId, "fcmToken:", fcmToken ? "exists" : "missing");
            return res.status(400).json({ message: "userId ve fcmToken gereklidir" });
        }

        console.log("Updating FCM token for userId:", userId);
        
        // Kullanıcıyı bul ve FCM token'ı güncelle
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fcmToken: fcmToken },
            { new: true }
        ).select('username email fcmToken');

        if (!updatedUser) {
            console.log("User not found with userId:", userId);
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        console.log("FCM token successfully updated for user:", updatedUser.username);
        
        res.status(200).json({ 
            message: "FCM token başarıyla güncellendi",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating FCM token:", error);
        res.status(400).json({ message: "Hata oluştu", error: error.message });
    }
});

module.exports = router;

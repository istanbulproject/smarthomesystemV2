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

module.exports = router;

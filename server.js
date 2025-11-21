const express = require("express");
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const mqtt = require('mqtt');

const app = express();
const cors = require("cors");
dotenv.config();

const port = process.env.PORT || 5000;

// MQTT bağlantısı
const mqttOptions = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
};

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, mqttOptions);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT Broker');
    mqttClient.subscribe('a1/device/response', (err) => {
        if (err) {
            console.error('Failed to subscribe to topic', err);
        }
    });
    mqttClient.subscribe('a1/device/status', (err) => {
        if (err) {
            console.error('Failed to subscribe to topic', err);
        }
    });
    mqttClient.subscribe('a1/device/online', (err) => {
        if (err) {
            console.error('device online', err);
        }
    });
    mqttClient.subscribe('a1/device/temperaturesensor', (err) => {
        if (err) {
            console.error('device online', err);
        }
    });
    mqttClient.subscribe('intdens/+/cmd_response', (err) => {
        if (err) {
            console.error('intdens online', err);
        }
    });
    mqttClient.subscribe('intdens/+/manuel', (err) => {
        if (err) {
            console.error('intdens online', err);
        }
    });
    mqttClient.subscribe('intdens/device_online', (err) => {
        if (err) {
            console.error('device_online', err);
        }
    });
     mqttClient.subscribe('intdens/gw_online', (err) => {
        if (err) {
            console.error('device_online', err);
        }
    });
    mqttClient.subscribe('intdens/+/gas', (err) => {
        if (err) {
            console.error('intdens online', err);
        }
    });
});

// Veritabanı modelini import et
const Device = require('./models/Device'); // Örneğin Device modelini kullanıyoruz

mqttClient.on('message', async (topic, message) => {
   
     // intdens/+/response
    const path = topic;
    const parts = path.split("/");
    const result = parts[1];  // "XXXXX"
    // const lastTpic = "intdens/"+result+"/cmd_response_db";
    // console.log("intdens/"+result+"/response");

    if ( parts[2] === "cmd_response") {
        
         const receivedMessage = JSON.parse(message.toString());
         const outputNumber = `output${receivedMessage.outputIndex}`;
         

                 try {
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId: receivedMessage.deviceId,isDeleted:false },
                    { [outputNumber]:true,isActive: true,isActiveTime: new Date(Date.now() + 3 * 60 * 60 * 1000)},
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );

                if (!updatedDevice) {
                    
                    // console.log("Cihaz bulunamadı");
                    return;
                }
                
            // 2. 'a1/device/responsedb' topiğine mesaj gönder
            const responseMessage = JSON.stringify({
                deviceId: receivedMessage.deviceId,
                deviceType:receivedMessage.deviceType ,
                command:receivedMessage.command
            });

            mqttClient.publish("intdens/"+result+"/cmd_response_db", responseMessage, (err) => {
                if (err) {
                    console.error('Failed to publish message', err);
                } else {
                    console.log('Message published to a1/device/responsedb:', receivedMessage);
                }
            });

        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }


    }

     if ( parts[2] === "manuel") {
        
          const receivedMessage = JSON.parse(message.toString());

                 try {
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId: receivedMessage.deviceId,isDeleted:false },
                    { isActive: true },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );

                if (!updatedDevice) {
                    
                    // console.log("Cihaz bulunamadı");
                    return;
                }
                
            // 2. 'a1/device/responsedb' topiğine mesaj gönder
            const responseMessage = JSON.stringify({
                deviceId: receivedMessage.deviceId,
                deviceType:receivedMessage.deviceType ,
                command:true
            });

            mqttClient.publish("intdens/"+result+"/manuel_response_db", responseMessage, (err) => {
                if (err) {
                    console.error('Failed to publish message', err);
                } else {
                    console.log('Message published to a1/device/responsedb:', receivedMessage);
                }
            });

        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }
    }

    if (topic == "intdens/device_online") {
    
        
        try {
              const receivedMessage = JSON.parse(message.toString());
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId: receivedMessage.deviceId,isDeleted:false },
                    { isOnline: receivedMessage.isOnline },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );

                if (!updatedDevice) {
                    
                    // console.log("Cihaz bulunamadı");
                    return;
                }
                
            // // 2. 'a1/device/responsedb' topiğine mesaj gönder
            // const responseMessage = JSON.stringify({
            //     gatewayId:updatedDevice.gatewayId,
            //     deviceId: receivedMessage.deviceId,
            //     deviceType:receivedMessage.deviceType ,
            //     isActive:receivedMessage.isActive,
            //     mn:0,
            //     // mn:1,
            // });

            // mqttClient.publish('a1/device/responsedb', responseMessage, (err) => {
            //     if (err) {
            //         console.error('Failed to publish message', err);
            //     } else {
            //         console.log('Message published to a1/device/responsedb:', receivedMessage);
            //     }
            // });

        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }

    }

    if (topic== "intdens/gw_online") {
        
        try {
              const receivedMessage = JSON.parse(message.toString());
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedGateway = await Gateway.findOneAndUpdate(
                    { gatewayId: receivedMessage.gatewayId,isDeleted:false },
                    { isOnline: receivedMessage.isOnline },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );

                if (!updatedGateway) {
                    
                    return;
                }
                


        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }

    }

    if (parts[2] === "gas") {
        
        
    }

    // if (topic== "intdens/sensor_online")
    // {

    // }
   
    if (topic === 'a1/device/response') {
        // console.log('Received message from a1/device/response:', message.toString());

        const receivedMessage = JSON.parse(message.toString());
        // console.log('Received message from a1/device/response:', receivedMessage);

        try {
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId: receivedMessage.deviceId,isDeleted:false },
                    { isActive: receivedMessage.isActive },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );

                if (!updatedDevice) {
                    
                    // console.log("Cihaz bulunamadı");
                    return;
                }
                
            // 2. 'a1/device/responsedb' topiğine mesaj gönder
            const responseMessage = JSON.stringify({
                gatewayId:updatedDevice.gatewayId,
                deviceId: receivedMessage.deviceId,
                deviceType:receivedMessage.deviceType ,
                isActive:receivedMessage.isActive,
                mn:0,
                // mn:1,
            });

            mqttClient.publish('a1/device/responsedb', responseMessage, (err) => {
                if (err) {
                    console.error('Failed to publish message', err);
                } else {
                    console.log('Message published to a1/device/responsedb:', receivedMessage);
                }
            });

        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }
    }
    if (topic === 'a1/device/status') {
        // console.log('Received message from a1/device/response:', message.toString());

        const receivedMessage = JSON.parse(message.toString());
        // console.log('Received message from a1/device/status:', receivedMessage);

        try {


                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                    { deviceId: receivedMessage.deviceId,isDeleted:false },
                    { isActive: receivedMessage.isActive },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );
                
                if (!updatedDevice) {
                    
                    // console.log("Cihaz bulunamadı");
                    return;
                }
                
            // 2. 'a1/device/responsedb' topiğine mesaj gönder
            const responseMessage = JSON.stringify({
                gatewayId:updatedDevice.gatewayId,
                deviceId: receivedMessage.deviceId,
                deviceType:receivedMessage.deviceType ,
                isActive:receivedMessage.isActive,
                isOnline:updatedDevice.isOnline,
                mn:1,

            });

            mqttClient.publish('a1/device/responsedb', responseMessage, (err) => {
                if (err) {
                    console.error('Failed to publish message', err);
                } else {
                    console.log('Message published to a1/device/responsedb:', receivedMessage);
                }
            });

        } catch (error) {
            console.error('Error while saving device or publishing message:', error);
        }
    }
    if (topic === 'a1/device/online')
    {
        const receivedMessage = JSON.parse(message.toString());

        if (receivedMessage.type == "1") {
           
            
            try {
                 // 1. Veritabanı işlemi: Cihazı çalıştır.

                 const updatedGateway = await Gateway.findOneAndUpdate(
                    { gatewayNo: receivedMessage.id,deleted:false },
                    { isOnline: receivedMessage.isOnline },
                    { new: true } // Güncellenmiş dökümantasyonu geri döner
                );
                
                
                if (!updatedGateway) {
                    
                    return;
                }                

                
            } catch (error) {
                
            }
            
        }
        
        if (receivedMessage.type == "2") {
            
            try {
                // 1. Veritabanı işlemi: Cihazı çalıştır.

                const updatedDevice = await Device.findOneAndUpdate(
                   { deviceId: receivedMessage.id,isDeleted:false },
                   { isOnline: receivedMessage.isOnline },
                   { new: true } // Güncellenmiş dökümantasyonu geri döner
               );
               

               if (!updatedDevice) {
                   
                   return;
               }
               
           } catch (error) {
               
           }
            
        }
        
        
    }
    if (topic === 'a1/device/temperaturesensor')
        {
              
            try {
   
                    const receivedMessage = JSON.parse(message.toString());
                    
                    const updatedDevice = await Device.findOneAndUpdate(
                        { deviceId: receivedMessage.deviceId,isDeleted:false },
                        receivedMessage,
                        { new: true } // Güncellenmiş dökümanı döndür
                      );
                    
                    if (!updatedDevice) {
                        return;
                    }
                    ///////////////


                    // Yeni temperatureData kaydını oluştur
                        const newTemperatureData = {
                            temperature: receivedMessage.temperature,
                            timestamp: new Date() // Şu anki zamanı kaydediyoruz
                        };

                        // Mevcut cihazı bul
                         const device = await Device.findOne({ deviceId: receivedMessage.deviceId,isDeleted:false });

                        if (!device.temperatureData) {
                            device.temperatureData = []; // Yoksa yeni bir array olarak başlat
                        }

                        device.temperatureData.push(newTemperatureData)

                        // Kayıt sayısını kontrol et, 10'dan fazlaysa en eski kaydı sil
                        if (device.temperatureData.length > 10) {
                            device.temperatureData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Tarihe göre sıralama
                            device.temperatureData = device.temperatureData.slice(1); // En eski kaydı çıkar
                        }

                        
                        await device.save();

                    //////////////
                   
                   let messageInfo="";
                   let isAlarm=false;
                   
                   if (receivedMessage.temperature > updatedDevice.maxTemperature ) {
                        messageInfo="sıcaklık sınırın üstüne çıktı";
                        isAlarm=true;          
                   }
                   else if (receivedMessage.temperature < updatedDevice.minTemperature) {
                        messageInfo="sıcaklık sınırın altına indi";
                        isAlarm=true; 
                   }
                   else{
                    messageInfo="sıcaklık normale döndü";
                    isAlarm=false;
                   }


                   if (isAlarm) {
                    
                    const updatedFlagDevice = await Device.findOneAndUpdate(
                        { deviceId: receivedMessage.deviceId,isDeleted:false },
                        {isAlarm:true},
                        { new: true } // Güncellenmiş dökümanı döndür
                       );


                        if (updatedFlagDevice) {
                            const responseMessage = JSON.stringify({
                                gatewayId:updatedDevice.gatewayId,
                                deviceId: updatedDevice.deviceId,
                                alarmFlag:true,
                                alarmMessage:messageInfo
                
                            });
                
                            mqttClient.publish('a1/device/temperaturealarm', responseMessage, (err) => {
                                if (err) {
                                    console.error('Failed to publish message', err);
                                } else {
                                    console.log('Message published to a1/device/responsedb:', receivedMessage);
                                }
                            });
                        }
                            

                    }
                    else if (updatedDevice.isAlarm == true && isAlarm==false) {
                        const updatedFlagDevice = await Device.findOneAndUpdate(
                            { deviceId: receivedMessage.deviceId,isDeleted:false },
                            {isAlarm:false},
                            { new: true } // Güncellenmiş dökümanı döndür
                           );
    
    
                            if (updatedFlagDevice) {
                                const responseMessage = JSON.stringify({
                                    gatewayId:updatedDevice.gatewayId,
                                    deviceId: updatedDevice.deviceId,
                                    alarmFlag:false,
                                    alarmMessage:messageInfo
                    
                                });
                    
                                mqttClient.publish('a1/device/temperaturealarm', responseMessage, (err) => {
                                    if (err) {
                                        console.error('Failed to publish message', err);
                                    } else {
                                        console.log('Message published to a1/device/responsedb:', receivedMessage);
                                    }
                                });
                            }
                    }

              
                   
                   
               } catch (error) {
                   
               }
            
    }



    
   




    // console.log(JSON.parse(message.toString()));

    // mqttClient.publish(topic, JSON.parse(message.toString()), (err) => {
    //     if (err) {
    //         console.error('Failed to publish message', err);
    //     } else {
    //         console.log('Message published to a1/device/responsedb:');
    //     }
    // });
    

});


// MQTT istemcisini dışa aktar
module.exports = { mqttClient };

// Routes
const authRoute = require("./routes/auth.js");
const userRoute = require("./routes/userRequest.js");
const gatewayRoute = require("./routes/gatewayRequest.js");
const deviceRoute = require("./routes/deviceRequest.js");
const Gateway = require("./models/Gateway.js");

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MONGODB");
    } catch (error) {
        throw error;
    }
};

// Middlewares
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/gateway", gatewayRoute);
app.use("/api/device", deviceRoute);

app.listen(port, () => {
    connect();
    console.log(`Server is running on port ${port}`);
});

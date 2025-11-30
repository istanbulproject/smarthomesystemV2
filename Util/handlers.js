// Sensör kodlarını isimlere çeviren map
const sensorTypeMap = {
    1: "priz",
    2: "anahtar",
    3: "sicaklik",
    4: "panjur",
    5: "kombi",
    6: "kapi",
    7: "susensoru",
    8: "gazsensoru",
    9: "gazsaati",
    10: "susaati",
};

// Sensör handlerları
const sensorHandlers = {
    priz: (data) => ({
        temperature: data.temperature,
        battery: data.battery,
        timestamp: new Date()
    }),

    anahtar: (data) => ({
        open: data.open,
        tamper: data.tamper,
        timestamp: new Date()
    }),

    sicaklik: (data) => ({
        motion: data.motion,
        battery: data.battery,
        timestamp: new Date()
    }),

    panjur: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),

     kombi: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),

     kapi: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),

     susensoru: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),

     gazsensoru: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),

     gazsaati: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    }),
    
     susaati: (data) => ({
        humidity: data.humidity,
        battery: data.battery,
        timestamp: new Date()
    })
};

// DIŞA AKTAR
module.exports = {
    sensorTypeMap,
    sensorHandlers
};

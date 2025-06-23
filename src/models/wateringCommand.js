const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const humidityReadingSchema = new Schema({
  plantId: { type: String, required: true, default: 'planta_principal' },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// O Mongoose criará uma coleção chamada 'humidityreadings' (plural e minúsculo)
// a partir do nome do modelo 'HumidityReading'.
module.exports = mongoose.model('HumidityReading', humidityReadingSchema);
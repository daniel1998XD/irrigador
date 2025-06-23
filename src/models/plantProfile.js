const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wateringPresetSchema = new Schema({
  presetName: { type: String, required: true, unique: true },
  moistureThreshold: { type: Number, required: true }, // Limiar de umidade para iniciar a rega
  wateringDuration: { type: Number, required: true }  // Duração da rega em segundos
});

module.exports = mongoose.model('WateringPreset', wateringPresetSchema);
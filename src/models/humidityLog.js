import mongoose from 'mongoose';

const humidityLogSchema = new mongoose.Schema({
  humidity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  // Referência ao perfil que era o padrão no momento da leitura
  plantProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlantProfile',
    required: true
  }
});

export default mongoose.models.HumidityLog || mongoose.model('HumidityLog', humidityLogSchema);
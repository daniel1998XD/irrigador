import mongoose from 'mongoose';

const plantProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minHumidity: { type: Number, required: true },
  wateringDuration: { type: Number, required: true },
  chatId: { type: String, required: true },
  // ---- CAMPO NOVO ----
  isDefault: { type: Boolean, default: false } // Para marcar se este é o perfil padrão
});

export default mongoose.models.PlantProfile || mongoose.model('PlantProfile', plantProfileSchema);
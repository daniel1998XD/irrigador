import mongoose from 'mongoose';

const plantProfileSchema = new mongoose.Schema({
  // Garanta que os nomes aqui são os mesmos que usaremos no formulário
  name: { type: String, required: true },
  minHumidity: { type: Number, required: true },
  wateringDuration: { type: Number, required: true },
  chatId: { type: String, required: true }
});

export default mongoose.models.PlantProfile || mongoose.model('PlantProfile', plantProfileSchema);
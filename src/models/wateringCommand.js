import mongoose from 'mongoose';

const wateringCommandSchema = new mongoose.Schema({
  command: { type: String, default: 'water' },
  duration: { type: Number, required: true },
  executed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  
  // --- CAMPO NOVO E CRUCIAL ---
  // Este campo irá armazenar o ID do documento do perfil da planta.
  plantProfileId: { 
    type: mongoose.Schema.Types.ObjectId, // O tipo especial do Mongoose para IDs
    ref: 'PlantProfile', // Diz ao Mongoose que este ID se refere a um documento na coleção 'PlantProfile'
    required: true // Tornamos obrigatório que toda rega esteja associada a uma planta
  }
});

export default mongoose.models.WateringCommand || mongoose.model('WateringCommand', wateringCommandSchema);
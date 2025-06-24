import mongoose from 'mongoose';

const deviceStatusSchema = new mongoose.Schema({
  // Usaremos um identificador fixo para saber que este é o documento do nosso único dispositivo.
  identifier: { 
    type: String, 
    default: 'main_device', // Nome padrão para nosso dispositivo principal
    unique: true // Garante que só existirá um documento com este identificador
  },
  lastHumidity: { 
    type: Number 
  },
  lastReportTimestamp: {
    type: Date
  }
});

export default mongoose.models.DeviceStatus || mongoose.model('DeviceStatus', deviceStatusSchema);
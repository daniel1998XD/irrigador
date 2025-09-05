// src/models/userState.js
import mongoose from 'mongoose';

const userStateSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  action: { type: String, required: true }, 
  data: { type: mongoose.Schema.Types.Mixed }, // Para armazenar dados contextuais, como o profileId
  updatedAt: { type: Date, default: Date.now, expires: '5m' } // O estado expira em 5 minutos
});

export default mongoose.models.UserState || mongoose.model('UserState', userStateSchema);

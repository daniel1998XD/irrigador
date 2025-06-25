"use server";

import dbConnect from "@/lib/dbConnect";
import PlantProfile from "@/models/plantProfile";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';

export async function setDefaultProfile(formData) {
  const profileId = formData.get('profileId');
  const chatId = formData.get('chatId'); 

  await dbConnect();
  
  await PlantProfile.updateMany({ chatId: chatId }, { isDefault: false });

  await PlantProfile.findByIdAndUpdate(profileId, { isDefault: true });

  revalidatePath('/perfis');
}

// NOVO: Server Action para deletar um perfil (AGORA EXPORTADA)
export async function deleteProfile(formData) { // <--- CORREÇÃO: Adicionado "export"
    const profileId = formData.get('profileId');

    await dbConnect();
    
    await PlantProfile.findByIdAndDelete(profileId);

    revalidatePath('/perfis');
}

// NOVO: Server Action para atualizar um perfil (AGORA EXPORTADA)
export async function updateProfile(formData) { // <--- CORREÇÃO: Adicionado "export"
    const profileId = formData.get('profileId');
    const name = formData.get('name');
    const minHumidity = formData.get('minHumidity');
    const wateringDuration = formData.get('wateringDuration');

    await dbConnect();

    await PlantProfile.findByIdAndUpdate(profileId, {
        name,
        minHumidity,
        wateringDuration
    });

    revalidatePath('/perfis'); 
    revalidatePath(`/perfis/modificar/${profileId}`);
    redirect('/perfis');
}
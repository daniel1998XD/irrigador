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

export async function deleteProfile(formData) {
    const profileId = formData.get('profileId');

    await dbConnect();
    
    await PlantProfile.findByIdAndDelete(profileId);

    revalidatePath('/perfis');
}

export async function updateProfile(formData) { 
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
    revalidatePath(`/perfis/editar/${profileId}`);
    redirect('/perfis');
}

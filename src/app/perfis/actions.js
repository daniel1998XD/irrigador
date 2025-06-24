"use server";

import dbConnect from "@/lib/dbConnect";
import PlantProfile from "@/models/plantProfile";
import { revalidatePath } from "next/cache";

export async function setDefaultProfile(formData) {
  const profileId = formData.get('profileId');

  await dbConnect();
  
  // Transação: primeiro, definimos TODOS os perfis como não-padrão.
  await PlantProfile.updateMany({}, { isDefault: false });

  // Depois, definimos APENAS o perfil escolhido como padrão.
  await PlantProfile.findByIdAndUpdate(profileId, { isDefault: true });

  // Avisamos ao Next.js para limpar o cache e recarregar os dados da página.
  revalidatePath('/perfis');
}
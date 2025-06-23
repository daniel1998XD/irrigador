import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WateringCommand from '@/models/wateringCommand';

export async function GET() {
  await dbConnect();
  try {
    const command = await WateringCommand.findOne({ executed: false });
    if (command) {
      command.executed = true;
      await command.save();
      return NextResponse.json({ command: 'water', duration: command.duration });
    } else {
      return NextResponse.json({ command: 'none' });
    }
  } catch (error) {
    console.error("Erro ao verificar comando:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
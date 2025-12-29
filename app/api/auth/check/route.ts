import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizaPhoneNumber } from '@/lib/phone';

export async function POST(req: NextRequest) {
  try {
    const { whatsapp } = await req.json();
    
    if (!whatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp é obrigatório' },
        { status: 400 }
      );
    }
    
    const whatsappNormalizado = normalizaPhoneNumber(whatsapp);
    
    const usuario = await prisma.usuario.findUnique({
      where: { whatsapp: whatsappNormalizado }
    });
    
    return NextResponse.json({
      exists: !!usuario,
      usuario: usuario ? {
        id: usuario.id,
        nome: usuario.nome,
        whatsapp: usuario.whatsapp
      } : null
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    );
  }
}

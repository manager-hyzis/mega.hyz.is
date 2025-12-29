import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { normalizaPhoneNumber } from '@/lib/phone';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest) {
  try {
    const { nome, whatsapp } = await req.json();
    
    if (!whatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp é obrigatório' },
        { status: 400 }
      );
    }
    
    const whatsappNormalizado = normalizaPhoneNumber(whatsapp);
    
    let usuario = await prisma.usuario.findUnique({
      where: { whatsapp: whatsappNormalizado }
    });
    
    if (!usuario) {
      if (!nome) {
        return NextResponse.json(
          { error: 'Nome é obrigatório para novo cadastro' },
          { status: 400 }
        );
      }
      
      usuario = await prisma.usuario.create({
        data: {
          nome,
          whatsapp: whatsappNormalizado
        }
      });
    }
    
    const token = jwt.sign(
      { userId: usuario.id, whatsapp: usuario.whatsapp },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return NextResponse.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        whatsapp: usuario.whatsapp
      }
    });
    
  } catch (error) {
    console.error('Erro no auth:', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar' },
      { status: 500 }
    );
  }
}

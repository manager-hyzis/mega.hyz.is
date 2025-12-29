import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bolaoId = searchParams.get('bolaoId');
    
    if (!bolaoId) {
      return NextResponse.json(
        { error: 'Bolão ID não fornecido' },
        { status: 400 }
      );
    }
    
    const usuarios = await prisma.jogo.findMany({
      where: {
        bolaoId: bolaoId,
        usuarioId: { not: null }
      },
      include: {
        usuario: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json(usuarios);
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const boloes = await prisma.bolao.findMany({
      include: {
        jogos: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(boloes);
    
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}

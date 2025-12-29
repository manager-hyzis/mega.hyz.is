import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function getUserFromToken(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { jogoId } = await req.json();
    
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId }
    });
    
    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    
    if (jogo.reservado && jogo.usuarioId !== userId) {
      return NextResponse.json(
        { error: 'Jogo já reservado por outro usuário' },
        { status: 400 }
      );
    }
    
    const jogoAtualizado = await prisma.jogo.update({
      where: { id: jogoId },
      data: {
        reservado: true,
        usuarioId: userId
      },
      include: {
        usuario: true
      }
    });
    
    return NextResponse.json(jogoAtualizado);
    
  } catch (error) {
    console.error('Erro ao reservar jogo:', error);
    return NextResponse.json(
      { error: 'Erro ao reservar jogo' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { jogoId, numeros } = await req.json();
    
    if (!Array.isArray(numeros) || numeros.length !== 6) {
      return NextResponse.json(
        { error: 'Deve ter exatamente 6 números' },
        { status: 400 }
      );
    }
    
    const numerosValidos = numeros.every((n: number) => n >= 1 && n <= 60);
    if (!numerosValidos) {
      return NextResponse.json(
        { error: 'Números devem estar entre 1 e 60' },
        { status: 400 }
      );
    }
    
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId }
    });
    
    if (!jogo || jogo.usuarioId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este jogo' },
        { status: 403 }
      );
    }
    
    const jogoAtualizado = await prisma.jogo.update({
      where: { id: jogoId },
      data: {
        numeros: numeros.sort((a: number, b: number) => a - b),
        editado: true
      },
      include: {
        usuario: true
      }
    });
    
    return NextResponse.json(jogoAtualizado);
    
  } catch (error) {
    console.error('Erro ao editar jogo:', error);
    return NextResponse.json(
      { error: 'Erro ao editar jogo' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const jogoId = searchParams.get('jogoId');
    
    if (!jogoId) {
      return NextResponse.json(
        { error: 'ID do jogo não fornecido' },
        { status: 400 }
      );
    }
    
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId }
    });
    
    if (!jogo || jogo.usuarioId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para cancelar este jogo' },
        { status: 403 }
      );
    }
    
    const jogoAtualizado = await prisma.jogo.update({
      where: { id: jogoId },
      data: {
        reservado: false,
        usuarioId: null,
        editado: false
      }
    });
    
    return NextResponse.json(jogoAtualizado);
    
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar reserva' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { nome, descricao, jogosGerados, grupoId } = await req.json();
    
    if (!jogosGerados || !Array.isArray(jogosGerados) || jogosGerados.length === 0) {
      return NextResponse.json(
        { error: 'Jogos gerados são obrigatórios' },
        { status: 400 }
      );
    }
    
    const linkId = randomBytes(8).toString('hex');
    const linkCompartilhamento = `${process.env.NEXT_PUBLIC_APP_URL}/bolao/${linkId}`;
    
    const bolao = await prisma.bolao.create({
      data: {
        nome: nome || 'Mega da Virada 2025',
        descricao: descricao || 'Bolão colaborativo',
        linkCompartilhamento,
        grupoId: grupoId || new Date().getTime().toString(),
        jogos: {
          create: jogosGerados.map(numeros => ({
            numeros
          }))
        }
      },
      include: {
        jogos: true
      }
    });
    
    return NextResponse.json(bolao);
    
  } catch (error) {
    console.error('Erro ao criar bolão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar bolão' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');
    const listar = searchParams.get('listar');
    
    // Listar todos os bolões ativos
    if (listar === 'true') {
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
    }
    
    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID não fornecido' },
        { status: 400 }
      );
    }
    
    const linkCompartilhamento = `${process.env.NEXT_PUBLIC_APP_URL}/bolao/${linkId}`;
    
    const bolao = await prisma.bolao.findUnique({
      where: { linkCompartilhamento },
      include: {
        jogos: {
          include: {
            usuario: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!bolao) {
      return NextResponse.json(
        { error: 'Bolão não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(bolao);
    
  } catch (error) {
    console.error('Erro ao buscar bolão:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar bolão' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');
    
    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID não fornecido' },
        { status: 400 }
      );
    }
    
    const linkCompartilhamento = `${process.env.NEXT_PUBLIC_APP_URL}/bolao/${linkId}`;
    
    // Deletar todos os jogos do bolão primeiro
    await prisma.jogo.deleteMany({
      where: {
        bolao: {
          linkCompartilhamento
        }
      }
    });
    
    // Deletar o bolão
    await prisma.bolao.delete({
      where: { linkCompartilhamento }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Erro ao deletar bolão:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar bolão' },
      { status: 500 }
    );
  }
}

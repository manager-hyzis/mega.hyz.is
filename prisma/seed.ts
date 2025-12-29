import { prisma } from '../lib/prisma';

async function main() {
  const usuarios = [
    { nome: 'Fernando', whatsapp: '5512981968688' },
    { nome: 'Marceline', whatsapp: '5519984241406' },
    { nome: 'Sérgio', whatsapp: '5512981605424' },
    { nome: 'Sheila', whatsapp: '5512991520844' },
    { nome: 'Vitor', whatsapp: '5511948780146' },
    { nome: 'Vinicius', whatsapp: '5512981879995' },
    { nome: 'Lucas', whatsapp: '5512982455955' },
    { nome: 'Paulo', whatsapp: '5511910806055' },
    { nome: 'Marcia', whatsapp: '5512982770616' },
  ];

  console.log('🌱 Iniciando seed de usuários...');

  for (const usuario of usuarios) {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { whatsapp: usuario.whatsapp },
    });

    if (!usuarioExistente) {
      const novoUsuario = await prisma.usuario.create({
        data: usuario,
      });
      console.log(`✅ Usuário criado: ${novoUsuario.nome} (${novoUsuario.whatsapp})`);
    } else {
      console.log(`⏭️  Usuário já existe: ${usuarioExistente.nome}`);
    }
  }

  console.log('✨ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

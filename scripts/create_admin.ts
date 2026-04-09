import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.argv[2] || 'admin@cuidou.com.br'
  const password = process.argv[3] || 'admin123'

  const passwordHash = await hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      email,
      name: 'Super Admin',
      role: 'ADMIN',
      passwordHash,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Usuário admin criado com sucesso!`)
  console.log(`📧 E-mail: ${admin.email}`)
  console.log(`🔑 Senha: ${password}`)
  console.log(`Você pode usar estas credenciais quando a tela de login ficar pronta.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

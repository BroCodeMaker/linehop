import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const restaurant = await prisma.restaurant.upsert({
    where: { id: '1296246f-20af-4e3b-be16-275626199848' },
    update: { name: 'Test Restaurant', slug: 'test', status: 'OPEN' },
    create: {
      id: '1296246f-20af-4e3b-be16-275626199848',
      name: 'Test Restaurant',
      slug: 'test',
      status: 'OPEN',
      timezone: 'Europe/Bucharest',
    },
  })

  await prisma.restaurantUser.upsert({
    where: { restaurantId_email: { restaurantId: restaurant.id, email: 'admin@test.com' } },
    update: { passwordHash },
    create: {
      restaurantId: restaurant.id,
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
    },
  })

  console.log('Seeded demo restaurant:', restaurant.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())

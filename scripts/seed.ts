import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      name: "Test Restaurant",
      slug: "test",
      timezone: "Europe/Bucharest",
    },
  });
  console.log("✅ Restaurant:", restaurant.name, "(id:", restaurant.id + ")");

  // Upsert admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.restaurantUser.upsert({
    where: { restaurantId_email: { restaurantId: restaurant.id, email: "admin@test.com" } },
    update: {},
    create: {
      restaurantId: restaurant.id,
      email: "admin@test.com",
      passwordHash,
      role: "admin",
    },
  });
  console.log("✅ User:", user.email);

  console.log("\n🎉 Done! Use these to test:");
  console.log("   Join page: http://localhost:3000/r/test");
  console.log("   Dashboard: http://localhost:3000/app/" + restaurant.id + "/dashboard");
  console.log("   Admin:     admin@test.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

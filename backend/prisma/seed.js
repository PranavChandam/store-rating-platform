const prisma = require("../prisma");

async function main() {
  console.log(" Seeding database...");

  // Example Admin User
  await prisma.user.upsert({
    where: { email: "admin@storerating.com" },
    update: {},
    create: {
      name: "System Administrator Account",
      email: "admin@storerating.com",
      password: "$2b$10$abcdefghijklmnopqrstuv", 
      address: "Admin Address",
      role: "ADMIN",
    },
  });

  console.log(" Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

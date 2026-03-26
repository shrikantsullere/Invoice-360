const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'test@test.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`User ${email} password updated to: ${password}`);
    } else {
      user = await prisma.user.create({
        data: {
          name: 'Test Account',
          email: email,
          password: hashedPassword,
          role: 'COMPANY',
          loginEnabled: true,
          companyId: 1
        }
      });
      console.log(`User ${email} created with password: ${password}`);
    }

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

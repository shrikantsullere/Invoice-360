const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const password = '123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update company@gmail.com
    await prisma.user.update({
      where: { email: 'company@gmail.com' },
      data: { password: hashedPassword }
    });
    console.log(`Password for company@gmail.com reset back to: ${password}`);

    // Update superadmin@gmail.com
    await prisma.user.update({
      where: { email: 'superadmin@gmail.com' },
      data: { password: hashedPassword }
    });
    console.log(`Password for superadmin@gmail.com reset back to: ${password}`);

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

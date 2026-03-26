const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('📝 Creating/Updating seed users...\n');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('123', 10);

    // 1. Upsert SUPERADMIN
    const superadmin = await prisma.user.upsert({
        where: { email: 'superadmin@gmail.com' },
        update: {
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPERADMIN'
        },
        create: {
            name: 'Super Admin',
            email: 'superadmin@gmail.com',
            password: hashedPassword,
            role: 'SUPERADMIN'
        }
    });
    console.log('✅ SUPERADMIN ready:', {
        id: superadmin.id,
        name: superadmin.name,
        email: superadmin.email,
        role: superadmin.role
    });

    // 2. Find or create a company for COMPANY role user
    let company = await prisma.company.findFirst({
        where: { email: 'company@gmail.com' }
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Demo Company',
                email: 'company@gmail.com',
                phone: '+1 234 567 890',
                address: '123 Business Street',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'United States',
                currency: 'USD'
            }
        });
    }
    console.log('✅ Company ready:', {
        id: company.id,
        name: company.name,
        email: company.email
    });

    // 3. Upsert COMPANY role user
    const companyUser = await prisma.user.upsert({
        where: { email: 'company@gmail.com' },
        update: {
            name: 'Company Admin',
            password: hashedPassword,
            role: 'COMPANY',
            companyId: company.id
        },
        create: {
            name: 'Company Admin',
            email: 'company@gmail.com',
            password: hashedPassword,
            role: 'COMPANY',
            companyId: company.id
        }
    });
    console.log('✅ COMPANY user ready:', {
        id: companyUser.id,
        name: companyUser.name,
        email: companyUser.email,
        role: companyUser.role,
        companyId: companyUser.companyId
    });

    // 4. Upsert USER role user
    const regularUser = await prisma.user.upsert({
        where: { email: 'user@gmail.com' },
        update: {
            name: 'Regular User',
            password: hashedPassword,
            role: 'USER',
            companyId: company.id
        },
        create: {
            name: 'Regular User',
            email: 'user@gmail.com',
            password: hashedPassword,
            role: 'USER',
            companyId: company.id
        }
    });
    console.log('✅ USER ready:', {
        id: regularUser.id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        companyId: regularUser.companyId
    });

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. SUPERADMIN:');
    console.log('   Email: superadmin@gmail.com');
    console.log('   Password: 123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. COMPANY:');
    console.log('   Email: company@gmail.com');
    console.log('   Password: 123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. USER:');
    console.log('   Email: user@gmail.com');
    console.log('   Password: 123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch(err => {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
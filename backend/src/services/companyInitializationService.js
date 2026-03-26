const { initializeChartOfAccounts } = require('./chartOfAccountsService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initializeCompanyData = async (companyId, tx = prisma) => {
  try {
    console.log(`🚀 Initializing data for company: ${companyId}`);

    // 1. Initialize COA
    const coaResult = await initializeChartOfAccounts(companyId, tx);
    console.log('COA Init:', coaResult.message);

    // 2. Initialize Default Warehouse
    const existingWarehouse = await tx.warehouse.findFirst({
      where: { companyId: parseInt(companyId), name: 'Main Warehouse' }
    });

    if (!existingWarehouse) {
      await tx.warehouse.create({
        data: {
          name: 'Main Warehouse',
          location: 'Default Location',
          companyId: parseInt(companyId)
        }
      });
      console.log('Main Warehouse created');
    }

    // 3. Initialize Default UOMs
    const defaultUOMs = [
      { category: 'Weight', unitName: 'kg', weightPerUnit: 1 },
      { category: 'Quantity', unitName: 'pcs', weightPerUnit: 0 },
      { category: 'Volume', unitName: 'litre', weightPerUnit: 1 }
    ];

    for (const uom of defaultUOMs) {
      const existingUOM = await tx.uom.findFirst({
        where: { companyId: parseInt(companyId), unitName: uom.unitName }
      });
      if (!existingUOM) {
        await tx.uom.create({
          data: {
            ...uom,
            companyId: parseInt(companyId)
          }
        });
      }
    }
    console.log('Default UOMs initialized');

    // 4. Initialize Default Role for the company (if not exists)
    // This helps the admin manage users with a default role
    const existingRole = await tx.role.findFirst({
      where: { companyId: parseInt(companyId), name: 'Staff' }
    });
    if (!existingRole) {
      await tx.role.create({
        data: {
          name: 'Staff',
          companyId: parseInt(companyId),
          permissions: '[]' // Standard staff permissions can be added later
        }
      });
      console.log('Default Staff role created');
    }

    console.log(`✅ Company ${companyId} initialized successfully.`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing company data:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { initializeCompanyData };

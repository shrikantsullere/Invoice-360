const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Employee Management ---

const createEmployee = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, fullName, department, designation, joiningDate, salaryType, basicSalary, bankAccount, ifsc, taxId, status } = req.body;

    console.log('--- Create Employee Debug ---');
    console.log('Company ID:', companyId);
    console.log('Request Body:', req.body);

    if (!employeeId || !fullName || !joiningDate || basicSalary === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields: employeeId, fullName, joiningDate, and basicSalary are required.' });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        fullName,
        department: department || 'General',
        designation: designation || 'Staff',
        joiningDate: new Date(joiningDate),
        salaryType: salaryType || 'Monthly',
        basicSalary: parseFloat(basicSalary),
        bankAccount,
        ifsc,
        taxId,
        status: status || 'Active',
        companyId: parseInt(companyId)
      }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employees = await prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        salary_structure_assignment: {
          include: { structure: true }
        }
      }
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const data = req.body;

    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
    if (data.basicSalary) data.basicSalary = parseFloat(data.basicSalary);

    const employee = await prisma.employee.update({
      where: { id: parseInt(id), companyId },
      data
    });

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    await prisma.employee.delete({
      where: { id: parseInt(id), companyId }
    });

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Salary Structure ---

const createSalaryStructure = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, components } = req.body;

    const structure = await prisma.salary_structure.create({
      data: {
        name,
        companyId,
        components: {
          create: components.map(c => ({
            name: c.name,
            type: c.type,
            calculationType: c.calculationType,
            value: parseFloat(c.value)
          }))
        }
      },
      include: { components: true }
    });

    res.status(201).json({ success: true, data: structure });
  } catch (error) {
    console.error('Error creating salary structure:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, components } = req.body;
    const companyId = req.user.companyId;

    const structure = await prisma.salary_structure.update({
      where: { id: parseInt(id), companyId },
      data: {
        name,
        components: {
          deleteMany: {},
          create: components.map(c => ({
            name: c.name,
            type: c.type,
            calculationType: c.calculationType,
            value: parseFloat(c.value)
          }))
        }
      },
      include: { components: true }
    });

    res.json({ success: true, data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComponentToStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, calculationType, value } = req.body;

    const component = await prisma.salary_structure_component.create({
      data: {
        structureId: parseInt(id),
        name,
        type,
        calculationType,
        value: parseFloat(value)
      }
    });

    res.json({ success: true, data: component });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllStructures = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const structures = await prisma.salary_structure.findMany({
      where: { companyId },
      include: { components: true }
    });
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignStructure = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, structureId } = req.body;

    const assignment = await prisma.salary_structure_assignment.upsert({
      where: { employeeId: parseInt(employeeId) },
      update: { structureId: parseInt(structureId) },
      create: {
        employeeId: parseInt(employeeId),
        structureId: parseInt(structureId),
        companyId
      }
    });

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Payroll Generation ---

const generatePayroll = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { month, year, employeeIds, remarks } = req.body;

    const results = [];

    for (const empId of employeeIds) {
      // Check if already generated
      const existing = await prisma.payroll.findFirst({
        where: {
          employeeId: parseInt(empId),
          month,
          year: parseInt(year),
          companyId
        }
      });

      if (existing) continue;

      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(empId) },
        include: {
          salary_structure_assignment: {
            include: {
              structure: {
                include: { components: true }
              }
            }
          }
        }
      });

      if (!employee || !employee.salary_structure_assignment) {
        console.log(`Skipping employee ${empId}: No salary structure assigned`);
        continue;
      }

      let totalEarnings = 0;
      let totalDeductions = 0;
      const details = [];

      employee.salary_structure_assignment.structure.components.forEach(comp => {
        let amount = 0;
        if (comp.calculationType === 'FIXED') {
          amount = comp.value;
        } else {
          amount = (comp.value / 100) * employee.basicSalary;
        }

        if (comp.type === 'EARNING') {
          totalEarnings += amount;
        } else {
          totalDeductions += amount;
        }

        details.push({
          componentName: comp.name,
          type: comp.type,
          amount
        });
      });

      const netSalary = (employee.basicSalary + totalEarnings) - totalDeductions;

      const payroll = await prisma.payroll.create({
        data: {
          employeeId: parseInt(empId),
          month,
          year: parseInt(year),
          basicSalary: employee.basicSalary,
          totalEarnings,
          totalDeductions,
          netSalary,
          status: 'Pending',
          remarks,
          companyId,
          details: {
            create: details
          }
        }
      });

      results.push(payroll);
    }

    if (employeeIds.length > 0 && results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No payroll generated. Make sure selected employees have a Salary Structure assigned and payroll for this period doesn't already exist."
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayrollHistory = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { month, year, department } = req.query;

    const where = { companyId };
    if (month && month !== 'All Months') where.month = month;
    if (year) where.year = parseInt(year);
    if (department && department !== 'All') {
      where.employee = { department };
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: true,
        details: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user.companyId;

    const payroll = await prisma.payroll.update({
      where: { id: parseInt(id), companyId },
      data: { status }
    });

    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Settings ---

const getPayrollSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    console.log('GET /payroll/settings - CompanyId:', companyId);

    let settings = await prisma.payroll_setting.findUnique({
      where: { companyId }
    });

    if (!settings) {
      console.log('No settings found, creating defaults for company:', companyId);
      settings = await prisma.payroll_setting.create({
        data: {
          companyId,
          payCycle: 'Monthly',
          currency: 'USD',
          enableEmail: true,
          layout: 'Simple'
        }
      });
    }

    console.log('Returning settings:', settings);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error in getPayrollSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePayrollSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    console.log('PUT /payroll/settings - CompanyId:', companyId);
    console.log('Request body:', req.body);

    const {
      payCycle,
      bankAccount,
      currency,
      taxSlab,
      enablePF,
      enableInsurance,
      enableOtherDeductions,
      layout,
      companyLogo,
      footerNotes,
      digitalSignature,
      enableEmail,
      enableWhatsapp,
      emailTemplate
    } = req.body;

    const settings = await prisma.payroll_setting.upsert({
      where: { companyId },
      update: {
        payCycle,
        bankAccount,
        currency,
        taxSlab,
        enablePF,
        enableInsurance,
        enableOtherDeductions,
        layout,
        companyLogo,
        footerNotes,
        digitalSignature,
        enableEmail,
        enableWhatsapp,
        emailTemplate
      },
      create: {
        companyId,
        payCycle: payCycle || 'Monthly',
        bankAccount,
        currency: currency || 'USD',
        taxSlab,
        enablePF: enablePF || false,
        enableInsurance: enableInsurance || false,
        enableOtherDeductions: enableOtherDeductions || false,
        layout: layout || 'Simple',
        companyLogo,
        footerNotes,
        digitalSignature: digitalSignature || false,
        enableEmail: enableEmail !== undefined ? enableEmail : true,
        enableWhatsapp: enableWhatsapp || false,
        emailTemplate
      }
    });

    console.log('Settings updated successfully:', settings);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error in updatePayrollSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  createSalaryStructure,
  updateSalaryStructure,
  addComponentToStructure,
  getAllStructures,
  assignStructure,
  generatePayroll,
  getPayrollHistory,
  updatePayrollStatus,
  getPayrollSettings,
  updatePayrollSettings
};

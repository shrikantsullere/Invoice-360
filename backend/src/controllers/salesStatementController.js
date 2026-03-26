const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSalesStatement = async (req, res) => {
  try {
    const { startDate, endDate, customerId, status } = req.query;
    const companyId = req.user.companyId;

    // Build where clause
    let where = {
      companyId: parseInt(companyId)
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (customerId && customerId !== 'all') {
      where.customerId = parseInt(customerId);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch Invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate Summary
    const summaryResult = await prisma.invoice.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balanceAmount: true
      },
      _count: {
        id: true
      }
    });

    const summary = {
      totalSales: summaryResult._sum.totalAmount || 0,
      totalPaid: summaryResult._sum.paidAmount || 0,
      totalPending: summaryResult._sum.balanceAmount || 0,
      totalInvoices: summaryResult._count.id || 0
    };

    const formattedData = invoices.map(inv => ({
      id: inv.id,
      invoiceNo: inv.invoiceNumber,
      customer: inv.customer?.name || 'N/A',
      date: inv.date,
      amount: inv.totalAmount,
      paid: inv.paidAmount,
      balance: inv.balanceAmount,
      status: inv.status
    }));

    res.json({
      summary,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching sales statement:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getSalesStatement
};

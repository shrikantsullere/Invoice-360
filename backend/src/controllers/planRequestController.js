const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPlanRequest = async (req, res) => {
    try {
        const {
            companyName,
            email,
            planId,
            planName,
            billingCycle,
            startDate
        } = req.body;

        const planRequest = await prisma.planrequest.create({
            data: {
                companyName,
                email,
                planId: planId ? parseInt(planId) : null,
                planName,
                billingCycle: billingCycle || 'Monthly',
                startDate: startDate ? new Date(startDate) : new Date(),
                status: 'Pending'
            }
        });

        res.status(201).json(planRequest);
    } catch (error) {
        console.error('Create Plan Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPlanRequests = async (req, res) => {
    try {
        const planRequests = await prisma.planrequest.findMany({
            include: {
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(planRequests);
    } catch (error) {
        console.error('Get Plan Requests Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPlanRequestById = async (req, res) => {
    try {
        const planRequest = await prisma.planrequest.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                plan: true
            }
        });
        if (!planRequest) return res.status(404).json({ message: 'Plan request not found' });
        res.json(planRequest);
    } catch (error) {
        console.error('Get Plan Request By ID Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updatePlanRequest = async (req, res) => {
    try {
        const {
            companyName,
            email,
            planId,
            planName,
            billingCycle,
            startDate,
            status
        } = req.body;

        const planRequest = await prisma.planrequest.update({
            where: { id: parseInt(req.params.id) },
            data: {
                companyName,
                email,
                planId: planId ? parseInt(planId) : null,
                planName,
                billingCycle,
                startDate: startDate ? new Date(startDate) : undefined,
                status
            }
        });

        res.json(planRequest);
    } catch (error) {
        console.error('Update Plan Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePlanRequest = async (req, res) => {
    try {
        await prisma.planrequest.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Plan request deleted successfully' });
    } catch (error) {
        console.error('Delete Plan Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const approvePlanRequest = async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);

        // 1. Get the request details
        const request = await prisma.planrequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ message: 'Plan request not found' });
        }

        if (request.status === 'Accepted') {
            return res.status(400).json({ message: 'Request already accepted' });
        }

        // 2. Create Company and User in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update request status
            await tx.planrequest.update({
                where: { id: requestId },
                data: { status: 'Accepted' }
            });

            // Check if company already exists by email
            const existingCompany = await tx.company.findUnique({ where: { email: request.email } });
            if (existingCompany) {
                throw new Error('Company with this email already exists');
            }

            // Fetch Plan details to get currency and other info
            const plan = await tx.plan.findUnique({ where: { id: request.planId } });

            // Calculate End Date based on billing cycle
            const startDate = new Date(request.startDate);
            let endDate = new Date(startDate);
            if (request.billingCycle === 'Yearly') {
                endDate.setFullYear(startDate.getFullYear() + 1);
            } else {
                endDate.setMonth(startDate.getMonth() + 1);
            }

            // Create Company
            const company = await tx.company.create({
                data: {
                    name: request.companyName,
                    email: request.email,
                    currency: plan?.currency || 'USD',
                    startDate: startDate,
                    endDate: endDate,
                    planId: request.planId,
                    planType: request.billingCycle
                }
            });

            // Create Admin User for the company
            const bcrypt = require('bcryptjs');
            const initialPassword = req.body.password || '123456';
            const hashedInitialPassword = await bcrypt.hash(initialPassword, 10);

            await tx.user.create({
                data: {
                    name: request.companyName,
                    email: request.email,
                    password: hashedInitialPassword,
                    role: 'COMPANY',
                    companyId: company.id
                }
            });

            // Initialize default data for the new company
            const { initializeCompanyData } = require('../services/companyInitializationService');
            await initializeCompanyData(company.id, tx);

            return company;
        });

        res.json({ message: 'Request accepted and company created', company: result });
    } catch (error) {
        console.error('Approve Plan Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const rejectPlanRequest = async (req, res) => {
    try {
        const planRequest = await prisma.planrequest.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'Rejected' }
        });
        res.json(planRequest);
    } catch (error) {
        console.error('Reject Plan Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPlanRequest,
    getPlanRequests,
    getPlanRequestById,
    updatePlanRequest,
    deletePlanRequest,
    approvePlanRequest,
    rejectPlanRequest
};

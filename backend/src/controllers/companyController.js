const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const { isCloudinaryConfigured } = require('../utils/cloudinaryConfig');

const createCompany = async (req, res) => {
    try {
        const { name, email, phone, address, startDate, endDate, planId, planType, password } = req.body;

        let logoUrl = null;
        if (req.file) {
            if (isCloudinaryConfigured) {
                logoUrl = req.file.path; // Cloudinary URL
            } else {
                console.warn('File received but Cloudinary not configured. Logo not saved.');
            }
        }

        // Check if company or user already exists
        const existingCompany = await prisma.company.findUnique({ where: { email } });
        if (existingCompany) return res.status(400).json({ error: 'Company with this email already exists' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });

        // Hash password for the company admin
        if (!password) {
            return res.status(400).json({ error: 'Password is required for creating a company account' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Company and Admin User in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    email,
                    phone,
                    address,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    planId: planId ? parseInt(planId) : null,
                    planType,
                    logo: logoUrl
                }
            });

            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'COMPANY',
                    companyId: company.id
                }
            });

            // Initialize default data for the new company
            const { initializeCompanyData } = require('../services/companyInitializationService');
            await initializeCompanyData(company.id, tx);

            return { company, user };
        });

        res.status(201).json(result.company);
    } catch (error) {
        console.error('Create Company Error:', error);
        res.status(500).json({
            error: error.message || 'Internal Server Error'
        });
    }
};

const getCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: {
                user: true,
                plan: true
            }
        });
        res.json(companies);
    } catch (error) {
        console.error('Get Companies Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getCompanyById = async (req, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                user: true,
                plan: true
            }
        });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        console.error('Get Company By ID Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateCompany = async (req, res) => {
    try {
        console.log('📥 Received company update request');
        console.log('Company ID:', req.params.id);
        console.log('Request body fields:', Object.keys(req.body));
        console.log('Files received:', req.files ? Object.keys(req.files) : 'None');

        const {
            name, email, phone, website, address, city, state, zip, country, currency,
            startDate, endDate, planId, planType,
            invoiceTemplate, invoiceColor, showQrCode,
            bankName, accountHolder, accountNumber,
            ifsc,
            terms,
            notes,
            inventoryConfig
        } = req.body;

        const updateData = {
            name,
            email,
            phone,
            website,
            address,
            city,
            state,
            zip,
            country,
            currency,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            planId: planId ? parseInt(planId) : undefined,
            planType: planType || undefined,
            invoiceTemplate,
            invoiceColor,
            showQrCode: showQrCode === 'true' || showQrCode === true,
            bankName,
            accountHolder,
            accountNumber,
            ifsc,
            terms,
            notes,
            inventoryConfig: inventoryConfig ? (typeof inventoryConfig === 'object' ? JSON.stringify(inventoryConfig) : inventoryConfig) : undefined
        };

        if (req.files) {
            if (isCloudinaryConfigured) {
                if (req.files['logo']) {
                    updateData.logo = req.files['logo'][0].path;
                    console.log('✅ Company logo uploaded:', updateData.logo);
                }
                if (req.files['invoiceLogo']) {
                    updateData.invoiceLogo = req.files['invoiceLogo'][0].path;
                    console.log('✅ Invoice logo uploaded:', updateData.invoiceLogo);
                }
            } else {
                console.warn('⚠️ Files received but Cloudinary not configured. Logos not updated.');
            }
        } else if (req.file) {
            // Fallback if single file upload is still used somewhere or mostly for logo
            if (isCloudinaryConfigured) {
                updateData.logo = req.file.path;
                console.log('✅ Company logo uploaded (single):', updateData.logo);
            }
        }

        console.log('💾 Updating company with data:', updateData);

        const companyId = parseInt(req.params.id);

        const company = await prisma.$transaction(async (tx) => {
            // 1. Update Company Data
            const updatedCompany = await tx.company.update({
                where: { id: companyId },
                data: updateData,
                include: { plan: true }
            });

            // 2. Update Admin User (Role: COMPANY)
            const { password, userEmail } = req.body;
            let userUpdateData = {};

            if (email) userUpdateData.email = email; // If company email changes, user email changes too? User wants specific fields.
            if (password) {
                userUpdateData.password = await bcrypt.hash(password, 10);
            }

            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.updateMany({
                    where: { companyId: companyId, role: 'COMPANY' },
                    data: userUpdateData
                });
            }

            return updatedCompany;
        });

        console.log('✅ Company updated successfully!');
        res.json(company);
    } catch (error) {
        console.error('❌ Update Company Error:', error);
        res.status(500).json({
            error: error.message || 'Internal Server Error'
        });
    }
};

const deleteCompany = async (req, res) => {
    try {
        // Transaction to delete company and its users
        await prisma.$transaction(async (tx) => {
            await tx.user.deleteMany({ where: { companyId: parseInt(req.params.id) } });
            await tx.company.delete({ where: { id: parseInt(req.params.id) } });
        });
        res.json({ message: 'Company and its users deleted successfully' });
    } catch (error) {
        console.error('Delete Company Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany
};

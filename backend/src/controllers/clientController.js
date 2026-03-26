const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Client
const createClient = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const clientData = req.body;

        if (!clientData.clientName) {
            return res.status(400).json({
                success: false,
                message: 'Client name is required'
            });
        }

        const client = await prisma.client.create({
            data: {
                clientName: clientData.clientName,
                contactName: clientData.contactName,
                email: clientData.email,
                phone: clientData.phone,
                companyName: clientData.companyName,
                address: clientData.address,
                gstin: clientData.gstin,
                status: clientData.status || 'Active',
                companyId: companyId
            }
        });

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create client'
        });
    }
};

// Get All Clients
const getAllClients = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const clients = await prisma.client.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch clients'
        });
    }
};

// Get Client by ID
const getClientById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const client = await prisma.client.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client'
        });
    }
};

// Update Client
const updateClient = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const clientData = req.body;

        // Check if client exists
        const existingClient = await prisma.client.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            }
        });

        if (!existingClient) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const client = await prisma.client.update({
            where: { 
                id: parseInt(id)
            },
            data: {
                clientName: clientData.clientName,
                contactName: clientData.contactName,
                email: clientData.email,
                phone: clientData.phone,
                companyName: clientData.companyName,
                address: clientData.address,
                gstin: clientData.gstin,
                status: clientData.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Client updated successfully',
            data: client
        });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update client'
        });
    }
};

// Delete Client
const deleteClient = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        // Check if client exists
        const client = await prisma.client.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        await prisma.client.delete({
            where: { 
                id: parseInt(id)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Client deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete client'
        });
    }
};

module.exports = {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient
};

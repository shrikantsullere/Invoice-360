const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = cloud_name && api_key && api_secret &&
    cloud_name !== 'your_cloud_name' &&
    api_key !== 'your_api_key' &&
    api_secret !== 'your_api_secret';

if (!isConfigured) {
    console.warn('--- WARNING: Cloudinary is not configured correctly. Logo uploads will be disabled. ---');
}

cloudinary.config({
    cloud_name: isConfigured ? cloud_name : 'placeholder',
    api_key: isConfigured ? api_key : 'placeholder',
    api_secret: isConfigured ? api_secret : 'placeholder',
});

// Storage for company logos
const storage = isConfigured ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'company_logos',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
}) : multer.memoryStorage();

// Storage for customers (more flexible formats)
const customerStorage = isConfigured ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'customers',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'docx', 'xlsx', 'txt'],
    },
}) : multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const customerUpload = multer({
    storage: customerStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { 
    cloudinary, 
    upload, 
    customerUpload,
    isCloudinaryConfigured: isConfigured 
};
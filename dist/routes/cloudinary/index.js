"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloudinary_1 = require("../../controllers/cloudinary");
const router = (0, express_1.Router)();
// Handle preflight OPTIONS requests for CORS
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
});
// Upload file
console.log("uploadFileBackend1");
router.post('/upload', cloudinary_1.upload.single('file'), cloudinary_1.uploadFile);
// Test Cloudinary configuration
router.get('/config', cloudinary_1.testCloudinaryConfig);
// Delete file
router.delete('/:publicId', cloudinary_1.deleteFile);
// Get file info
router.get('/:publicId', cloudinary_1.getFileInfo);
exports.default = router;

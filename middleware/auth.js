const jwt = require('jsonwebtoken');

// Middleware untuk melindungi rute admin
const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.adminToken;
    
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Silakan login.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-admin-token');
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token tidak valid' });
    }
};

module.exports = { verifyAdminToken };
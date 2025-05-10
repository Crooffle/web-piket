require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'rahasia-cleaning-app',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 jam
}));

// Database path
const usersDbPath = path.join(__dirname, 'data', 'users.json');

// Memastikan folder data ada
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Membuat file database jika belum ada
if (!fs.existsSync(usersDbPath)) {
    const initialData = {
        admin: {
            username: 'admin',
            password: bcrypt.hashSync('admin123', 10),
            role: 'admin'
        },
        users: [
            { id: 1, name: 'Budi', isDone: false, day: 'Senin', hasPaid: true },
            { id: 2, name: 'Ani', isDone: true, day: 'Selasa', hasPaid: true },
            { id: 3, name: 'Siti', isDone: false, day: 'Rabu', hasPaid: false },
            { id: 4, name: 'Dodi', isDone: true, day: 'Kamis', hasPaid: true },
            { id: 5, name: 'Rini', isDone: false, day: 'Jumat', hasPaid: false },
            { id: 6, name: 'Joko', isDone: false, day: 'Sabtu', hasPaid: true },
            { id: 7, name: 'Maya', isDone: true, day: 'Minggu', hasPaid: true }
        ]
    };
    fs.writeFileSync(usersDbPath, JSON.stringify(initialData, null, 2));
}

// Middleware untuk verifikasi token admin
const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.adminToken;
    
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Silakan login.' });
    }
    
    try {
        const decoded = jwt.verify(token, 'rahasia-admin-token');
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token tidak valid' });
    }
};

// Routes untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API endpoint untuk mengambil data jadwal
app.get('/api/schedule', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
        res.json(data.users);
    } catch (error) {
        res.status(500).json({ message: 'Error mengambil data', error: error.message });
    }
});

// Halaman Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    try {
        const data = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
        
        if (data.admin && data.admin.username === username) {
            const validPassword = bcrypt.compareSync(password, data.admin.password);
            
            if (validPassword) {
                const token = jwt.sign(
                    { username: data.admin.username, role: 'admin' },
                    'rahasia-admin-token',
                    { expiresIn: '1h' }
                );
                
                res.cookie('adminToken', token, { httpOnly: true });
                return res.json({ success: true, message: 'Login berhasil' });
            }
        }
        
        res.status(401).json({ success: false, message: 'Username atau password salah' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error server', error: error.message });
    }
});

// API untuk admin mendapatkan data
app.get('/api/admin/users', verifyAdminToken, (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
        res.json(data.users);
    } catch (error) {
        res.status(500).json({ message: 'Error mengambil data', error: error.message });
    }
});

// API untuk admin mengupdate status tugas dan pembayaran denda
app.put('/api/admin/users/:id', verifyAdminToken, (req, res) => {
    const userId = parseInt(req.params.id);
    const { isDone, hasPaid } = req.body;
    
    try {
        const data = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
        const userIndex = data.users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        if (isDone !== undefined) data.users[userIndex].isDone = isDone;
        if (hasPaid !== undefined) data.users[userIndex].hasPaid = hasPaid;
        
        fs.writeFileSync(usersDbPath, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Data berhasil diupdate', user: data.users[userIndex] });
    } catch (error) {
        res.status(500).json({ message: 'Error update data', error: error.message });
    }
});

// Logout admin
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Logout berhasil' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
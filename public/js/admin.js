document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const loginMessage = document.getElementById('login-message');
    const logoutBtn = document.getElementById('logout-btn');
    const usersTable = document.getElementById('users-list');
    const searchInput = document.getElementById('search-input');
    
    let usersData = [];

    // Cek apakah ada token admin (sudah login)
    function checkAuthentication() {
        // Cek apakah ada cookie token
        const hasCookie = document.cookie.includes('adminToken');
        
        if (hasCookie) {
            // Coba ambil data untuk validasi token
            fetchUsersData()
                .then(success => {
                    if (success) {
                        showAdminPanel();
                    } else {
                        showLoginForm();
                    }
                });
        } else {
            showLoginForm();
        }
    }

    // Menampilkan form login
    function showLoginForm() {
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }

    // Menampilkan panel admin
    function showAdminPanel() {
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    }

    // Menampilkan pesan di form login
    function showLoginMessage(message, isError = false) {
        loginMessage.textContent = message;
        loginMessage.className = 'message';
        
        if (isError) {
            loginMessage.classList.add('error');
        } else {
            loginMessage.classList.add('success');
        }
    }

    // Proses login admin
    async function loginAdmin(username, password) {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showLoginMessage('Login berhasil! Mengalihkan...');
                setTimeout(() => {
                    showAdminPanel();
                    fetchUsersData();
                }, 1000);
                return true;
            } else {
                showLoginMessage(result.message || 'Login gagal. Silakan coba lagi.', true);
                return false;
            }
        } catch (error) {
            console.error('Error during login:', error);
            showLoginMessage('Terjadi kesalahan saat login. Silakan coba lagi.', true);
            return false;
        }
    }

    // Proses logout admin
    async function logoutAdmin() {
        try {
            const response = await fetch('/api/admin/logout', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showLoginForm();
                showLoginMessage('Logout berhasil!');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Mengambil data pengguna
    async function fetchUsersData() {
        try {
            const response = await fetch('/api/admin/users');
            
            // Jika unauthorized, berarti token tidak valid
            if (response.status === 401) {
                showLoginForm();
                return false;
            }
            
            const data = await response.json();
            usersData = data;
            
            renderUsersTable(usersData);
            updateSummary(usersData);
            return true;
        } catch (error) {
            console.error('Error fetching users data:', error);
            return false;
        }
    }

    // Render tabel pengguna
    function renderUsersTable(users) {
        usersTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const doneStatus = user.isDone ? 
                '<span class="done">Selesai</span>' : 
                '<span class="not-done">Belum Selesai</span>';
                
            const paidStatus = user.hasPaid ? 
                '<span class="paid">Lunas</span>' : 
                '<span class="not-paid">Belum Bayar</span>';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.day}</td>
                <td>${doneStatus}</td>
                <td>${paidStatus}</td>
                <td>
                    <button class="btn btn-toggle-done" data-id="${user.id}" data-status="${user.isDone}">
                        ${user.isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                    </button>
                    <button class="btn btn-toggle-paid" data-id="${user.id}" data-paid="${user.hasPaid}">
                        ${user.hasPaid ? 'Tandai Belum Bayar' : 'Tandai Sudah Bayar'}
                    </button>
                </td>
            `;
            
            usersTable.appendChild(row);
        });
        
        // Event listener untuk button toggle status
        document.querySelectorAll('.btn-toggle-done').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = parseInt(e.target.getAttribute('data-id'));
                const currentStatus = e.target.getAttribute('data-status') === 'true';
                await updateUserStatus(userId, !currentStatus);
            });
        });
        
        // Event listener untuk button toggle pembayaran
        document.querySelectorAll('.btn-toggle-paid').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = parseInt(e.target.getAttribute('data-id'));
                const currentPaid = e.target.getAttribute('data-paid') === 'true';
                await updateUserPayment(userId, !currentPaid);
            });
        });
    }

    // Update status pengerjaan tugas
    async function updateUserStatus(userId, isDone) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isDone })
            });
            
            if (response.ok) {
                fetchUsersData();
            }
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    }

    // Update status pembayaran denda
    async function updateUserPayment(userId, hasPaid) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hasPaid })
            });
            
            if (response.ok) {
                fetchUsersData();
            }
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    }

    // Update ringkasan data
    function updateSummary(users) {
        const totalUsers = users.length;
        const totalDone = users.filter(user => user.isDone).length;
        const totalNotDone = users.filter(user => !user.isDone).length;
        const totalFines = users.filter(user => !user.isDone && !user.hasPaid).length * 5000;
        
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-done').textContent = totalDone;
        document.getElementById('total-not-done').textContent = totalNotDone;
        document.getElementById('total-fine').textContent = `Rp ${totalFines.toLocaleString('id-ID')}`;
    }

    // Filter pencarian
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            renderUsersTable(usersData);
        } else {
            const filteredUsers = usersData.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.day.toLowerCase().includes(searchTerm)
            );
            renderUsersTable(filteredUsers);
        }
    }

    // Event listener untuk form login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        await loginAdmin(username, password);
    });

    // Event listener untuk button logout
    logoutBtn.addEventListener('click', () => {
        logoutAdmin();
    });

    // Event listener untuk pencarian
    searchInput.addEventListener('input', () => {
        handleSearch();
    });

    // Cek autentikasi saat halaman dimuat
    checkAuthentication();
});
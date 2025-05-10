document.addEventListener('DOMContentLoaded', () => {
    // Fungsi untuk mendapatkan hari dalam bahasa Indonesia
    function getDayName(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[date.getDay()];
    }

    // Mendapatkan hari ini
    const today = new Date();
    const currentDay = getDayName(today);

    // Fungsi untuk memuat data jadwal
    async function loadScheduleData() {
        try {
            const response = await fetch('/api/schedule');
            const data = await response.json();
            
            if (data) {
                displaySchedule(data);
                displayStatusLists(data);
            }
        } catch (error) {
            console.error('Error loading schedule data:', error);
            showErrorMessage('Gagal memuat data jadwal. Silakan refresh halaman.');
        }
    }

    // Fungsi untuk menampilkan jadwal
    function displaySchedule(users) {
        const personCards = document.querySelectorAll('.person-card');
        
        personCards.forEach(card => {
            const day = card.getAttribute('data-day');
            const user = users.find(u => u.day === day);
            
            if (user) {
                const statusClass = user.isDone ? 'done' : 'not-done';
                const today = day === currentDay ? ' <strong>(HARI INI)</strong>' : '';
                
                card.innerHTML = `
                    <div class="${statusClass}">
                        ${user.name}${today}
                        <div class="status-badge">
                            ${user.isDone ? '✓ Selesai' : '✗ Belum Selesai'}
                        </div>
                    </div>
                `;
                card.classList.add(statusClass);
            } else {
                card.innerHTML = 'Belum ditugaskan';
            }
        });
        
        // Highlight hari ini
        const todayElement = document.querySelector(`[data-day="${currentDay}"]`).parentNode;
        if (todayElement) {
            todayElement.classList.add('today');
            todayElement.style.border = '2px solid #4caf50';
            todayElement.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.3)';
        }
    }

    // Fungsi untuk menampilkan status
    function displayStatusLists(users) {
        const doneList = document.getElementById('done-list');
        const notDoneList = document.getElementById('not-done-list');
        const fineList = document.getElementById('fine-list');
        
        // Reset list
        doneList.innerHTML = '';
        notDoneList.innerHTML = '';
        fineList.innerHTML = '';
        
        // Filter users berdasarkan status
        const doneUsers = users.filter(user => user.isDone);
        const notDoneUsers = users.filter(user => !user.isDone);
        const fineUsers = users.filter(user => !user.isDone && !user.hasPaid);
        
        // Tampilkan users yang sudah mengerjakan
        if (doneUsers.length > 0) {
            doneUsers.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.name} (${user.day})`;
                doneList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Belum ada yang mengerjakan';
            doneList.appendChild(li);
        }
        
        // Tampilkan users yang belum mengerjakan
        if (notDoneUsers.length > 0) {
            notDoneUsers.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.name} (${user.day})`;
                notDoneList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Semua sudah mengerjakan';
            notDoneList.appendChild(li);
        }
        
        // Tampilkan users yang terkena denda
        if (fineUsers.length > 0) {
            fineUsers.forEach(user => {
                const li = document.createElement('li');
                li.innerHTML = `${user.name} (${user.day}) <span class="fine-amount">Rp 5.000</span>`;
                fineList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada yang terkena denda';
            fineList.appendChild(li);
        }
    }

    // Fungsi untuk menampilkan pesan error
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.textContent = message;
        
        document.querySelector('main').prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Load data saat halaman dimuat
    loadScheduleData();
});
// Chart and users logic extracted from admin_dashboard.html
document.addEventListener('DOMContentLoaded', function() {
    try {
        loadUsers();
        updateReports();
        loadActivityTable();
    } catch(e){ console.error(e); }

    // Update periodically
    setInterval(() => {
        try { updateReports(); loadActivityTable(); } catch(e){console.error(e);}    
    }, 300000);

    // Configure user form
    const userForm = document.getElementById('userForm');
    if(userForm){
        userForm.addEventListener('submit', function(e){
            e.preventDefault();
            const email = document.getElementById('userEmail').value;
            const password = document.getElementById('userPassword').value;
            const role = document.getElementById('userRole').value;
            users.push({ id: users.length + 1, email, role, status: 'Activo', lastActivity: new Date().toLocaleString() });
            loadUsers();
            closeUserModal();
        });
    }
});

// Charts (assumes Chart.js loaded)
(function(){
    try{
        const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
        const recoleccionesDiarias = [15,21,18,24,23,19,14];
        const ctxRecolecciones = document.getElementById('recoleccionesChart');
        if(ctxRecolecciones){
            new Chart(ctxRecolecciones, {
                type: 'line',
                data: { labels: diasSemana, datasets: [{ label: 'Recolecciones', data: recoleccionesDiarias, borderColor: '#2b9348', backgroundColor: 'rgba(43, 147, 72, 0.1)', tension: 0.4, fill: true }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { maxTicksLimit: 5 } }, x: { grid: { display: false } } } }
            });
        }

        const ctxResiduos = document.getElementById('residuosChart');
        if(ctxResiduos){
            new Chart(ctxResiduos, {
                type: 'doughnut',
                data: { labels: ['Plástico','Papel','Vidrio','Metal','Orgánico'], datasets: [{ data: [35,25,15,10,15], backgroundColor: ['#2b9348','#55a630','#80b918','#aacc00','#bfd200'] }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', align: 'center', labels: { boxWidth: 12, padding: 15, font: { size: 11 } } } }, layout: { padding: { left: 10, right: 10 } } }
            });
        }
    }catch(e){ console.error('chart init error', e); }
})();

// Simple user management (kept as before)
let users = [ { id: 1, email: 'admin@admin.com', role: 'admin', status: 'Activo', lastActivity: '2025-10-16 10:30' }, { id: 2, email: 'user@user.com', role: 'user', status: 'Activo', lastActivity: '2025-10-16 11:45' }, { id: 3, email: 'driver@driver.com', role: 'driver', status: 'Activo', lastActivity: '2025-10-16 12:15' } ];

function loadUsers(){ const tbody = document.getElementById('usersTableBody'); if(!tbody) return; tbody.innerHTML = users.map(user => `<tr> <td>${user.email}</td> <td><span class="badge badge-${user.role}">${user.role}</span></td> <td><span class="badge badge-${user.status === 'Activo' ? 'success' : 'warning'}">${user.status}</span></td> <td>${user.lastActivity}</td> <td> <button class="admin-btn-icon" onclick="editUser(${user.id})"> <i class="fas fa-edit"></i> </button> <button class="admin-btn-icon" onclick="deleteUser(${user.id})"> <i class="fas fa-trash"></i> </button> </td> </tr>`).join(''); }
function showAddUserModal(){ document.getElementById('modalTitle').textContent = 'Agregar Usuario'; document.getElementById('userEmail').value = ''; document.getElementById('userPassword').value = ''; document.getElementById('userRole').value = 'user'; document.getElementById('userModal').style.display = 'flex'; }
function closeUserModal(){ document.getElementById('userModal').style.display = 'none'; }
function editUser(userId){ const user = users.find(u => u.id === userId); if(user){ document.getElementById('modalTitle').textContent = 'Editar Usuario'; document.getElementById('userEmail').value = user.email; document.getElementById('userRole').value = user.role; document.getElementById('userModal').style.display = 'flex'; } }
function deleteUser(userId){ if(confirm('¿Estás seguro de que deseas eliminar este usuario?')){ users = users.filter(u => u.id !== userId); loadUsers(); } }
function filterUsers(){ const searchTerm = document.getElementById('userSearch').value.toLowerCase(); const filtered = users.filter(user => user.email.toLowerCase().includes(searchTerm) || user.role.toLowerCase().includes(searchTerm)); const tbody = document.getElementById('usersTableBody'); if(!tbody) return; tbody.innerHTML = filtered.map(user => `<tr> <td>${user.email}</td> <td><span class="badge badge-${user.role}">${user.role}</span></td> <td><span class="badge badge-${user.status === 'Activo' ? 'success' : 'warning'}">${user.status}</span></td> <td>${user.lastActivity}</td> <td> <button class="admin-btn-icon" onclick="editUser(${user.id})"> <i class="fas fa-edit"></i> </button> <button class="admin-btn-icon" onclick="deleteUser(${user.id})"> <i class="fas fa-trash"></i> </button> </td> </tr>`).join(''); }

function updateReports(){ document.getElementById('totalRecolecciones').textContent = '358'; document.getElementById('usuariosActivos').textContent = '42'; document.getElementById('rutasCompletadas').textContent = '156'; }
function loadActivityTable(){ const activityTable = document.getElementById('activityTable'); if(!activityTable) return; const actividadReciente = [ { fecha: '2025-10-16 09:30', usuario: 'Juan Pérez', tipo: 'Recolección', estado: 'Completado' }, { fecha: '2025-10-16 10:15', usuario: 'María García', tipo: 'Entrega', estado: 'En proceso' }, { fecha: '2025-10-16 11:00', usuario: 'Carlos López', tipo: 'Recolección', estado: 'Completado' }, { fecha: '2025-10-16 11:45', usuario: 'Ana Martínez', tipo: 'Entrega', estado: 'Completado' }, { fecha: '2025-10-16 12:30', usuario: 'Pedro Sánchez', tipo: 'Recolección', estado: 'En proceso' } ]; activityTable.innerHTML = actividadReciente.map(actividad => `<tr> <td>${actividad.fecha}</td> <td>${actividad.usuario}</td> <td>${actividad.tipo}</td> <td> <span class="badge badge-${actividad.estado === 'Completado' ? 'success' : 'warning'}"> ${actividad.estado} </span> </td> </tr>`).join(''); }

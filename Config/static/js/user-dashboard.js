// User dashboard JS: profile + support form + gamification + stats
(function () {
  function $(sel) { return document.querySelector(sel); }
  function qs(sel) { return document.querySelectorAll(sel); }

  // Fetch and display user profile
  function fetchProfile() {
    axios.get('/api/profile').then(res => {
      const data = res.data || {};
      if ($('#ud-email')) $('#ud-email').innerText = data.email || '';
      if ($('#ud-role')) $('#ud-role').innerText = data.role || '';
      if ($('#support-email') && !$('#support-email').value) $('#support-email').value = data.email || '';
    }).catch(err => {
      console.warn('No profile', err);
    });
  }

  // Fetch and display pickups count
  function fetchPickupsCount() {
    axios.get('/api/pickups/count').then(res => {
      const count = res.data.count || 0;
      if ($('#ud-pickups-count')) $('#ud-pickups-count').innerText = count;
    }).catch(err => {
      console.warn('Error fetching pickups count', err);
      if ($('#ud-pickups-count')) $('#ud-pickups-count').innerText = '0';
    });
  }

  // Fetch and display gamification data
  function fetchGamification() {
    axios.get('/api/gamification').then(res => {
      const data = res.data || {};
      const points = data.points || 0;
      const deliveries = data.deliveries || 0;
      const achievements = data.achievements || [];

      // Update stats cards
      if ($('#ud-total-points')) $('#ud-total-points').innerText = points;
      if ($('#ud-deliveries-count')) $('#ud-deliveries-count').innerText = deliveries;
      if ($('#ud-achievements-count')) $('#ud-achievements-count').innerText = achievements.length;

      // Display achievements
      const achievementsList = $('#ud-achievements-list');
      if (achievementsList) {
        achievementsList.innerHTML = '';
        if (achievements.length === 0) {
          achievementsList.innerHTML = '<span class="badge badge-secondary">Aún no has desbloqueado logros</span>';
        } else {
          const achievementNames = {
            'first': '🎉 Primer Reciclaje',
            'five': '🌟 Cinco Reciclajes',
            'collector': '🏆 Coleccionista (200+ puntos)'
          };
          achievements.forEach(ach => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-success mr-2 mb-2';
            badge.style.fontSize = '14px';
            badge.innerText = achievementNames[ach] || ach;
            achievementsList.appendChild(badge);
          });
        }
      }
    }).catch(err => {
      console.warn('Error fetching gamification', err);
      if ($('#ud-total-points')) $('#ud-total-points').innerText = '0';
      if ($('#ud-deliveries-count')) $('#ud-deliveries-count').innerText = '0';
      if ($('#ud-achievements-count')) $('#ud-achievements-count').innerText = '0';
      if ($('#ud-achievements-list')) $('#ud-achievements-list').innerHTML = '<span class="badge badge-secondary">Error cargando logros</span>';
    });
  }

  // Fetch and display deliveries history
  function fetchDeliveries() {
    axios.get('/api/deliveries').then(res => {
      const deliveries = res.data || [];
      const tbody = $('#ud-deliveries-table');
      if (tbody) {
        tbody.innerHTML = '';
        if (deliveries.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="padding:12px;text-align:center" class="text-small text-muted">No tienes entregas registradas aún.</td></tr>';
        } else {
          deliveries.forEach(delivery => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #f0f3f2';
            row.innerHTML = `
              <td style="padding:10px;font-size:0.9rem">${delivery.id}</td>
              <td style="padding:10px;font-size:0.9rem">Punto #${delivery.point_id || 'N/A'}</td>
              <td style="padding:10px;font-size:0.9rem"><span class="dashboard-badge" style="background:#eef7ee;color:#2b9348">${delivery.points} pts</span></td>
              <td style="padding:10px;font-size:0.9rem">${new Date(delivery.created_at).toLocaleString('es-ES')}</td>
            `;
            tbody.appendChild(row);
          });
        }
      }
    }).catch(err => {
      console.warn('Error fetching deliveries', err);
      const tbody = $('#ud-deliveries-table');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding:12px;text-align:center;color:#dc2626" class="text-small">Error cargando entregas</td></tr>';
      }
    });
  }

  // Submit support form
  function submitSupport(e) {
    e.preventDefault();
    const name = $('#support-name').value.trim();
    const email = $('#support-email').value.trim();
    const message = $('#support-message').value.trim();
    if (!message) { alert('Escribe un mensaje antes de enviar.'); return; }
    axios.post('/api/support', { name, email, message }).then(res => {
      alert('Mensaje enviado. Gracias por contactarnos.');
      $('#support-form').reset();
    }).catch(err => {
      console.error(err);
      alert('Error enviando mensaje. Intenta luego.');
    });
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function () {
    fetchProfile();
    fetchPickupsCount();
    fetchGamification();
    fetchDeliveries();

    const form = $('#support-form');
    if (form) form.addEventListener('submit', submitSupport);
  });
})();

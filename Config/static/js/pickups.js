$(function(){
  const apiBase = '/api/pickups';
  // UI helpers
  const $tableBody = $('#pickupsTable tbody');
  const $createForm = $('#createPickupForm');

  function show(msg, type='success'){
    if(window.alertify){
      if(type==='error') alertify.error(msg); else alertify.success(msg);
    } else {
      // simple fallback
      console[type === 'error' ? 'error' : 'log'](msg);
    }
  }

  function renderRow(p){
    return `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td>${p.address}</td>
        <td>${p.scheduled_at || ''}</td>
        <td>${p.status}</td>
        <td>
          <button class="btn btn-sm btn-info btn-edit">Editar</button>
          <button class="btn btn-sm btn-danger btn-delete">Eliminar</button>
        </td>
      </tr>
    `;
  }

  function setLoading(on){
    if(on){
      if($('#pickupsLoader').length === 0){
        $('#pickupsTable').before('<div id="pickupsLoader">Cargando recolecciones...</div>');
      }
    } else {
      $('#pickupsLoader').remove();
    }
  }

  function showEmpty(ifEmpty){
    if(ifEmpty){
      if($('#pickupsEmpty').length === 0){
        $('#pickupsTable').after('<div id="pickupsEmpty">No hay recolecciones registradas.</div>');
      }
    } else {
      $('#pickupsEmpty').remove();
    }
  }

  function loadPickups(){
    setLoading(true);
    axios.get(apiBase).then(res => {
      const data = res.data || [];
      $tableBody.empty();
      if(data.length === 0){
        showEmpty(true);
      } else {
        showEmpty(false);
        data.forEach(p => $tableBody.append(renderRow(p)));
      }
      // update badge count
      try { updateBadge(data.length); } catch(e){ /* ignore */ }
    }).catch(err => {
      show('Error cargando recolecciones','error');
      console.error(err);
    }).finally(() => setLoading(false));
  }

  function updateBadge(count){
    const val = (typeof count === 'number') ? count : null;
    const $b = $('.badge-pickups');
    if($b.length === 0) return;
    if(val && val > 0) $b.text(val); else $b.text('');
  }

  // Create
  $('#createPickupForm').on('submit', function(e){
    e.preventDefault();
    const address = $('#address').val();
    if(!address || address.trim().length < 3){
      show('Dirección inválida', 'error');
      return;
    }
    setLoading(true);
    axios.post(apiBase, { address }).then(res => {
      show('Recolección creada');
      $('#address').val('');
      loadPickups();
      // refresh badge from server in case of race
      axios.get(apiBase + '/count').then(r=>{ updateBadge(r.data?.count || 0); }).catch(()=>{});
    }).catch(err => {
      const msg = err?.response?.data?.message || 'Error creando recolección';
      show(msg,'error');
      console.error(err);
    }).finally(() => setLoading(false));
  });

  // Delegate edit/delete
  $('#pickupsTable').on('click', '.btn-delete', function(){
    const id = $(this).closest('tr').data('id');
    if(!confirm('Eliminar recolección #' + id + '?')) return;
    axios.delete(apiBase + '/' + id).then(res => {
      show('Eliminado');
      loadPickups();
      axios.get(apiBase + '/count').then(r=>{ updateBadge(r.data?.count || 0); }).catch(()=>{});
    }).catch(err => {
      show('Error eliminando','error');
    });
  });

  $('#pickupsTable').on('click', '.btn-edit', function(){
    const $tr = $(this).closest('tr');
    const id = $tr.data('id');
    const address = $tr.find('td').eq(1).text();
    const newAddress = prompt('Editar dirección', address);
    if(newAddress === null) return; // cancel
    axios.put(apiBase + '/' + id, { address: newAddress }).then(res => {
      show('Actualizado');
      loadPickups();
      axios.get(apiBase + '/count').then(r=>{ updateBadge(r.data?.count || 0); }).catch(()=>{});
    }).catch(err => {
      show('Error actualizando','error');
    });
  });

  // Initial load
  loadPickups();
});

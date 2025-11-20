// Dashboard backend connector: overrides localStorage behavior when backend available
(function(){
  async function fetchJSON(url, opts){
    try{ const r = await axios(url, opts); return r.data; }catch(e){ console.warn('fetchJSON failed', url, e); return null; }
  }

  function applyServerState(serverState){
    if(!serverState) return;
    try{
      if(typeof serverState.points !== 'undefined'){
        state.points = serverState.points;
      }
      if(typeof serverState.deliveries !== 'undefined'){
        state.deliveries = serverState.deliveries;
      }
      if(Array.isArray(serverState.achievements)){
        state.achievements = serverState.achievements;
      }
      if(serverState.email){
        // update profile display if exists
        const e = document.getElementById('ud-email'); if(e) e.innerText = serverState.email;
      }
      // update UI
      if(window.updateGamificationUI) updateGamificationUI();
      if(window.updateCharts) updateCharts();
    }catch(e){ console.error(e); }
  }

  async function init(){
    // fetch gamification
    const g = await fetchJSON('/api/gamification');
    if(g) applyServerState(g);

    // fetch directory
    const dir = await fetchJSON('/api/directory');
    if(Array.isArray(dir)){
      // replace state.directory and render
      state.directory = dir;
      if(window.renderDirectory) renderDirectory();
    }

    // fetch points
    const pts = await fetchJSON('/api/points');
    if(Array.isArray(pts)){
      // convert types string to array if needed
      pts.forEach(p=>{ if(typeof p.types === 'string') p.types = p.types.split(','); });
      window.samplePoints = pts;
      if(window.renderPoints) renderPoints(window.samplePoints);
    }

    // hook registration form to POST to server
    const regBtn = document.getElementById('btn-register');
    if(regBtn){
      regBtn.addEventListener('click', async function(){
        const role = document.getElementById('role').value;
        const name = document.getElementById('name').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const desc = document.getElementById('desc').value.trim();
        if(!name || !contact){ alert('Por favor completa nombre y contacto.'); return; }
        const res = await fetchJSON('/api/directory', { method: 'post', data: { role, name, contact, desc } });
        if(res){
          // refresh directory
          const dir2 = await fetchJSON('/api/directory');
          if(Array.isArray(dir2)){ state.directory = dir2; if(window.renderDirectory) renderDirectory(); }
          alert('Registro guardado (servidor).');
          document.getElementById('name').value=''; document.getElementById('contact').value=''; document.getElementById('desc').value='';
        } else alert('Error guardando registro.');
      });
    }

    // hook simulate delivery button to call server
    const sim = document.getElementById('btn-simulate');
    if(sim){ sim.addEventListener('click', async ()=>{
      const created = await fetchJSON('/api/deliveries', { method: 'post', data: { points: 10 } });
      if(created){
        // refresh gamification
        const g2 = await fetchJSON('/api/gamification'); if(g2) applyServerState(g2);
        alert('Entrega registrada en servidor. +10 pts');
      } else alert('Error registrando entrega');
    }); }

    // ensure registerDelivery uses server as well
    window.registerDelivery = async function(pointId){
      const created = await fetchJSON('/api/deliveries', { method: 'post', data: { point_id: pointId, points: 10 } });
      if(created){
        const g2 = await fetchJSON('/api/gamification'); if(g2) applyServerState(g2);
        if(window.updateCharts) updateCharts();
        alert('Entrega registrada. Ganaste 10 pts.');
      } else alert('Error registrando entrega.');
    }

    // update badge
    const count = await fetchJSON('/api/pickups/count');
    try{ if(count && typeof count.count !== 'undefined') { const el = document.querySelector('.badge-pickups'); if(el) el.textContent = count.count || ''; } }catch(e){}
  }

  // small axios adapter to support data option
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  // adapt axios call wrapper
  window.axios = (function(orig){
    const fn = function(url, opts){
      if(!opts) return orig.get(url);
      const method = (opts.method||opts.type||'get').toLowerCase();
      if(method === 'get') return orig.get(url, { params: opts.params });
      if(method === 'post') return orig.post(url, opts.data);
      return orig({ url, method, data: opts.data });
    };
    // copy defaults so other code still works
    Object.assign(fn, orig);
    return fn;
  })(window.axios || window.axios);

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 200); });
})();

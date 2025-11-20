// Driver page JS: map initialization and route controls
document.addEventListener('DOMContentLoaded', function() {
    try { initializeMap(); loadCollectionPoints(); setupRouteControls(); } catch(e){ console.error(e); }
});

let map = null;
let routeLayer = null;
let markers = [];

function initializeMap() {
    if(!document.getElementById('route-map')) return;
    map = L.map('route-map').setView([-0.915, -78.615], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const route = [ {lat: -0.915, lng: -78.615, name: "Punto 1"}, {lat: -0.912, lng: -78.607, name: "Punto 2"}, {lat: -0.919, lng: -78.620, name: "Punto 3"} ];
    route.forEach(point => { const marker = L.marker([point.lat, point.lng]).bindPopup(point.name).addTo(map); markers.push(marker); });
    const routeCoords = route.map(p => [p.lat, p.lng]);
    routeLayer = L.polyline(routeCoords, {color: '#2b9348'}).addTo(map);
    map.fitBounds(routeLayer.getBounds());
}

function loadCollectionPoints() {
    const collectionList = document.getElementById('collectionList');
    if(!collectionList) return;
    const points = [ { address: 'Calle Principal 123', time: '09:00', status: 'pending' }, { address: 'Av. Central 456', time: '09:30', status: 'completed' }, { address: 'Plaza Norte 789', time: '10:00', status: 'pending' } ];
    collectionList.innerHTML = points.map(point => `
        <div class="collection-item">
            <div class="collection-info">
                <strong>${point.address}</strong>
                <span>${point.time}</span>
            </div>
            <div class="collection-status ${point.status === 'completed' ? 'completed' : ''}">
                ${point.status === 'completed' ? 'Completado' : 'Pendiente'}
            </div>
        </div>
    `).join('');
}

function setupRouteControls() {
    const startBtn = document.querySelector('.route-btn.start');
    const completeBtn = document.querySelector('.route-btn.complete');
    const endBtn = document.querySelector('.route-btn.end');
    if(startBtn) startBtn.addEventListener('click', () => { alert('Ruta iniciada'); startBtn.disabled = true; startBtn.style.opacity = '0.6'; });
    if(completeBtn) completeBtn.addEventListener('click', () => { const currentPoint = markers[0]; if (currentPoint) { currentPoint.setIcon(L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] })); } alert('Punto completado'); });
    if(endBtn) endBtn.addEventListener('click', () => { if(confirm('¿Seguro que deseas finalizar la ruta?')) { alert('Ruta finalizada'); window.location.reload(); } });
}

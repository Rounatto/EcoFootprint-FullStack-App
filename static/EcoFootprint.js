// --- CONFIGURATION ---
const emissionFactors = {
    car: 0.24, bus: 0.1, train: 0.06, bicycle: 0, motorcycle: 0.12,
    electricity: 0.52, natural_gas: 2.0, heating_oil: 2.68,
    beef: 31.0, lamb: 24.0, chicken: 6.0, pork: 7.0, fish: 5.0, cheese: 13.5,
    clothing: 15.0, electronics: 50.0, furniture: 30.0, plastic: 6.0
};

const units = { transport: 'km', energy: 'kWh', food: 'kg', shopping: 'units' };
const detailsByType = {
    transport: ['car', 'bus', 'train', 'bicycle', 'motorcycle'],
    energy: ['electricity', 'natural_gas', 'heating_oil'],
    food: ['beef', 'lamb', 'chicken', 'pork', 'fish', 'cheese'],
    shopping: ['clothing', 'electronics', 'furniture', 'plastic']
};

// --- VARIABLES GLOBALES ---
let activities = [];
let goals = [];
let map, emissionsChart;
let markers = [];

// --- ELEMENTS DOM ---
const activityModal = document.getElementById('activity-modal');
const activityForm = document.getElementById('activity-form');
const activityType = document.getElementById('activity-type');
const activityDetail = document.getElementById('activity-detail');
const activitiesList = document.getElementById('activities-list');
const totalFootprintEl = document.getElementById('total-footprint');
const energyUsageEl = document.getElementById('energy-usage');
const transportDistanceEl = document.getElementById('transport-distance');

// --- INITIALISATION ---
function setup() {
    initMap();
    setDefaultDates();
    setupEvents();
    loadActivities(); 
    loadGoals();
}

// --- LOGIQUE DE LA CARTE ---
function initMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    map = L.map('map').setView([34.0, 9.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', function(e) {
        if (markers.length >= 2) {
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }
        let marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        markers.push(marker);
        if (markers.length === 2) {
            let dist = (markers[0].getLatLng().distanceTo(markers[1].getLatLng()) / 1000).toFixed(2);
            document.getElementById('amount').value = dist;
            activityType.value = "transport";
            updateDetailOptions();
            alert(`Distance calculated: ${dist} km`);
        }
    });
}

// --- GRAPHIQUE (CHART.JS) ---
function updateChart() {
    const ctx = document.getElementById('emissions-chart');
    if (!ctx) return;

    const totals = { transport: 0, energy: 0, food: 0, shopping: 0 };
    activities.forEach(a => { if(totals[a.type] !== undefined) totals[a.type] += a.emission; });

    const data = [totals.transport, totals.energy, totals.food, totals.shopping];

    if (emissionsChart) {
        emissionsChart.data.datasets[0].data = data;
        emissionsChart.update();
    } else {
        emissionsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Transport', 'Energy', 'Food', 'Shopping'],
                datasets: [{ data: data, backgroundColor: ['#4ade80', '#fbbf24', '#f87171', '#60a5fa'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// --- COMMUNICATIONS BACKEND ---
async function loadActivities() {
    const res = await fetch('/api/activities');
    const json = await res.json();
    if (json.status === "success") {
        activities = json.data;
        renderAll();
    }
}

async function addActivity() {
    const type = activityType.value;
    const detail = activityDetail.value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const emission = amount * (emissionFactors[detail] || 0);

    const res = await fetch('/api/add-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, detail, amount, date, emission })
    });
    if ((await res.json()).status === "success") {
        loadActivities();
        activityModal.style.display = 'none';
        activityForm.reset();
    }
}

async function deleteActivity(id) {
    if (!confirm("Delete this activity?")) return;
    const res = await fetch(`/api/delete-activity/${id}`, { method: 'DELETE' });
    if ((await res.json()).status === "success") loadActivities();
}

async function loadGoals() {
    const res = await fetch('/api/goals');
    const json = await res.json();
    if (json.status === "success") {
        goals = json.data;
        renderGoals();
    }
}

async function addGoal() {
    const goalData = {
        type: document.getElementById('goal-type').value,
        target: parseFloat(document.getElementById('goal-target').value),
        deadline: document.getElementById('goal-deadline').value,
        description: document.getElementById('goal-description').value
    };

    const res = await fetch('/api/add-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
    });
    if ((await res.json()).status === "success") {
        loadGoals();
        document.getElementById('goal-modal').style.display = 'none';
        document.getElementById('goal-form').reset();
    }
}

// --- RENDU ---
function renderAll() {
    renderActivities();
    renderSummary();
    renderGoals();
    updateChart();
}

function renderActivities() {
    activitiesList.innerHTML = activities.map(a => `
        <div class="activity-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span>${new Date(a.date).toLocaleDateString()}</span>
            <strong>${a.detail}</strong>
            <span>${a.emission.toFixed(2)} kg CO2</span>
            <button onclick="deleteActivity('${a.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button>
        </div>
    `).join('');
}

function renderGoals() {
    const container = document.getElementById('goals-container');
    if (!container) return;
    container.innerHTML = goals.map(g => `
        <div class="card" style="margin-bottom:10px;">
            <h3>${g.description}</h3>
            <p>Target: ${g.target} kg CO2 | Deadline: ${new Date(g.deadline).toLocaleDateString()}</p>
        </div>
    `).join('');
}

function renderSummary() {
    let total = 0, energy = 0, transport = 0;
    activities.forEach(a => {
        total += a.emission;
        if (a.type === 'energy') energy += a.amount;
        if (a.type === 'transport') transport += a.amount;
    });
    totalFootprintEl.textContent = `${total.toFixed(2)} kg`;
    energyUsageEl.textContent = `${energy.toFixed(2)} kWh`;
    transportDistanceEl.textContent = `${transport.toFixed(2)} km`;
}

// --- NAVIGATION & EVENTS ---
function setupEvents() {
    document.getElementById('add-activity-btn').onclick = () => activityModal.style.display = 'flex';
    document.getElementById('cancel-btn').onclick = () => activityModal.style.display = 'none';
    document.querySelector('.close-btn').onclick = () => activityModal.style.display = 'none';
    
    document.getElementById('add-goal-btn').onclick = () => document.getElementById('goal-modal').style.display = 'flex';
    document.getElementById('cancel-goal-btn').onclick = () => document.getElementById('goal-modal').style.display = 'none';
    document.getElementById('close-goal-btn').onclick = () => document.getElementById('goal-modal').style.display = 'none';

    activityType.onchange = updateDetailOptions;
    activityForm.onsubmit = (e) => { e.preventDefault(); addActivity(); };
    document.getElementById('goal-form').onsubmit = (e) => { e.preventDefault(); addGoal(); };

    document.querySelectorAll('nav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const clickedLink = e.currentTarget;
            const target = clickedLink.id.replace('-link', '');

            document.querySelectorAll('nav a').forEach(navLink => navLink.classList.remove('active'));
            clickedLink.classList.add('active');

            document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
            document.getElementById(target).style.display = 'block';
            if(target === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 200);
        };
    });
}

function updateDetailOptions() {
    const opts = detailsByType[activityType.value] || [];
    activityDetail.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
}

function setDefaultDates() {
    const now = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = now;
    document.getElementById('goal-deadline').value = now;
}

setup();
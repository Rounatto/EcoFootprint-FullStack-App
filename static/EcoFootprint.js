// --- CONFIGURATION ---
var emissionFactors = {
    car: 0.24, bus: 0.1, train: 0.06, bicycle: 0, motorcycle: 0.12,
    electricity: 0.52, natural_gas: 2.0, heating_oil: 2.68,
    beef: 31.0, lamb: 24.0, chicken: 6.0, pork: 7.0, fish: 5.0, cheese: 13.5,
    clothing: 15.0, electronics: 50.0, furniture: 30.0, plastic: 6.0
};

var units = { transport: 'km', energy: 'kWh', food: 'kg', shopping: 'units' };
var detailsByType = {
    transport: ['car', 'bus', 'train', 'bicycle', 'motorcycle'],
    energy: ['electricity', 'natural_gas', 'heating_oil'],
    food: ['beef', 'lamb', 'chicken', 'pork', 'fish', 'cheese'],
    shopping: ['clothing', 'electronics', 'furniture', 'plastic']
};

// --- VARIABLES GLOBALES ---
var activities = [];
var goals = JSON.parse(localStorage.getItem('ecoGoalsBasic')) || [];
var map;
var markers = [];

// --- ELEMENTS DOM ---
var activityModal = document.getElementById('activity-modal');
var activityForm = document.getElementById('activity-form');
var activityType = document.getElementById('activity-type');
var activityDetail = document.getElementById('activity-detail');
var addActivityBtn = document.getElementById('add-activity-btn');
var activitiesList = document.getElementById('activities-list');
var totalFootprintEl = document.getElementById('total-footprint');
var energyUsageEl = document.getElementById('energy-usage');
var transportDistanceEl = document.getElementById('transport-distance');

// --- INITIALISATION ---
function setup() {
    initMap(); // On lance la carte
    setDefaultDates();
    setupEvents();
    loadActivities(); // On charge les données de Supabase
}

// --- LOGIQUE DE LA CARTE ---
function initMap() {
    // Centre la carte sur la Tunisie par défaut
    map = L.map('map').setView([34.0, 9.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Quand on clique sur la carte
    map.on('click', function(e) {
        if (markers.length >= 2) {
            // On nettoie si on a déjà 2 points
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }

        var marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        markers.push(marker);

        if (markers.length === 2) {
            calculateMapDistance();
        }
    });
}

function calculateMapDistance() {
    var p1 = markers[0].getLatLng();
    var p2 = markers[1].getLatLng();
    
    // Calcul de distance (en mètres) via Leaflet
    var distanceInMeters = p1.distanceTo(p2);
    var distanceInKm = (distanceInMeters / 1000).toFixed(2);

    // On remplit automatiquement le champ "Amount" du formulaire
    var amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.value = distanceInKm;
        // On force le type sur "Transport" pour la cohérence
        activityType.value = "transport";
        updateDetailOptions();
        alert("Distance calculée : " + distanceInKm + " km. Le formulaire a été mis à jour !");
    }
}

// --- COMMUNICATIONS BACKEND (FLASK) ---
function loadActivities() {
    fetch('/api/activities')
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            activities = data.data;
            renderAll();
            console.log("Données chargées depuis Supabase");
        }
    })
    .catch(err => console.error("Erreur chargement:", err));
}

function addActivity() {
    var type = activityType.value;
    var detail = activityDetail.value;
    var amount = parseFloat(document.getElementById('amount').value);
    var date = document.getElementById('date').value;

    if (!type || !detail || isNaN(amount) || !date) return;

    var factor = emissionFactors[detail] || 0;
    var emission = amount * factor;

    var activityData = {
        type: type, detail: detail, amount: amount, date: date, emission: emission
    };

    fetch('/api/add-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            loadActivities(); // On rafraîchit tout
            closeActivityModal();
            // On nettoie la carte
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }
    })
    .catch(err => alert("Erreur lors de l'envoi au serveur."));
}

// --- RENDU ET AFFICHAGE ---
function renderAll() {
    renderActivities();
    renderSummary();
}

function renderActivities() {
    activitiesList.innerHTML = '';
    activities.forEach(activity => {
        var item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <span class="activity-date">${formatDate(activity.date)}</span>
            <span class="activity-detail">${activity.type} - ${activity.detail}</span>
            <span class="activity-amount">${activity.amount} ${units[activity.type] || ''}</span>
            <span class="activity-emission">${activity.emission.toFixed(2)} kg CO2</span>
        `;
        activitiesList.appendChild(item);
    });
}

function renderSummary() {
    var total = 0, energy = 0, transport = 0;
    activities.forEach(a => {
        total += a.emission;
        if (a.type === 'energy') energy += a.amount;
        if (a.type === 'transport') transport += a.amount;
    });
    totalFootprintEl.textContent = total.toFixed(2) + ' kg CO2';
    energyUsageEl.textContent = energy.toFixed(2) + ' kWh';
    transportDistanceEl.textContent = transport.toFixed(2) + ' km';
}

// --- UTILS & EVENTS ---
function setupEvents() {
    addActivityBtn.addEventListener('click', () => activityModal.style.display = 'flex');
    document.getElementById('cancel-btn').addEventListener('click', closeActivityModal);
    activityType.addEventListener('change', updateDetailOptions);
    activityForm.addEventListener('submit', (e) => { e.preventDefault(); addActivity(); });
    
    // Navigation simple
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('id').replace('-link', '');
            // Ici tu peux ajouter la logique pour cacher/montrer les sections
            console.log("Navigué vers :", section);
        });
    });
}

function updateDetailOptions() {
    var options = detailsByType[activityType.value] || [];
    activityDetail.innerHTML = '<option value="">Select detail</option>';
    options.forEach(opt => {
        var o = document.createElement('option');
        o.value = opt;
        o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        activityDetail.appendChild(o);
    });
}

function closeActivityModal() {
    activityModal.style.display = 'none';
    activityForm.reset();
}

function setDefaultDates() {
    document.getElementById('date').valueAsDate = new Date();
}

function formatDate(v) {
    return new Date(v).toLocaleDateString();
}

setup();
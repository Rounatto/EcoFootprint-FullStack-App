var emissionFactors = {
    car: 0.24,
    bus: 0.1,
    train: 0.06,
    bicycle: 0,
    motorcycle: 0.12,
    electricity: 0.52,
    natural_gas: 2.0,
    heating_oil: 2.68,
    beef: 31.0,
    lamb: 24.0,
    chicken: 6.0,
    pork: 7.0,
    fish: 5.0,
    cheese: 13.5,
    clothing: 15.0,
    electronics: 50.0,
    furniture: 30.0,
    plastic: 6.0
};

var units = {
    transport: 'km',
    energy: 'kWh',
    food: 'kg',
    shopping: 'units'
};

var detailsByType = {
    transport: ['car', 'bus', 'train', 'bicycle', 'motorcycle'],
    energy: ['electricity', 'natural_gas', 'heating_oil'],
    food: ['beef', 'lamb', 'chicken', 'pork', 'fish', 'cheese'],
    shopping: ['clothing', 'electronics', 'furniture', 'plastic']
};

var activities = JSON.parse(localStorage.getItem('ecoActivitiesBasic')) || [];
var goals = JSON.parse(localStorage.getItem('ecoGoalsBasic')) || [];

var activityModal = document.getElementById('activity-modal');
var activityForm = document.getElementById('activity-form');
var activityType = document.getElementById('activity-type');
var activityDetail = document.getElementById('activity-detail');
var addActivityBtn = document.getElementById('add-activity-btn');
var cancelBtn = document.getElementById('cancel-btn');
var closeBtn = document.querySelector('#activity-modal .close-btn');

var goalsSection = document.getElementById('goals-section');
var tipsSection = document.getElementById('tips-section');
var goalsContainer = document.getElementById('goals-container');
var tipsContainer = document.getElementById('tips-container');

var addGoalBtn = document.getElementById('add-goal-btn');
var goalModal = document.getElementById('goal-modal');
var goalForm = document.getElementById('goal-form');
var closeGoalBtn = document.getElementById('close-goal-btn');
var cancelGoalBtn = document.getElementById('cancel-goal-btn');

var activitiesList = document.getElementById('activities-list');
var totalFootprintEl = document.getElementById('total-footprint');
var energyUsageEl = document.getElementById('energy-usage');
var transportDistanceEl = document.getElementById('transport-distance');
var recommendationsList = document.getElementById('recommendations-list');

var dashboardSection = document.querySelector('.dashboard');
var recommendationsSection = document.querySelector('.recommendations');
var navLinks = document.querySelectorAll('nav a');
var dashboardLink = navLinks[0];
var insightsLink = document.getElementById('insights-link');
var goalsLink = document.getElementById('goals-link');
var tipsLink = document.getElementById('tips-link');

function setup() {
    setDefaultDates();
    setupEvents();
    renderAll();
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
}

function setDefaultDates() {
    var dateInput = document.getElementById('date');
    var goalDeadlineInput = document.getElementById('goal-deadline');

    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    if (goalDeadlineInput) {
        var nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        goalDeadlineInput.valueAsDate = nextMonth;
    }
}

function setupEvents() {
    addActivityBtn.addEventListener('click', openActivityModal);
    cancelBtn.addEventListener('click', closeActivityModal);
    closeBtn.addEventListener('click', closeActivityModal);

    activityType.addEventListener('change', updateDetailOptions);

    activityForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addActivity();
    });

    addGoalBtn.addEventListener('click', openGoalModal);
    closeGoalBtn.addEventListener('click', closeGoalModal);
    cancelGoalBtn.addEventListener('click', closeGoalModal);

    goalForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addGoal();
    });

    dashboardLink.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.hash = 'dashboard';
        showSection('dashboard');
    });

    insightsLink.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.hash = 'insights';
        showSection('insights');
    });

    goalsLink.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.hash = 'goals';
        showSection('goals');
    });

    tipsLink.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.hash = 'tips';
        showSection('tips');
    });
}

function handleHashNavigation() {
    var hash = (window.location.hash || '#dashboard').replace('#', '');
    var validSections = {
        dashboard: true,
        insights: true,
        goals: true,
        tips: true
    };

    if (!validSections[hash]) {
        hash = 'dashboard';
        window.location.hash = 'dashboard';
    }

    showSection(hash);
}

function openActivityModal() {
    activityModal.style.display = 'flex';
}

function closeActivityModal() {
    activityModal.style.display = 'none';
    activityForm.reset();
    resetDetailOptions();
    setDefaultDates();
}

function openGoalModal() {
    goalModal.style.display = 'flex';
}

function closeGoalModal() {
    goalModal.style.display = 'none';
    goalForm.reset();
    setDefaultDates();
}

function resetDetailOptions() {
    activityDetail.innerHTML = '<option value="">Select specific activity</option>';
}

function updateDetailOptions() {
    var type = activityType.value;
    var options = detailsByType[type] || [];

    resetDetailOptions();

    for (var i = 0; i < options.length; i++) {
        var optionValue = options[i];
        var option = document.createElement('option');
        option.value = optionValue;
        option.textContent = makeLabel(optionValue);
        activityDetail.appendChild(option);
    }
}

function makeLabel(text) {
    var clean = text.replace('_', ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function addActivity() {
    var type = activityType.value;
    var detail = activityDetail.value;
    var amount = parseFloat(document.getElementById('amount').value);
    var date = document.getElementById('date').value;

    if (!type || !detail || isNaN(amount) || !date) {
        return;
    }

    var factor = emissionFactors[detail] || 0;
    var emission = amount * factor;

    var activity = {
        id: Date.now(),
        type: type,
        detail: detail,
        amount: amount,
        date: date,
        emission: emission
    };

    activities.unshift(activity);
    localStorage.setItem('ecoActivitiesBasic', JSON.stringify(activities));

    renderAll();
    closeActivityModal();
}

function addGoal() {
    var goalType = document.getElementById('goal-type').value;
    var target = parseFloat(document.getElementById('goal-target').value);
    var deadline = document.getElementById('goal-deadline').value;
    var description = document.getElementById('goal-description').value;

    if (!goalType || isNaN(target) || !deadline || !description) {
        return;
    }

    var goal = {
        id: Date.now(),
        type: goalType,
        target: target,
        deadline: deadline,
        description: description
    };

    goals.push(goal);
    localStorage.setItem('ecoGoalsBasic', JSON.stringify(goals));

    renderGoals();
    closeGoalModal();
}

function showSection(sectionName) {
    var i;

    for (i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove('active');
    }

    dashboardSection.style.display = 'none';
    recommendationsSection.style.display = 'none';
    goalsSection.style.display = 'none';
    tipsSection.style.display = 'none';

    if (sectionName === 'dashboard') {
        dashboardSection.style.display = 'flex';
        recommendationsSection.style.display = 'block';
        dashboardLink.classList.add('active');
    }

    if (sectionName === 'insights') {
        dashboardSection.style.display = 'flex';
        recommendationsSection.style.display = 'block';
        insightsLink.classList.add('active');
    }

    if (sectionName === 'goals') {
        goalsSection.style.display = 'block';
        goalsLink.classList.add('active');
    }

    if (sectionName === 'tips') {
        tipsSection.style.display = 'block';
        tipsLink.classList.add('active');
    }
}

function renderAll() {
    renderActivities();
    renderSummary();
    renderRecommendations();
    renderGoals();
    renderTips();
}

function renderActivities() {
    activitiesList.innerHTML = '';

    if (activities.length === 0) {
        activitiesList.innerHTML = '<p>No activities yet. Click + to add one.</p>';
        return;
    }

    for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];
        var item = document.createElement('div');
        item.className = 'activity-item';

        var dateSpan = document.createElement('span');
        dateSpan.className = 'activity-date';
        dateSpan.textContent = formatDate(activity.date);

        var detailSpan = document.createElement('span');
        detailSpan.className = 'activity-detail';
        detailSpan.textContent = activity.type + ' - ' + activity.detail;

        var amountSpan = document.createElement('span');
        amountSpan.className = 'activity-amount';
        amountSpan.textContent = activity.amount.toFixed(2) + ' ' + (units[activity.type] || '');

        var emissionSpan = document.createElement('span');
        emissionSpan.className = 'activity-emission';
        emissionSpan.textContent = activity.emission.toFixed(2) + ' kg CO2';

        item.appendChild(dateSpan);
        item.appendChild(detailSpan);
        item.appendChild(amountSpan);
        item.appendChild(emissionSpan);

        activitiesList.appendChild(item);
    }
}

function renderSummary() {
    var totalEmission = 0;
    var totalEnergy = 0;
    var totalTransport = 0;

    for (var i = 0; i < activities.length; i++) {
        totalEmission += activities[i].emission;

        if (activities[i].type === 'energy') {
            totalEnergy += activities[i].amount;
        }

        if (activities[i].type === 'transport') {
            totalTransport += activities[i].amount;
        }
    }

    totalFootprintEl.textContent = totalEmission.toFixed(2) + ' kg CO2';
    energyUsageEl.textContent = totalEnergy.toFixed(2) + ' kWh';
    transportDistanceEl.textContent = totalTransport.toFixed(2) + ' km';
}

function renderRecommendations() {
    recommendationsList.innerHTML = '';

    var html = '';
    html += '<p>Simple ways to reduce your footprint:</p>';
    html += '<ul>';
    html += '<li>Use bus, train, bike, or walk when possible.</li>';
    html += '<li>Turn off lights and devices when not in use.</li>';
    html += '<li>Eat less high-emission food like beef.</li>';
    html += '</ul>';

    recommendationsList.innerHTML = html;
}

function renderGoals() {
    goalsContainer.innerHTML = '';

    if (goals.length === 0) {
        goalsContainer.innerHTML = '<p>No goals yet. Add your first goal.</p>';
        return;
    }

    for (var i = 0; i < goals.length; i++) {
        var goal = goals[i];
        var block = document.createElement('div');
        block.className = 'goal-item';

        block.innerHTML =
            '<h3>' + goal.description + '</h3>' +
            '<p>Type: ' + makeLabel(goal.type) + '</p>' +
            '<p>Target: ' + goal.target + ' kg CO2</p>' +
            '<p>Deadline: ' + goal.deadline + '</p>';

        goalsContainer.appendChild(block);
    }
}

function renderTips() {
    tipsContainer.innerHTML = '';

    var html = '';
    html += '<p>Basic eco-friendly tips:</p>';
    html += '<ul>';
    html += '<li>Carry a reusable bottle and bag.</li>';
    html += '<li>Buy only what you need.</li>';
    html += '<li>Unplug chargers when not using them.</li>';
    html += '</ul>';

    tipsContainer.innerHTML = html;
}

function formatDate(value) {
    var d = new Date(value);
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
        return 'Today';
    }

    if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return d.toLocaleDateString();
}

setup();

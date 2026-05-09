// --- CONFIGURATION ---
const ADMIN_PASSWORD = "adminheslo2026"; 

// --- DATA INITIALIZATION ---
let teams = JSON.parse(localStorage.getItem('leagueTeams')) || [
    { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", played: 0, gf: 0, ga: 0, pts: 0 },
    { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg", played: 0, gf: 0, ga: 0, pts: 0 }
];

let matches = JSON.parse(localStorage.getItem('leagueMatches')) || [];
let goalscorers = JSON.parse(localStorage.getItem('leagueScorers')) || {};

// --- AUTHENTICATION LOGIC ---
function toggleAdmin() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        document.getElementById('admin-container').style.display = 'flex';
    } else {
        const pass = prompt("Enter Admin Password:");
        if (pass === ADMIN_PASSWORD) {
            sessionStorage.setItem('isAdmin', 'true');
            document.getElementById('admin-container').style.display = 'flex';
            document.getElementById('admin-login-btn').innerText = "Admin Active";
        } else {
            alert("Unauthorized!");
        }
    }
}

function closeAdmin() {
    document.getElementById('admin-container').style.display = 'none';
}

// --- CORE FUNCTIONS ---
function saveData() {
    localStorage.setItem('leagueTeams', JSON.stringify(teams));
    localStorage.setItem('leagueMatches', JSON.stringify(matches));
    localStorage.setItem('leagueScorers', JSON.stringify(goalscorers));
}

function renderAll() {
    renderTable();
    renderMatches();
    renderScorers();
    renderNews();
}

function renderTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = "";
    // Sort logic: Points > Goal Difference > Goals For
    teams.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
    
    teams.forEach((t, i) => {
        tableBody.innerHTML += `<tr>
            <td>${i + 1}</td>
            <td><img src="${t.logo}" class="logo-sm"> ${t.name}</td>
            <td>${t.gf - t.ga}</td>
            <td><strong>${t.pts}</strong></td>
        </tr>`;
    });
}

function renderMatches() {
    const matchDiv = document.getElementById('match-history');
    matchDiv.innerHTML = "";
    // Only show latest 5
    const latest = [...matches].reverse().slice(0, 5);
    latest.forEach(m => {
        matchDiv.innerHTML += `
            <div class="match-card">
                <div class="scoreline">${m.home} ${m.hScore} - ${m.aScore} ${m.away}</div>
                <div class="potm-tag">⭐ POTM: ${m.potm}</div>
            </div>`;
    });
}

function renderNews() {
    const newsDiv = document.getElementById('news-feed');
    newsDiv.innerHTML = "";
    [...matches].reverse().slice(0, 5).forEach(m => {
        newsDiv.innerHTML += `
            <div class="news-card">
                <h4>Full Time: ${m.home} vs ${m.away}</h4>
                <p>${m.news || "A hard fought match between two giants."}</p>
            </div>`;
    });
}

function renderScorers() {
    const scorerBody = document.getElementById('scorer-body');
    scorerBody.innerHTML = "";
    Object.entries(goalscorers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .forEach(([name, goals]) => {
            scorerBody.innerHTML += `<tr><td>${name}</td><td>${goals}</td></tr>`;
        });
}

function addMatch() {
    const hName = document.getElementById('home-team').value;
    const aName = document.getElementById('away-team').value;
    const hScore = parseInt(document.getElementById('home-score').value || 0);
    const aScore = parseInt(document.getElementById('away-score').value || 0);
    const potm = document.getElementById('potm-name').value || "None";
    const news = document.getElementById('match-news').value;

    const home = teams.find(t => t.name === hName);
    const away = teams.find(t => t.name === aName);

    if (home && away) {
        home.played++; away.played++;
        home.gf += hScore; home.ga += aScore;
        away.gf += aScore; away.ga += hScore;

        if (hScore > aScore) home.pts += 3;
        else if (hScore < aScore) away.pts += 3;
        else { home.pts += 1; away.pts += 1; }

        matches.push({ home: hName, away: aName, hScore, aScore, potm, news });

        [document.getElementById('home-scorers').value, document.getElementById('away-scorers').value].forEach(list => {
            if (list) list.split(',').forEach(p => {
                const n = p.trim();
                if (n) goalscorers[n] = (goalscorers[n] || 0) + 1;
            });
        });

        saveData();
        renderAll();
        closeAdmin();
    } else {
        alert("Check team names!");
    }
}

function clearData() {
    if(confirm("DANGER: This resets all scores, scorers, and news. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}

// Check session on load
if (sessionStorage.getItem('isAdmin') === 'true') {
    document.getElementById('admin-login-btn').innerText = "Admin Active";
}

renderAll();
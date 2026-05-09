// 1. SUPABASE CONFIGURATION (Get these from Supabase -> Project Settings -> API)
const supabaseUrl = 'https://nxinmoirjudpkkolelxm.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aW5tb2lyanVkcGtrb2xlbHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTE5MTAsImV4cCI6MjA5Mzg4NzkxMH0.n-aD3b1fPi_YG59yYckFC3i56jSC2odtJCoN_TjKzFw';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. ADMIN PASSWORD
const ADMIN_PASSWORD = "leagueadmin2026"; 

// 3. INITIAL DATA (Used if the database is empty)
let teams = [
    { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", played: 0, gf: 0, ga: 0, pts: 0 },
    { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg", played: 0, gf: 0, ga: 0, pts: 0 }
];
let matches = [];
let goalscorers = {};

// --- CLOUD SYNC FUNCTIONS ---

// Load data from Supabase on startup
async function loadData() {
    try {
        let { data, error } = await supabaseClient
            .from('league_data')
            .select('content')
            .eq('id', 1)
            .single();

        if (data) {
            const saved = data.content;
            teams = saved.teams;
            matches = saved.matches;
            goalscorers = saved.goalscorers;
            console.log("Data synced from cloud.");
        } else {
            console.log("No cloud data found, using defaults.");
        }
        renderAll();
    } catch (err) {
        console.error("Sync error:", err);
    }
}

// Save data to Supabase
async function saveData() {
    const payload = { teams, matches, goalscorers };
    const { error } = await supabaseClient
        .from('league_data')
        .upsert({ id: 1, content: payload });

    if (error) {
        console.error("Error saving to cloud:", error.message);
        alert("Cloud save failed! Check your Supabase table settings.");
    }
}

// --- AUTHENTICATION ---

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

// --- RENDERING FUNCTIONS ---

function renderAll() {
    renderTable();
    renderMatches();
    renderScorers();
    renderNews();
}

function renderTable() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = "";
    teams.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    
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
    [...matches].reverse().slice(0, 5).forEach(m => {
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
                <p>${m.news || "Match ended at full time."}</p>
            </div>`;
    });
}

function renderScorers() {
    const scorerBody = document.getElementById('scorer-body');
    scorerBody.innerHTML = "";
    Object.entries(goalscorers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([name, goals]) => {
            scorerBody.innerHTML += `<tr><td>${name}</td><td>${goals}</td></tr>`;
        });
}

// --- ADD MATCH (ASYNC) ---

async function addMatch() {
    const hName = document.getElementById('home-team').value;
    const aName = document.getElementById('away-team').value;
    const hScore = parseInt(document.getElementById('home-score').value || 0);
    const aScore = parseInt(document.getElementById('away-score').value || 0);
    const potm = document.getElementById('potm-name').value || "None";
    const news = document.getElementById('match-news').value;

    const home = teams.find(t => t.name === hName);
    const away = teams.find(t => t.name === aName);

    if (home && away) {
        // Logic calculations
        home.played++; away.played++;
        home.gf += hScore; home.ga += aScore;
        away.gf += aScore; away.ga += hScore;

        if (hScore > aScore) home.pts += 3;
        else if (hScore < aScore) away.pts += 3;
        else { home.pts += 1; away.pts += 1; }

        matches.push({ home: hName, away: aName, hScore, aScore, potm, news });

        // Goalscorers
        [document.getElementById('home-scorers').value, document.getElementById('away-scorers').value].forEach(list => {
            if (list) list.split(',').forEach(p => {
                const n = p.trim();
                if (n) goalscorers[n] = (goalscorers[n] || 0) + 1;
            });
        });

        // SAVE TO CLOUD
        await saveData();
        
        // Refresh UI
        renderAll();
        closeAdmin();
        alert("Match Published to Cloud!");
    } else {
        alert("Team names must match exactly (Real Madrid / Bayern Munich)");
    }
}

async function clearData() {
    if(confirm("RESET ALL DATA? This cannot be undone.")) {
        teams.forEach(t => { t.played = 0; t.gf = 0; t.ga = 0; t.pts = 0; });
        matches = [];
        goalscorers = {};
        await saveData();
        location.reload();
    }
}

// --- RUN ON START ---
loadData();

// Session styling
if (sessionStorage.getItem('isAdmin') === 'true') {
    document.getElementById('admin-login-btn').innerText = "Admin Active";
}

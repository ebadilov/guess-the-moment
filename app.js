/**
 * Логика приложения StreamSniper - Прогнозирование ДО события
 */

const SPORT_CONFIGS = {
    cs: {
        team1: 'NAVI', team2: 'FAZE', score: '12 - 14',
        states: ["ПОДГОТОВКА...", "ФРИЗТАЙМ...", "РАСКИДКА ГРАНАТ...", "ЗАТИШЬЕ НА ТОЧКЕ...", "ПОЗИЦИОННАЯ ИГРА..."],
        actions: ["HEADSHOT!", "TRIPLE KILL!", "БОМБА УСТАНОВЛЕНА!", "NINJA DEFUSE!"],
        class: 'sport-cs',
        bgHTML: `` 
    },
    football: {
        team1: 'R. MADRID', team2: 'BARCELONA', score: '1 - 1',
        states: ["УДЕРЖАНИЕ МЯЧА...", "СМЕЩЕНИЕ ВО ФЛАНГ...", "РАЗБЕГ ПРЕД ШТРАФНЫМ...", "ИДЕТ ПАС..."],
        actions: ["ГОООЛ!!!", "ВЕЛИКОЛЕПНЫЙ СЭЙВ!", "УДАР В ШТАНГУ!", "ПЕНАЛЬТИ НАЗНАЧЕН!"],
        class: 'sport-football',
        bgHTML: `<div class="football-ball"></div>`
    },
    dota: {
        team1: 'TEAM SPIRIT', team2: 'OG', score: '23 - 18',
        states: ["БЕЗМОЛВИЕ...", "ПУШ ТАВЕРА...", "СБОР В СМОКЕ...", "ФАРМ ЛЕСА..."],
        actions: ["RAMPAGE!!!", "АЕГИС УКРАДЕН!", "БЛЕКХОЛ В ПЯТЕРЫХ!", "БАЙБЕК!"],
        class: 'sport-dota',
        bgHTML: `<div class="dota-runes"></div>`
    }
};

const STATE = {
    user: {
        id: 'user_1',
        name: 'ТЫ (Гость)',
        score: 0,
        rank: 42
    },
    leaderboard: [
        { id: 'u1', name: 'S1mple_Fan', score: 14500 },
        { id: 'u2', name: 'CyberNinja', score: 12300 },
        { id: 'u3', name: 'PredictorPro', score: 9800 },
        { id: 'u4', name: 'NoScope360', score: 8550 },
        { id: 'u5', name: 'Alex_G', score: 7200 },
    ],
    currentSport: 'cs',
    lastPredictionTime: null, // Time when user clicked the predict button
    streamTimeout: null,
    eventTimeout: null,
    maxDeviationMs: 8000 // if event happens more than 8 seconds after prediction, it's a miss
};

// DOM Elements
const elUserRanks = document.getElementById('user-rank');
const elUserScore = document.getElementById('user-score');
const elLeaderboard = document.getElementById('leaderboard');
const elStreamStatus = document.getElementById('stream-status');
const vStream = document.getElementById('v-stream');
const btnGuess = document.getElementById('btn-guess-action');
const elFeedback = document.getElementById('feedback-area');
const catSelectors = document.querySelectorAll('.cat-btn');

// HUD
const elTeam1 = document.getElementById('team-1');
const elTeam2 = document.getElementById('team-2');
const elScore = document.getElementById('stream-score');
const elBgFx = document.getElementById('stream-bg-fx');

function init() {
    STATE.leaderboard.push(STATE.user);
    
    // Setup category buttons
    catSelectors.forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelector('.cat-btn.active').classList.remove('active');
            e.target.classList.add('active');
            changeSport(e.target.dataset.sport);
        });
    });

    changeSport('cs'); // Initial sport
    updateLeaderboardDOM();
    simulateViewers();
    
    btnGuess.addEventListener('click', handlePrediction);
}

function changeSport(sportKey) {
    STATE.currentSport = sportKey;
    const config = SPORT_CONFIGS[sportKey];
    
    // Update visuals
    vStream.className = `virtual-stream ${config.class}`;
    elBgFx.innerHTML = config.bgHTML;
    elTeam1.textContent = config.team1;
    elTeam2.textContent = config.team2;
    elScore.textContent = config.score;
    
    // Reset prediction and event state
    STATE.lastPredictionTime = null;
    elStreamStatus.classList.remove('event-active');
    clearTimeout(STATE.streamTimeout);
    clearTimeout(STATE.eventTimeout);
    
    triggerNextStreamPhase();
}

function triggerNextStreamPhase() {
    // 30% chance for an action event to happen instead of neutral state
    const isActionTime = Math.random() > 0.70;
    const config = SPORT_CONFIGS[STATE.currentSport];
    
    if (isActionTime) {
        triggerActionEvent(config);
    } else {
        const randomState = config.states[Math.floor(Math.random() * config.states.length)];
        elStreamStatus.textContent = randomState;
        elStreamStatus.classList.remove('event-active');
        
        STATE.streamTimeout = setTimeout(triggerNextStreamPhase, Math.floor(Math.random() * 2000) + 1500);
    }
}

function triggerActionEvent(config) {
    const randomAction = config.actions[Math.floor(Math.random() * config.actions.length)];
    elStreamStatus.textContent = randomAction;
    elStreamStatus.classList.add('event-active');
    
    // Flash effect based on sport
    const flashColor = STATE.currentSport === 'cs' ? 'rgba(0,240,255,0.5)' : (STATE.currentSport === 'football' ? 'rgba(255,255,255,0.5)' : 'rgba(255,0,85,0.5)');
    vStream.style.boxShadow = `inset 0 0 100px ${flashColor}`;
    setTimeout(() => vStream.style.boxShadow = 'none', 300);
    
    // --- CALCULATE PREDICTION DEVIATION ---
    if (STATE.lastPredictionTime) {
        const eventTime = Date.now();
        const deviationMs = eventTime - STATE.lastPredictionTime;
        
        btnGuess.disabled = false;
        btnGuess.style.opacity = '1';

        // Check if prediction was made before the event and within the allowed time window
        if (deviationMs > 0 && deviationMs <= STATE.maxDeviationMs) {
            const deviationSeconds = (deviationMs / 1000).toFixed(2);
            
            // Score calculation: closer is better
            // At 0ms deviation -> max points (e.g. 1500)
            // At 8000ms deviation -> min points (e.g. 50)
            let points = 1500 - Math.floor((deviationMs / STATE.maxDeviationMs) * 1450);
            points = Math.max(10, points);
            
            STATE.user.score += points;
            showFeedback(`Успех! Событие наступило. <span class="deviation">Отклонение: ${deviationSeconds} сек</span><br><span style="color:#10b981">+${points} ОЧКОВ</span>`, 'feedback-points');
            updateLeaderboardDOM();
        } else {
            // Player predicted too early
            showFeedback("Промах! Событие произошло слишком поздно после прогноза.", 'feedback-miss');
        }
        
        STATE.lastPredictionTime = null; // reset prediction
    }
    
    // Show event on screen for 2 seconds, then go back to neutral
    STATE.eventTimeout = setTimeout(() => {
        elStreamStatus.classList.remove('event-active');
        STATE.streamTimeout = setTimeout(triggerNextStreamPhase, 1000);
    }, 2000);
}

function handlePrediction() {
    btnGuess.style.transform = 'scale(0.95)';
    setTimeout(() => btnGuess.style.transform = 'scale(1)', 150);
    
    if (elStreamStatus.classList.contains('event-active')) {
        showFeedback("Событие уже идет! Прогнозируйте до его начала.", 'feedback-miss');
        return;
    }
    
    STATE.lastPredictionTime = Date.now();
    btnGuess.disabled = true; // disable to prevent multiple spam
    btnGuess.style.opacity = '0.5';
    
    elFeedback.innerHTML = `<span style="color: var(--accent); font-weight: 600; text-shadow: 0 0 10px var(--accent);">Прогноз зафиксирован! Ждем событие...</span>`;
    
    // If no event happens within maxDeviationMs, cancel the prediction
    setTimeout(() => {
        if (STATE.lastPredictionTime) {
            const timeSincePrediction = Date.now() - STATE.lastPredictionTime;
            if (timeSincePrediction >= STATE.maxDeviationMs) {
                STATE.lastPredictionTime = null;
                btnGuess.disabled = false;
                btnGuess.style.opacity = '1';
                showFeedback("Время прогноза вышло. События не произошло.", 'feedback-miss');
            }
        }
    }, STATE.maxDeviationMs + 100);
}

function showFeedback(htmlStr, className) {
    elFeedback.innerHTML = `<span class="${className}">${htmlStr}</span>`;
    setTimeout(() => {
        if(!STATE.lastPredictionTime) {
            elFeedback.innerHTML = 'Ожидание вашего прогноза...';
        }
    }, 3000);
}

// ... Rest of the helpers (DOM updates and Viewers sim) ...
function updateLeaderboardDOM() {
    STATE.leaderboard.sort((a, b) => b.score - a.score);
    const userIndex = STATE.leaderboard.findIndex(p => p.id === STATE.user.id);
    STATE.user.rank = userIndex + 1;
    
    elLeaderboard.innerHTML = '';
    STATE.leaderboard.forEach((player, index) => {
        const isCurrent = player.id === STATE.user.id;
        const li = document.createElement('li');
        li.className = `leaderboard-item ${isCurrent ? 'current-user' : ''}`;
        li.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <div class="player-info">
                <span class="player-name">${player.name}</span>
            </div>
            <span class="player-score timer-font">${player.score}</span>
        `;
        elLeaderboard.appendChild(li);
    });
    
    elUserRanks.textContent = `#${STATE.user.rank}`;
    const crScore = parseInt(elUserScore.textContent) || 0;
    if (crScore !== STATE.user.score) animValue(elUserScore, crScore, STATE.user.score, 500);
}

function animValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function simulateViewers() {
    const elViewersCount = document.getElementById('viewers-count');
    setInterval(() => {
        let current = parseInt(elViewersCount.textContent.replace(',', ''));
        current += Math.floor(Math.random() * 150) - 50;
        elViewersCount.textContent = current.toLocaleString();
        
        if (Math.random() > 0.5) {
            const bot = STATE.leaderboard[Math.floor(Math.random() * (STATE.leaderboard.length - 1))];
            if(bot && bot.id !== STATE.user.id) {
                bot.score += Math.floor(Math.random() * 450) + 50;
                updateLeaderboardDOM();
            }
        }
    }, 3000);
}

window.addEventListener('DOMContentLoaded', init);

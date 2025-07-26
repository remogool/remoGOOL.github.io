import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {
  getDatabase, ref, onValue, query, orderByChild
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import {
  getAuth, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAn8b-8bUDCNVWmdim5MCeKpcz3kA5XhUU",
  authDomain: "remoweb-c9403.firebaseapp.com",
  databaseURL: "https://remoweb-c9403-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "remoweb-c9403",
  storageBucket: "remoweb-c9403.appspot.com",
  messagingSenderId: "242777391585",
  appId: "1:242777391585:web:05fa6161ed1f0bb10c52a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const listEl = document.getElementById('list');
const statusFilter = document.getElementById('statusFilter');
const searchFilter = document.getElementById('searchFilter');
const streamsModal = document.getElementById('streamsModal');
const modalMatchInfo = document.getElementById('modalMatchInfo');
const streamsList = document.getElementById('streamsList');
const closeModal = document.querySelector('.close-modal');
const prevDayBtn = document.getElementById('nextDayBtn');
const nextDayBtn = document.getElementById('prevDayBtn');
const currentDateDisplay = document.getElementById('currentDateDisplay');

let allMatches = [];
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

// Initialize date display
function updateDateDisplay() {
  currentDateDisplay.textContent = toBaghdadDateString(currentDate);
}

// Filter matches by selected date
function filterMatchesByDate(matches) {
  return matches.filter(match => {
    if (!match.startTime) return false;
    const matchDate = new Date(match.startTime);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate.getTime() === currentDate.getTime();
  });
}

// Date navigation functions
function goToPrevDay() {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateDisplay();
  render();
}

function goToNextDay() {
  currentDate.setDate(currentDate.getDate() + 1);
  updateDateDisplay();
  render();
}

prevDayBtn.addEventListener('click', goToPrevDay);
nextDayBtn.addEventListener('click', goToNextDay);

// Modal functions
function openModal(match) {
  modalMatchInfo.innerHTML = `
    <div><strong>${match.league || 'دوري غير محدد'} ${match.round ? `<span class="round">(${match.round})</span>` : ''}</strong></div>
    <div>${match.homeTeam} vs ${match.awayTeam}</div>
    <div style="color: var(--dark-gray); font-size: 0.9rem;">
      ${match.startTime ? toBaghdadDateString(new Date(match.startTime)) : ''}
    </div>
  `;
  
  streamsList.innerHTML = '';
  if (Array.isArray(match.streams) && match.streams.length > 0) {
    match.streams.forEach(stream => {
      const streamItem = document.createElement('div');
      streamItem.className = 'stream-item';
      streamItem.innerHTML = `
        <div class="stream-name">${stream.name}</div>
      `;
      streamsList.appendChild(streamItem);
    });
  } else {
    streamsList.innerHTML = '<div style="text-align: center; color: var(--dark-gray);">لا توجد قنوات ناقلة متاحة</div>';
  }
  
  streamsModal.style.display = 'flex';
}

function closeModalFunc() {
  streamsModal.style.display = 'none';
}

closeModal.addEventListener('click', closeModalFunc);
streamsModal.addEventListener('click', (e) => {
  if (e.target === streamsModal) {
    closeModalFunc();
  }
});

function determineMatchStatus(match) {
  if (!match.startTime) return 'upcoming';
  
  const now = Date.now();
  const startTime = match.startTime;
  const endTime = startTime + (90 * 60 * 1000); // Assuming 90 minutes match duration
  
  if (now >= startTime && now <= endTime) {
    return 'live';
  } else if (now > endTime) {
    return 'finished';
  } else {
    return 'upcoming';
  }
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function render() {
  const statusV = statusFilter.value.trim();
  const searchV = searchFilter.value.trim().toLowerCase();

  // First filter by date
  let filtered = filterMatchesByDate(allMatches);

  // Then apply other filters
  filtered = filtered.filter(m => {
    let ok = true;
    if (statusV) ok = ok && determineMatchStatus(m) === statusV;
    if (searchV) {
      ok = ok && (
        (m.league || '').toLowerCase().includes(searchV) || 
        (m.homeTeam || '').toLowerCase().includes(searchV) || 
        (m.awayTeam || '').toLowerCase().includes(searchV)
      );
    }
    return ok;
  });

  listEl.innerHTML = '';
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="no-matches">لا توجد مباريات لعرضها</div>';
    return;
  }

  // Sort matches: live first, then upcoming, then finished
  filtered.sort((a, b) => {
    const aStatus = determineMatchStatus(a);
    const bStatus = determineMatchStatus(b);
    
    // Priority order: live > upcoming > finished
    const priority = {
      'live': 1,
      'upcoming': 2,
      'finished': 3
    };
    
    // If same status, sort by time
    if (aStatus === bStatus) {
      return (a.startTime || 0) - (b.startTime || 0);
    }
    
    return priority[aStatus] - priority[bStatus];
  });

  // Group matches by league
  const leagues = {};
  filtered.forEach(match => {
    const league = match.league || 'دوري غير محدد';
    if (!leagues[league]) {
      leagues[league] = [];
    }
    leagues[league].push(match);
  });

  // Render grouped matches
  for (const league in leagues) {
    const leagueGroup = document.createElement('div');
    leagueGroup.className = 'league-group';
    
    const leagueHeader = document.createElement('div');
    leagueHeader.className = 'league-header';
    leagueHeader.textContent = league;
    
    const leagueMatches = document.createElement('div');
    leagueMatches.className = 'league-matches';
    
    leagues[league].forEach(d => {
      const matchDate = d.startTime ? new Date(d.startTime) : null;
      const dateStr = matchDate ? toBaghdadDateString(matchDate) : '';
      const timeStr = matchDate ? toBaghdadTimeString(matchDate) : '';
      const status = determineMatchStatus(d);
      const statusClass = `status ${status}`;
      const statusText = getStatusText(status);
      const isMatchToday = matchDate ? isToday(matchDate) : false;
      const hasStreams = Array.isArray(d.streams) && d.streams.length > 0;

      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <div class="row">
          <div class="teams">${d.homeTeam} <span style="color:var(--green)">vs</span> ${d.awayTeam}</div>
          <div class="${statusClass}">${statusText} ${timeStr}</div>
        </div>
        <div class="row">
      `;
      
      if (hasStreams) {
        el.addEventListener('click', () => openModal(d));
      }
      
      leagueMatches.appendChild(el);
    });
    
    leagueGroup.appendChild(leagueHeader);
    leagueGroup.appendChild(leagueMatches);
    listEl.appendChild(leagueGroup);
  }
}

function getStatusText(status) {
  switch (status) {
    case 'upcoming': return 'قادمة';
    case 'live': return 'مباشر الآن';
    case 'finished': return 'انتهت';
    default: return '';
  }
}

function toBaghdadDateString(date) {
  return new Intl.DateTimeFormat('ar', {
    timeZone: 'Asia/Baghdad',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function toBaghdadTimeString(date) {
  return new Intl.DateTimeFormat('ar', {
    timeZone: 'Asia/Baghdad',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

statusFilter.addEventListener('change', render);
searchFilter.addEventListener('input', render);

// تسجيل الدخول أولاً
const authEmail = 'users@rmatch1242e.com';
const authPassword = 'Hwif7wjr92os@9#9kwc#8q';

signInWithEmailAndPassword(auth, authEmail, authPassword)
  .then((userCredential) => {
    // تم تسجيل الدخول بنجاح، الآن يمكن الاتصال بقاعدة البيانات
    const matchesRef = query(ref(db, 'matches'), orderByChild('startTime'));
    onValue(matchesRef, (snap) => {
      const val = snap.val() || {};
      allMatches = Object.keys(val).map(id => ({ id, ...val[id] }));
      updateDateDisplay();
      render();
    });
  })
  .catch((error) => {
    console.error('فشل تسجيل الدخول:', error);
    listEl.innerHTML = '<div class="no-matches">خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً</div>';
  });
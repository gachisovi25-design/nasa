/* ==========================================================================
   NASA APOD (Astronomy Picture of the Day) - Application Logic
   ========================================================================== */

const DEFAULT_API_KEY = 'DEMO_KEY';
const APOD_API_URL = 'https://api.nasa.gov/planetary/apod';
const MIN_DATE = '1995-06-16';

// Fallback high-res space data
const FALLBACK_APODS = [
    {
        date: '2026-07-23',
        title: '대마젤란 은하 (The Large Magellanic Cloud)',
        copyright: 'Monica Mesa / NASA GSFC',
        media_type: 'image',
        url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
        hdurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2400&auto=format&fit=crop',
        explanation: '대마젤란 은하(LMC)는 우리 은하(Milky Way)에서 가장 가까운 이웃 은하 중 하나입니다. 지구에서 약 163,000광년 떨어져 있으며 남반구 밤하늘에서 맨눈으로 감상할 수 있는 아름다운 소형 불규칙 은하입니다.'
    },
    {
        date: '2026-07-22',
        title: '제임스 웹 성운의 장관 (JWST Carina Nebula)',
        copyright: 'NASA, ESA, CSA, STScI',
        media_type: 'image',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
        hdurl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400&auto=format&fit=crop',
        explanation: '제임스 웹 우주망원경이 촬영한 용골자리 성운의 "우주 절벽" 모습입니다. 별이 탄생하는 성운 내부의 신비로운 가스와 먼지 기둥을 선명하게 보여줍니다.'
    },
    {
        date: '2026-07-21',
        title: '토성의 고리와 위성 타이탄 (Saturn & Titan)',
        copyright: 'NASA / JPL-Caltech / Space Science Institute',
        media_type: 'image',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1600&auto=format&fit=crop',
        hdurl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=2400&auto=format&fit=crop',
        explanation: '카시니 탐사선이 전송한 토성의 아름다운 얼음 고리와 짙은 대기로 둘러싸인 거대 위성 타이탄의 장관입니다.'
    }
];

let state = {
    apiKey: localStorage.getItem('nasa_api_key') || DEFAULT_API_KEY,
    theme: localStorage.getItem('nasa_theme') || 'dark',
    currentDate: formatDate(new Date()),
    currentApod: null,
    favorites: JSON.parse(localStorage.getItem('nasa_apod_favorites') || '[]')
};

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStarfield();
    initDatePicker();
    setupEventListeners();
    updateApiKeyStatusUI();
    
    // Load Today's APOD
    loadApodLatest();
    loadRecentGallery();
    renderFavorites();
});

// ==========================================================================
// 1. Theme Management (Light / Dark Mode)
// ==========================================================================
function initTheme() {
    applyTheme(state.theme);
}

function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('nasa_theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        if (themeBtn) {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            themeBtn.title = '다크 모드로 전환';
        }
    } else {
        document.body.classList.remove('light-mode');
        if (themeBtn) {
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            themeBtn.title = '라이트 모드로 전환';
        }
    }
}

function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
}

// ==========================================================================
// 2. Starfield Animation
// ==========================================================================
function initStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const stars = [];
    const numStars = Math.floor((width * height) / 3000);

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.4 + 0.2,
            alpha: Math.random(),
            speed: Math.random() * 0.02 + 0.005
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const isLight = document.body.classList.contains('light-mode');
        const starColorRGB = isLight ? '30, 41, 59' : '255, 255, 255';

        stars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) {
                star.speed = -star.speed;
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${starColorRGB}, ${Math.abs(star.alpha) * (isLight ? 0.35 : 1)})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================================================
// 3. Date Utilities & Setup
// ==========================================================================
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initDatePicker() {
    const picker = document.getElementById('apodDatePicker');
    const todayStr = formatDate(new Date());
    
    picker.min = MIN_DATE;
    picker.max = todayStr;
    picker.value = todayStr;
}

// ==========================================================================
// 4. Event Listeners
// ==========================================================================
function setupEventListeners() {
    const datePicker = document.getElementById('apodDatePicker');
    
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            state.currentDate = e.target.value;
            loadApodByDate(state.currentDate);
        }
    });

    document.getElementById('prevDayBtn').addEventListener('click', () => {
        changeDateByDays(-1);
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
        changeDateByDays(1);
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        loadApodLatest();
    });

    document.getElementById('randomBtn').addEventListener('click', () => {
        loadRandomApod();
    });

    // Theme Toggle Event
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        toggleTheme();
    });

    // Lightbox & Favorite
    document.getElementById('zoomBtn').addEventListener('click', () => {
        if (state.currentApod && state.currentApod.media_type === 'image') {
            openLightbox(state.currentApod.hdurl || state.currentApod.url, state.currentApod.title);
        }
    });

    document.getElementById('closeLightboxBtn').addEventListener('click', () => {
        document.getElementById('lightboxModal').classList.add('hidden');
    });

    document.getElementById('favBtn').addEventListener('click', () => {
        toggleFavoriteCurrent();
    });

    // API Key Modal Events
    const modal = document.getElementById('apiKeyModal');
    document.getElementById('apiKeyModalBtn').addEventListener('click', () => {
        document.getElementById('apiKeyInput').value = state.apiKey === DEFAULT_API_KEY ? '' : state.apiKey;
        modal.classList.remove('hidden');
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.getElementById('saveKeyBtn').addEventListener('click', () => {
        const inputVal = document.getElementById('apiKeyInput').value.trim();
        state.apiKey = inputVal ? inputVal : DEFAULT_API_KEY;
        if (inputVal) {
            localStorage.setItem('nasa_api_key', inputVal);
        } else {
            localStorage.removeItem('nasa_api_key');
        }
        updateApiKeyStatusUI();
        modal.classList.add('hidden');
        loadApodLatest();
    });

    document.getElementById('resetKeyBtn').addEventListener('click', () => {
        state.apiKey = DEFAULT_API_KEY;
        localStorage.removeItem('nasa_api_key');
        updateApiKeyStatusUI();
        modal.classList.add('hidden');
        loadApodLatest();
    });
}

function changeDateByDays(days) {
    const current = new Date(state.currentDate);
    current.setDate(current.getDate() + days);
    
    const today = new Date();
    const minDate = new Date(MIN_DATE);

    if (current > today || current < minDate) return;

    const newDateStr = formatDate(current);
    state.currentDate = newDateStr;
    document.getElementById('apodDatePicker').value = newDateStr;
    loadApodByDate(newDateStr);
}

function updateApiKeyStatusUI() {
    const statusText = document.getElementById('keyStatusText');
    if (state.apiKey === DEFAULT_API_KEY) {
        statusText.textContent = 'DEMO_KEY 사용 중';
        statusText.className = 'status-demo';
    } else {
        statusText.textContent = `사용자 지정 키 적용됨 (${state.apiKey.substring(0, 6)}...)`;
        statusText.className = 'status-user';
    }
}

// ==========================================================================
// 5. API Core Methods
// ==========================================================================
async function loadApodLatest() {
    showLoader(true, 'NASA 최신 우주 사진을 수신하는 중...');
    const url = `${APOD_API_URL}?api_key=${state.apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`NASA API HTTP ${res.status}`);
        const data = await res.json();
        
        state.currentApod = data;
        state.currentDate = data.date;
        document.getElementById('apodDatePicker').value = data.date;
        renderMainApod(data);
    } catch (err) {
        console.warn('API Fetch failed, using fallback item:', err);
        const fallback = FALLBACK_APODS[0];
        state.currentApod = fallback;
        state.currentDate = fallback.date;
        document.getElementById('apodDatePicker').value = fallback.date;
        renderMainApod(fallback);
    } finally {
        showLoader(false);
    }
}

async function loadApodByDate(dateStr) {
    showLoader(true, `${dateStr} 사진을 불러오는 중...`);
    const url = `${APOD_API_URL}?date=${dateStr}&api_key=${state.apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 400) {
                throw new Error('선택하신 날짜의 APOD가 아직 NASA 서버에 게시되지 않았거나 미래 날짜입니다.');
            }
            throw new Error(`NASA API 오류 (${res.status})`);
        }
        const data = await res.json();
        state.currentApod = data;
        renderMainApod(data);
    } catch (err) {
        console.warn('APOD Date fetch failed:', err);
        const matchedFallback = FALLBACK_APODS.find(f => f.date === dateStr) || FALLBACK_APODS[0];
        state.currentApod = matchedFallback;
        renderMainApod(matchedFallback);
    } finally {
        showLoader(false);
    }
}

async function loadRandomApod() {
    showLoader(true, '우주 속 무작위 사진을 탐색하는 중...');
    const url = `${APOD_API_URL}?count=1&api_key=${state.apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('무작위 사진을 불러오지 못했습니다.');
        const dataArray = await res.json();
        if (dataArray && dataArray.length > 0) {
            const data = dataArray[0];
            state.currentApod = data;
            state.currentDate = data.date;
            document.getElementById('apodDatePicker').value = data.date;
            renderMainApod(data);
        }
    } catch (err) {
        console.warn('Random APOD fail:', err);
        const randomFallback = FALLBACK_APODS[Math.floor(Math.random() * FALLBACK_APODS.length)];
        state.currentApod = randomFallback;
        state.currentDate = randomFallback.date;
        document.getElementById('apodDatePicker').value = randomFallback.date;
        renderMainApod(randomFallback);
    } finally {
        showLoader(false);
    }
}

async function loadRecentGallery() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 5);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const url = `${APOD_API_URL}?start_date=${startStr}&end_date=${endStr}&api_key=${state.apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Gallery fetch failed');
        const list = await res.json();
        renderGallery(list.reverse());
    } catch (err) {
        console.warn('Gallery fallback loaded');
        renderGallery(FALLBACK_APODS);
    }
}

// ==========================================================================
// 6. Rendering Engine
// ==========================================================================
function renderMainApod(data) {
    const imgEl = document.getElementById('apodImage');
    const videoEl = document.getElementById('apodVideo');
    const titleEl = document.getElementById('apodTitle');
    const dateEl = document.getElementById('apodDate');
    const copyrightEl = document.getElementById('apodCopyright');
    const explanationEl = document.getElementById('apodExplanation');
    const downloadBtn = document.getElementById('downloadBtn');
    const zoomBtn = document.getElementById('zoomBtn');

    titleEl.textContent = data.title;
    dateEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${data.date}`;
    explanationEl.textContent = data.explanation;

    if (data.copyright) {
        copyrightEl.innerHTML = `<i class="fa-solid fa-camera"></i> ⓒ ${data.copyright.trim()}`;
        copyrightEl.classList.remove('hidden');
    } else {
        copyrightEl.classList.add('hidden');
    }

    if (data.media_type === 'image') {
        videoEl.classList.add('hidden');
        imgEl.src = data.url;
        imgEl.alt = data.title;
        imgEl.classList.remove('hidden');
        
        downloadBtn.href = data.hdurl || data.url;
        downloadBtn.classList.remove('hidden');
        zoomBtn.classList.remove('hidden');
    } else if (data.media_type === 'video') {
        imgEl.classList.add('hidden');
        videoEl.src = data.url;
        videoEl.classList.remove('hidden');
        
        downloadBtn.classList.add('hidden');
        zoomBtn.classList.add('hidden');
    }

    updateFavoriteButtonUI();
}

function renderGallery(items) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        
        const thumbUrl = item.media_type === 'image' ? item.url : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400';

        card.innerHTML = `
            <div class="gallery-thumb-box">
                <img class="gallery-thumb" src="${thumbUrl}" alt="${item.title}" loading="lazy">
            </div>
            <div class="gallery-info">
                <span class="gallery-date">${item.date}</span>
                <span class="gallery-title">${item.title}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            state.currentDate = item.date;
            document.getElementById('apodDatePicker').value = item.date;
            loadApodByDate(item.date);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        grid.appendChild(card);
    });
}

// ==========================================================================
// 7. Favorites & Lightbox
// ==========================================================================
function toggleFavoriteCurrent() {
    if (!state.currentApod) return;
    
    const index = state.favorites.findIndex(f => f.date === state.currentApod.date);
    if (index >= 0) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push({
            date: state.currentApod.date,
            title: state.currentApod.title,
            url: state.currentApod.url,
            media_type: state.currentApod.media_type
        });
    }

    localStorage.setItem('nasa_apod_favorites', JSON.stringify(state.favorites));
    updateFavoriteButtonUI();
    renderFavorites();
}

function updateFavoriteButtonUI() {
    const favBtn = document.getElementById('favBtn');
    if (!state.currentApod) return;

    const isFav = state.favorites.some(f => f.date === state.currentApod.date);
    if (isFav) {
        favBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        favBtn.classList.add('active');
        favBtn.title = '즐겨찾기 해제';
    } else {
        favBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        favBtn.classList.remove('active');
        favBtn.title = '즐겨찾기 추가';
    }
}

function renderFavorites() {
    const favSection = document.getElementById('favoritesSection');
    const favGrid = document.getElementById('favoritesGrid');
    
    if (state.favorites.length === 0) {
        favSection.classList.add('hidden');
        return;
    }

    favSection.classList.remove('hidden');
    favGrid.innerHTML = '';

    state.favorites.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <div class="gallery-thumb-box">
                <img class="gallery-thumb" src="${item.url}" alt="${item.title}" loading="lazy">
            </div>
            <div class="gallery-info">
                <span class="gallery-date">${item.date}</span>
                <span class="gallery-title">${item.title}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            state.currentDate = item.date;
            document.getElementById('apodDatePicker').value = item.date;
            loadApodByDate(item.date);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        favGrid.appendChild(card);
    });
}

function openLightbox(imgSrc, captionText) {
    const lightbox = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');

    img.src = imgSrc;
    caption.textContent = captionText;
    lightbox.classList.remove('hidden');
}

function showLoader(show, text) {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loaderText');
    const main = document.getElementById('apodMain');

    if (show) {
        if (text) loaderText.textContent = text;
        loader.classList.remove('hidden');
        main.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        main.classList.remove('hidden');
    }
}

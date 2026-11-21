const opening = document.querySelector('#opening');
const openButton = document.querySelector('#open-invitation');
const skipOpening = new URLSearchParams(location.search).get('open') === '1';
function playOpeningChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    [783.99,987.77,1174.66,1567.98].forEach((frequency,i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, now + i * .06);
      gain.gain.exponentialRampToValueAtTime(.025, now + i * .06 + .04);
      gain.gain.exponentialRampToValueAtTime(.0001, now + i * .06 + 1.3);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(now + i * .06); oscillator.stop(now + i * .06 + 1.35);
    });
    setTimeout(() => context.close(), 1800);
  } catch (_) { /* Âm thanh không khả dụng trên trình duyệt này. */ }
}

if (skipOpening) opening.hidden = true;
else {
  document.body.classList.add('is-closed');
  const petals = document.querySelector('.petals');
  for (let i = 0; i < 12; i++) {
    const petal = document.createElement('i');
    petal.textContent = i % 3 === 0 ? '✦' : '❧';
    petal.style.left = `${(i * 37 + 11) % 100}%`;
    petal.style.fontSize = `${12 + (i * 7) % 13}px`;
    petal.style.setProperty('--dur', `${19 + (i * 3) % 8}s`);
    petal.style.setProperty('--delay', `${-i * 1.9}s`);
    petal.style.setProperty('--sway', `${(i % 2 ? -1 : 1) * (8 + i * 2)}px`);
    petals.append(petal);
  }
}
openButton.addEventListener('click', () => {
  if (opening.classList.contains('is-opening')) return;
  opening.classList.add('is-opening');
  openButton.disabled = true;
  playOpeningChime();
  startMusic();
  try { history.replaceState(null, '', `${location.pathname}?open=1${location.hash}`); } catch (_) { /* file:// có thể chặn History API. */ }
  setTimeout(() => {
    const burst = document.querySelector('.opening-burst');
    const colors = ['#c9a24a','#ece4d8','#a8323b','#7a1f26'];
    for (let i = 0; i < 24; i++) {
      const particle = document.createElement('span');
      particle.textContent = i % 3 === 0 ? '✦' : '❧';
      const angle = i * Math.PI * 2 / 24;
      const radius = 90 + (i % 4) * 35;
      particle.style.setProperty('--dx', `${Math.round(Math.cos(angle) * radius)}px`);
      particle.style.setProperty('--dy', `${Math.round(Math.sin(angle) * radius)}px`);
      particle.style.setProperty('--rot', `${180 + i * 35}deg`);
      particle.style.setProperty('--particle-color', colors[i % colors.length]);
      particle.style.setProperty('--particle-size', `${12 + i % 8}px`);
      particle.style.setProperty('--particle-delay', `${(i % 4) * .035}s`);
      burst.append(particle);
    }
    opening.classList.add('is-away');
  }, 500);
  setTimeout(() => {
    opening.hidden = true;
    document.body.classList.remove('is-closed');
    setTimeout(() => {
      if (!autoScrollManuallyInterrupted) startAutoScroll();
    }, 400);
  }, 1300);
});

const musicAudio = document.querySelector('#background-music');
const musicToggle = document.querySelector('#music-toggle');
const scrollToggle = document.querySelector('#scroll-toggle');
const playbackStatus = document.querySelector('#playback-status');
musicAudio.volume = .45;
let musicRequestId = 0;
function setMusicState(playing) {
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
  musicToggle.title = playing ? 'Tắt nhạc' : 'Bật nhạc';
  musicToggle.classList.toggle('active', playing);
}
function startMusic() {
  const requestId = ++musicRequestId;
  const result = musicAudio.play();
  if (result && typeof result.then === 'function') result.then(() => {
    if (requestId === musicRequestId) setMusicState(true);
  }).catch(() => {
    if (requestId === musicRequestId) {
      setMusicState(false);
      playbackStatus.textContent = 'Trình duyệt chưa cho phát nhạc. Hãy bấm nút nhạc để thử lại.';
    }
  });
}
function stopMusic() {
  musicRequestId++;
  musicAudio.pause();
  setMusicState(false);
}
musicToggle.addEventListener('click', () => musicAudio.paused ? startMusic() : stopMusic());
musicAudio.addEventListener('play', () => setMusicState(true));
musicAudio.addEventListener('pause', () => setMusicState(false));
musicAudio.addEventListener('error', () => { setMusicState(false); playbackStatus.textContent = 'Không tải được nhạc. Hãy kiểm tra kết nối mạng.'; });

const AUTO_SCROLL_SPEED = 36; // pixel mỗi giây
let autoScrolling = false;
let autoScrollManuallyInterrupted = false;
let autoScrollFrame = 0;
let autoScrollY = 0;
let lastScrollFrameTime = 0;
function setScrollState(playing) {
  scrollToggle.setAttribute('aria-pressed', String(playing));
  scrollToggle.setAttribute('aria-label', playing ? 'Dừng tự cuộn' : 'Bật tự cuộn');
  scrollToggle.title = playing ? 'Dừng tự cuộn' : 'Bật tự cuộn';
  scrollToggle.classList.toggle('active', playing);
}
function stopAutoScroll() {
  autoScrolling = false;
  cancelAnimationFrame(autoScrollFrame);
  setScrollState(false);
}
function autoScrollStep(timestamp) {
  if (!autoScrolling) return;
  if (document.hidden) {
    lastScrollFrameTime = 0;
    autoScrollFrame = requestAnimationFrame(autoScrollStep);
    return;
  }
  if (document.querySelector('dialog[open]')) { stopAutoScroll(); return; }
  if (lastScrollFrameTime) autoScrollY += AUTO_SCROLL_SPEED * Math.min((timestamp - lastScrollFrameTime) / 1000, .05);
  lastScrollFrameTime = timestamp;
  window.scrollTo(0, autoScrollY);
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) { stopAutoScroll(); scrollToggle.classList.add('is-available'); return; }
  autoScrollFrame = requestAnimationFrame(autoScrollStep);
}
function startAutoScroll() {
  if (autoScrolling) return;
  autoScrollY = window.scrollY;
  lastScrollFrameTime = 0;
  autoScrolling = true;
  scrollToggle.classList.remove('is-available');
  setScrollState(true);
  autoScrollFrame = requestAnimationFrame(autoScrollStep);
}
function interruptAutoScroll() { autoScrollManuallyInterrupted = true; stopAutoScroll(); scrollToggle.classList.add('is-available'); }
scrollToggle.addEventListener('click', () => autoScrolling ? interruptAutoScroll() : startAutoScroll());
window.addEventListener('wheel', interruptAutoScroll, {passive:true});
document.querySelector('main').addEventListener('pointerdown', interruptAutoScroll);
window.addEventListener('keydown', event => {
  if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) interruptAutoScroll();
});
if (skipOpening) setTimeout(() => {
  if (!autoScrollManuallyInterrupted) startAutoScroll();
}, 1200);

const targetTime = new Date('2026-12-27T11:00:00+07:00').getTime();
const countdownBoxes = [...document.querySelectorAll('#countdown strong')];
function updateCountdown() {
  const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
  const values = [Math.floor(remaining / 86400), Math.floor(remaining % 86400 / 3600), Math.floor(remaining % 3600 / 60), remaining % 60];
  countdownBoxes.forEach((box, index) => { box.textContent = String(values[index]).padStart(2, '0'); });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const calendar = document.querySelector('#calendar-grid');
['T2','T3','T4','T5','T6','T7','CN'].forEach(day => { const cell = document.createElement('span'); cell.className = 'weekday'; cell.textContent = day; calendar.append(cell); });
for (let i = 0; i < 1; i++) calendar.append(document.createElement('span'));
for (let day = 1; day <= 31; day++) {
  const cell = document.createElement('span'); cell.textContent = day;
  if (day === 27) { cell.className = 'wedding-day'; cell.setAttribute('aria-label', 'Ngày cưới 27 tháng 12'); }
  calendar.append(cell);
}

document.querySelector('#add-calendar').addEventListener('click', () => {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wedding Invitation//VI','BEGIN:VEVENT','UID:trong-duy-tran-lan-20261227@local','DTSTART;TZID=Asia/Ho_Chi_Minh:20261227T110000','DTEND;TZID=Asia/Ho_Chi_Minh:20261227T140000','SUMMARY:Lễ cưới Trọng Duy & Trần Lan','LOCATION:Tư gia nhà trai','END:VEVENT','END:VCALENDAR'];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], {type:'text/calendar;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'lich-cuoi-trong-duy-tran-lan.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const photos = Array.from({length:8},(_,i) => `assets/photo${i+1}.jpg`);
const galleryDialog = document.querySelector('#gallery-dialog');
const currentPhoto = document.querySelector('#gallery-current');
const photoCounter = document.querySelector('#gallery-counter');
const thumbs = document.querySelector('#gallery-thumbs');
let currentIndex = 0;
function showPhoto(index) {
  currentIndex = (index + photos.length) % photos.length;
  currentPhoto.src = photos[currentIndex]; currentPhoto.alt = `Ảnh cưới ${currentIndex + 1}`;
  photoCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  [...thumbs.children].forEach((button,i) => button.classList.toggle('active',i === currentIndex));
}
photos.forEach((src,i) => {
  const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Xem ảnh ${i+1}`);
  const img = document.createElement('img'); img.src = src; img.alt = '';
  button.append(img); button.addEventListener('click', () => showPhoto(i)); thumbs.append(button);
});
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => { showPhoto(Number(button.dataset.image)); galleryDialog.showModal(); }));
document.querySelector('#prev-image').addEventListener('click', () => showPhoto(currentIndex - 1));
document.querySelector('#next-image').addEventListener('click', () => showPhoto(currentIndex + 1));
galleryDialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1); if (event.key === 'ArrowRight') showPhoto(currentIndex + 1); });

const giftDialog = document.querySelector('#gift-dialog');
const giftButton = document.querySelector('#open-gift');
const decorations = [
  ['dragon_phoenix_v2',35,47,34,-22,1,-14,1.6,0],
  ['double_dragon_blue',203,40,38,20,1,12,1.8,.15],
  ['elegant_leaf_green',40,157,26,-18,1,-9,1.4,.3],
  ['lien_hoa_v2_green',218,151,24,14,1,8,1.7,.45],
  ['crystal_floral_red',50,209,44,8,3,-12,1.9,.1],
  ['glass_garden_green',85,219,26,-10,3,4,1.3,.35],
  ['crystal_floral_green',176,213,40,-14,3,14,1.7,.25]
];
decorations.forEach(([name,x,y,w,angle,z,flyX,duration,delay]) => {
  const img = document.createElement('img');
  img.className = 'gift-decor'; img.src = `assets/${name}.webp`; img.alt = '';
  for (const [key,value] of Object.entries({'--x':`${x}px`,'--y':`${y}px`,'--w':`${w}px`,'--angle':`${angle}deg`,'--z':z,'--fly-x':`${flyX}px`,'--fly-duration':`${duration}s`,'--fly-delay':`${delay}s`})) img.style.setProperty(key,value);
  giftButton.append(img);
});
for (const name of ['sparkle-c','sparkle-d']) {
  const sparkle = document.createElement('span'); sparkle.className = `sparkle ${name}`; sparkle.textContent = '✦'; giftButton.append(sparkle);
}
const confettiColors = ['#ec4899','#b58b2f','#22c55e','#3b82f6','#a855f7','#facc15','#511419','#f97316'];
confettiColors.forEach((color,i) => {
  const piece = document.createElement('span'); piece.className = 'gift-confetti';
  piece.style.setProperty('--confetti-color',color);
  piece.style.setProperty('--confetti-radius',i % 2 ? '50%' : '2px');
  piece.style.setProperty('--confetti-x',`${(i - 3.5) * 18}px`);
  piece.style.setProperty('--confetti-y',`${-90 - (i % 3) * 20}px`);
  piece.style.setProperty('--confetti-delay',`${i * .07}s`);
  giftButton.append(piece);
});
document.querySelector('#open-gift').addEventListener('click', () => giftDialog.showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
[giftDialog,galleryDialog].forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));

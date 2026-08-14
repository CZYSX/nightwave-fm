const stations = [
  {
    frequency: "91.4",
    city: "拉萨",
    title: "综合广播",
    note: "拉萨人民广播电台新闻综合频率，藏汉双语播出，覆盖拉萨八区县。",
    color: "#d8f05c",
    tone: 155,
  },
  {
    frequency: "94.7",
    city: "上海",
    title: "经典947",
    note: "上海广播电视台经典音乐频率，以古典、爵士与世界音乐为主。",
    color: "#8bc5b3",
    tone: 196,
  },
  {
    frequency: "96.8",
    city: "重庆",
    title: "重庆之声",
    note: "重庆广播电视集团新闻综合频率，播出频率 FM96.8、AM1314。",
    color: "#ee684d",
    tone: 130,
  },
  {
    frequency: "99.5",
    city: "阿勒泰",
    title: "汉语综合广播",
    note: "阿勒泰地区广播电视台汉语综合广播，本地调频 FM99.5。",
    color: "#a9b9e6",
    tone: 220,
  },
  {
    frequency: "103.3",
    city: "大连",
    title: "新闻综合广播",
    note: "大连广播电视台新闻综合频率，播出频率 FM103.3、AM882。",
    color: "#f0be5c",
    tone: 174,
  },
  {
    frequency: "106.1",
    city: "广州",
    title: "交通广播",
    note: "广州广播电视台交通广播，同时也是广州应急广播，FM106.1。",
    color: "#73b3c7",
    tone: 110,
  },
];

const els = {
  body: document.body,
  dial: document.querySelector("#dial"),
  dialFace: document.querySelector(".dial-face"),
  favorite: document.querySelector("#favoriteButton"),
  frequency: document.querySelector("#frequency"),
  grid: document.querySelector("#stationGrid"),
  random: document.querySelector("#randomButton"),
  returnButton: document.querySelector("#returnButton"),
  sound: document.querySelector("#soundToggle"),
  stationNote: document.querySelector("#stationNote"),
  stationTitle: document.querySelector("#stationTitle"),
};

let currentIndex = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartIndex = 0;
let audioContext;
let masterGain;
let oscillator;
let noiseSource;
let soundEnabled = false;

const favorites = new Set(JSON.parse(localStorage.getItem("nightwave-favorites") || "[]"));

function displayName(station) {
  return station.title.startsWith(station.city) ? station.title : `${station.city} · ${station.title}`;
}

function renderCards() {
  els.grid.innerHTML = stations
    .map(
      (station, index) => `
        <button class="station-card ${index === currentIndex ? "active" : ""} ${favorites.has(index) ? "favorite" : ""}"
          type="button" data-index="${index}" style="--card-color: ${station.color}" aria-label="调到 ${station.frequency}，${displayName(station)}">
          <span class="card-top">
            <span class="card-frequency">${station.frequency} MHz</span>
            <span class="card-index">0${index + 1}</span>
          </span>
          <h3>${displayName(station)}</h3>
          <p>${station.note}</p>
          <i class="card-heart" data-lucide="heart" aria-hidden="true"></i>
        </button>
      `,
    )
    .join("");

  els.grid.querySelectorAll(".station-card").forEach((card) => {
    card.addEventListener("click", () => tuneTo(Number(card.dataset.index)));
  });
  refreshIcons();
}

function tuneTo(index) {
  currentIndex = (index + stations.length) % stations.length;
  const station = stations[currentIndex];
  els.frequency.textContent = station.frequency;
  els.stationTitle.textContent = displayName(station);
  els.stationNote.textContent = station.note;
  els.body.dataset.station = String(currentIndex);
  els.body.style.setProperty("--station-accent", station.color);
  els.dialFace.style.transform = `rotate(${-125 + currentIndex * 50}deg)`;
  els.dial.setAttribute("aria-valuenow", String(currentIndex));
  els.dial.setAttribute("aria-valuetext", `${station.frequency} MHz，${displayName(station)}`);
  updateFavoriteButton();
  renderCards();
  updateTone(station.tone);
}

function updateFavoriteButton() {
  const active = favorites.has(currentIndex);
  els.favorite.classList.toggle("active", active);
  els.favorite.setAttribute("aria-label", active ? "取消收藏当前频率" : "收藏当前频率");
  els.favorite.title = active ? "取消收藏当前频率" : "收藏当前频率";
  els.favorite.innerHTML = `<i data-lucide="heart" ${active ? 'fill="currentColor"' : ""} aria-hidden="true"></i>`;
  refreshIcons();
}

function toggleFavorite() {
  if (favorites.has(currentIndex)) favorites.delete(currentIndex);
  else favorites.add(currentIndex);
  localStorage.setItem("nightwave-favorites", JSON.stringify([...favorites]));
  updateFavoriteButton();
  renderCards();
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startAudio() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  if (!masterGain) {
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.055;
    masterGain.connect(audioContext.destination);

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    filter.connect(masterGain);

    noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioContext);
    noiseSource.loop = true;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.13;
    noiseSource.connect(noiseGain).connect(filter);
    noiseSource.start();

    oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = stations[currentIndex].tone;
    const oscillatorGain = audioContext.createGain();
    oscillatorGain.gain.value = 0.2;
    oscillator.connect(oscillatorGain).connect(filter);
    oscillator.start();
  }
  audioContext.resume();
}

function updateTone(value) {
  if (!oscillator || !audioContext) return;
  oscillator.frequency.exponentialRampToValueAtTime(value, audioContext.currentTime + 0.35);
}

function toggleSound() {
  if (!soundEnabled) {
    startAudio();
    soundEnabled = true;
  } else {
    soundEnabled = false;
    audioContext.suspend();
  }
  els.sound.setAttribute("aria-label", soundEnabled ? "关闭氛围音" : "开启氛围音");
  els.sound.title = soundEnabled ? "关闭氛围音" : "开启氛围音";
  els.sound.innerHTML = `<i data-lucide="${soundEnabled ? "volume-2" : "volume-x"}" aria-hidden="true"></i>`;
  refreshIcons();
}

els.grid.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  tuneTo(currentIndex + direction);
  els.grid.querySelector(`[data-index="${currentIndex}"]`).focus();
});

els.dial.addEventListener("keydown", (event) => {
  if (!["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  tuneTo(currentIndex + (["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1));
});

els.dial.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    tuneTo(currentIndex + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

els.dial.addEventListener("pointerdown", (event) => {
  isDragging = true;
  dragStartX = event.clientX;
  dragStartIndex = currentIndex;
  els.dial.setPointerCapture(event.pointerId);
});

els.dial.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const offset = Math.round((event.clientX - dragStartX) / 32);
  const next = Math.max(0, Math.min(stations.length - 1, dragStartIndex + offset));
  if (next !== currentIndex) tuneTo(next);
});

els.dial.addEventListener("pointerup", () => {
  isDragging = false;
});

els.favorite.addEventListener("click", toggleFavorite);
els.random.addEventListener("click", () => {
  let next = currentIndex;
  while (next === currentIndex) next = Math.floor(Math.random() * stations.length);
  tuneTo(next);
});
els.returnButton.addEventListener("click", () => {
  document.querySelector("#top").scrollIntoView({ behavior: "smooth" });
  window.setTimeout(() => els.dial.focus(), 500);
});
els.sound.addEventListener("click", toggleSound);

document.querySelector("#year").textContent = new Date().getFullYear();
renderCards();
tuneTo(0);
refreshIcons();

const stations = [
  {
    frequency: "88.6",
    city: "上海",
    title: "雨幕之后",
    note: "出租车划过积水，梧桐叶把雨声留在路边。",
    color: "#d8f05c",
    tone: 155,
  },
  {
    frequency: "91.3",
    city: "拉萨",
    title: "风越过山口",
    note: "经幡已经安静，只有风还在翻阅远处的雪线。",
    color: "#8bc5b3",
    tone: 196,
  },
  {
    frequency: "94.7",
    city: "重庆",
    title: "末班索道",
    note: "江面比霓虹更慢，山城的台阶通向一盏小灯。",
    color: "#ee684d",
    tone: 130,
  },
  {
    frequency: "97.5",
    city: "阿勒泰",
    title: "雪原短波",
    note: "木屋的烟升到一半，银河接走了剩下的故事。",
    color: "#a9b9e6",
    tone: 220,
  },
  {
    frequency: "101.8",
    city: "广州",
    title: "凌晨糖水铺",
    note: "卷帘门落下之前，最后一碗绿豆沙还冒着热气。",
    color: "#f0be5c",
    tone: 174,
  },
  {
    frequency: "106.2",
    city: "大连",
    title: "海雾来信",
    note: "汽笛从看不见的地方传来，码头把回声折了两次。",
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

function renderCards() {
  els.grid.innerHTML = stations
    .map(
      (station, index) => `
        <button class="station-card ${index === currentIndex ? "active" : ""} ${favorites.has(index) ? "favorite" : ""}"
          type="button" data-index="${index}" style="--card-color: ${station.color}" aria-label="调到 ${station.frequency}，${station.city}${station.title}">
          <span class="card-top">
            <span class="card-frequency">${station.frequency} MHz</span>
            <span class="card-index">0${index + 1}</span>
          </span>
          <h3>${station.city} · ${station.title}</h3>
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
  els.stationTitle.textContent = `${station.city} · ${station.title}`;
  els.stationNote.textContent = station.note;
  els.body.dataset.station = String(currentIndex);
  els.body.style.setProperty("--station-accent", station.color);
  els.dialFace.style.transform = `rotate(${-125 + currentIndex * 50}deg)`;
  els.dial.setAttribute("aria-valuenow", String(currentIndex));
  els.dial.setAttribute("aria-valuetext", `${station.frequency} MHz，${station.city}${station.title}`);
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
  els.sound.setAttribute("aria-label", soundEnabled ? "关闭声音" : "开启声音");
  els.sound.title = soundEnabled ? "关闭声音" : "开启声音";
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

const stations = [
  {
    frequency: "91.4",
    city: "拉萨",
    title: "综合广播",
    note: "拉萨人民广播电台新闻综合频率，藏汉双语播出，覆盖拉萨八区县。",
    color: "#d8f05c",
    stream: "https://lhttp.qtfm.cn/live/5022138/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
  {
    frequency: "94.7",
    city: "上海",
    title: "经典947",
    note: "上海广播电视台经典音乐频率，以古典、爵士与世界音乐为主。",
    color: "#8bc5b3",
    stream: "https://lhttp.qtfm.cn/live/267/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
  {
    frequency: "96.8",
    city: "重庆",
    title: "重庆之声",
    note: "重庆广播电视集团新闻综合频率，播出频率 FM96.8、AM1314。",
    color: "#ee684d",
    stream: "https://lhttp.qtfm.cn/live/1498/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
  {
    frequency: "99.5",
    city: "伊犁",
    title: "察布查尔广播",
    note: "伊犁察布查尔县本地广播，公开频道页面标注播出频率为 FM99.5。",
    color: "#a9b9e6",
    stream: "https://lhttp.qtfm.cn/live/5022610/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
  {
    frequency: "103.3",
    city: "大连",
    title: "新闻综合广播",
    note: "大连广播电视台新闻综合频率，播出频率 FM103.3、AM882。",
    color: "#f0be5c",
    stream: "https://lhttp.qtfm.cn/live/1089/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
  {
    frequency: "106.1",
    city: "广州",
    title: "交通广播",
    note: "广州广播电视台交通广播，同时也是广州应急广播，FM106.1。",
    color: "#73b3c7",
    stream: "https://lhttp.qtfm.cn/live/4955/64k.mp3",
    streamProvider: "蜻蜓 FM",
  },
];

const els = {
  body: document.body,
  dial: document.querySelector("#dial"),
  dialFace: document.querySelector(".dial-face"),
  favorite: document.querySelector("#favoriteButton"),
  frequency: document.querySelector("#frequency"),
  grid: document.querySelector("#stationGrid"),
  liveStatus: document.querySelector("#liveStatus"),
  random: document.querySelector("#randomButton"),
  returnButton: document.querySelector("#returnButton"),
  sound: document.querySelector("#soundToggle"),
  streamBadge: document.querySelector("#streamBadge"),
  streamState: document.querySelector("#streamState"),
  stationNote: document.querySelector("#stationNote"),
  stationTitle: document.querySelector("#stationTitle"),
};

let currentIndex = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartIndex = 0;
let streamIntent = false;
let streamSequence = 0;
let currentStreamState = "idle";

const liveAudio = new Audio();
liveAudio.preload = "none";

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
  if (streamIntent) playCurrentStream();
  else if (currentStreamState === "paused") setStreamState("paused", "直播已暂停");
  else setStreamState("idle", "直播待机");
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

function setStreamState(state, message) {
  const station = stations[currentIndex];
  const labels = {
    idle: { badge: "READY", icon: "play", action: "播放电台直播" },
    loading: { badge: "TUNING", icon: "loader-circle", action: "停止连接直播" },
    playing: { badge: "LIVE", icon: "pause", action: "暂停电台直播" },
    paused: { badge: "PAUSED", icon: "play", action: "继续播放电台直播" },
    error: { badge: "OFF AIR", icon: "refresh-cw", action: "重新连接电台直播" },
  };
  const config = labels[state];
  currentStreamState = state;

  els.liveStatus.dataset.state = state;
  els.streamBadge.textContent = config.badge;
  els.streamState.textContent = message;
  els.sound.dataset.state = state;
  els.sound.setAttribute("aria-label", `${config.action}：${displayName(station)}`);
  els.sound.setAttribute("aria-pressed", String(state === "playing"));
  els.sound.title = config.action;
  els.sound.innerHTML = `<i data-lucide="${config.icon}" aria-hidden="true"></i>`;
  refreshIcons();
}

async function playCurrentStream() {
  const sequence = ++streamSequence;
  const station = stations[currentIndex];
  streamIntent = true;
  liveAudio.pause();
  liveAudio.src = station.stream;
  liveAudio.load();
  setStreamState("loading", `正在连接 ${displayName(station)}`);

  try {
    await liveAudio.play();
    if (sequence !== streamSequence || !streamIntent) return;
    setStreamState("playing", `直播中 · ${station.streamProvider}`);
  } catch (error) {
    if (sequence !== streamSequence || !streamIntent) return;
    streamIntent = false;
    setStreamState("error", "直播暂时无法连接，请稍后重试");
  }
}

function pauseStream() {
  streamIntent = false;
  streamSequence += 1;
  liveAudio.pause();
  setStreamState("paused", "直播已暂停");
}

function toggleStream() {
  if (streamIntent) pauseStream();
  else playCurrentStream();
}

liveAudio.addEventListener("playing", () => {
  if (!streamIntent) return;
  const station = stations[currentIndex];
  setStreamState("playing", `直播中 · ${station.streamProvider}`);
});

liveAudio.addEventListener("waiting", () => {
  if (streamIntent) setStreamState("loading", `正在缓冲 ${displayName(stations[currentIndex])}`);
});

liveAudio.addEventListener("stalled", () => {
  if (streamIntent) setStreamState("loading", `正在重新连接 ${displayName(stations[currentIndex])}`);
});

liveAudio.addEventListener("error", () => {
  if (!streamIntent) return;
  streamIntent = false;
  streamSequence += 1;
  setStreamState("error", "直播暂时无法连接，请稍后重试");
});

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
els.sound.addEventListener("click", toggleStream);

document.querySelector("#year").textContent = new Date().getFullYear();
renderCards();
tuneTo(0);
setStreamState("idle", "直播待机");
refreshIcons();

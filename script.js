const birthdayForm = document.getElementById("birthdayForm");
const receiverForm = document.getElementById("receiverForm");
const creatorPanel = document.getElementById("creatorPanel");
const receiverGate = document.getElementById("receiverGate");
const surpriseContent = document.getElementById("surpriseContent");
const gallerySection = document.getElementById("gallerySection");
const wishSection = document.getElementById("wishSection");
const nameInput = document.getElementById("nameInput");
const receiverNameInput = document.getElementById("receiverNameInput");
const photoInput = document.getElementById("photoInput");
const photoCountText = document.getElementById("photoCountText");
const shareButton = document.getElementById("shareButton");
const copyButton = document.getElementById("copyButton");
const shareLink = document.getElementById("shareLink");
const playButton = document.getElementById("playButton");
const heroName = document.getElementById("heroName");
const heroMessage = document.getElementById("heroMessage");
const photoGallery = document.getElementById("photoGallery");
const wishList = document.getElementById("wishList");
const confettiLayer = document.getElementById("confettiLayer");

const MIN_PHOTOS = 10;
const MAX_SHARE_PHOTOS = 10;

const audioContextFactory = () =>
  new (window.AudioContext || window.webkitAudioContext)();

let audioContext;
let isPlaying = false;
let selectedPhotos = [];
let compressedPhotos = [];
let sharedWishData = null;

const melody = [
  ["G4", 0.38], ["G4", 0.38], ["A4", 0.75], ["G4", 0.75], ["C5", 0.75], ["B4", 1.4],
  ["G4", 0.38], ["G4", 0.38], ["A4", 0.75], ["G4", 0.75], ["D5", 0.75], ["C5", 1.4],
  ["G4", 0.38], ["G4", 0.38], ["G5", 0.75], ["E5", 0.75], ["C5", 0.75], ["B4", 0.75],
  ["A4", 1.4], ["F5", 0.38], ["F5", 0.38], ["E5", 0.75], ["C5", 0.75], ["D5", 0.75],
  ["C5", 1.5],
];

const noteMap = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

function buildWishes(name) {
  return [
    `Happy Birthday ${name}, tumhari zindagi hamesha khushiyon se bhari rahe.`,
    `Aaj ka din tumhare liye pyaar, muskurahat aur khoobsurat surprises lekar aaye.`,
    `Allah kare har naya saal tumhe aur zyada khushi aur sukoon de.`,
    `Tumhari har choti aur badi wish dheere dheere poori hoti rahe.`,
    `Tum hamesha un logon se ghire raho jo tumse sacchi mohabbat karte hain.`,
    `Tumhari smile hamesha itni hi pyari aur roshan rahe.`,
    `Life ke har challenge me tum aur mazboot banke nikal kar aao.`,
    `Aaj ka birthday sweet memories, cake aur laughter se bhar jaye.`,
    `Tumhara future bright ho aur har din tumhare liye special bane.`,
    `Happy Birthday ${name}, tum bohat special ho aur hamesha rahoge.`,
  ];
}

function toBase64Url(text) {
  return btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(text) {
  const normalized = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

function showCreateMode() {
  creatorPanel.classList.remove("hidden");
  receiverGate.classList.add("hidden");
  surpriseContent.classList.remove("hidden");
  gallerySection.classList.remove("hidden");
  wishSection.classList.remove("hidden");
}

function showReceiverGate(payload) {
  sharedWishData = payload;
  creatorPanel.classList.add("hidden");
  surpriseContent.classList.add("hidden");
  gallerySection.classList.add("hidden");
  wishSection.classList.add("hidden");
  receiverGate.classList.remove("hidden");
}

function revealSharedWish(name) {
  const sharedName = sharedWishData && sharedWishData.name ? sharedWishData.name.trim() : "";
  const sharedPhotos =
    sharedWishData && Array.isArray(sharedWishData.photos) ? sharedWishData.photos : [];
  const safeName = name.trim() || sharedName || "My Star";
  receiverGate.classList.add("hidden");
  surpriseContent.classList.remove("hidden");
  gallerySection.classList.remove("hidden");
  wishSection.classList.remove("hidden");
  updateWishView(safeName);
  renderGallery(sharedPhotos);
  photoCountText.textContent = `${sharedPhotos.length} photos surprise me load ho chuki hain.`;
  launchConfetti(44);
  playSong();
}

function updateWishView(name) {
  const safeName = name.trim() || "My Star";
  heroName.textContent = safeName;
  heroMessage.textContent = `Yeh pyara birthday surprise ${safeName} ke liye specially tayyar kiya gaya hai.`;
  wishList.innerHTML = "";
  buildWishes(safeName).forEach((wish) => {
    const item = document.createElement("li");
    item.textContent = wish;
    wishList.appendChild(item);
  });
}

function launchConfetti(count = 34) {
  const colors = ["#ff6b9a", "#ffd166", "#8be9fd", "#ffffff", "#cdb4ff", "#ffafcc"];
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${4 + Math.random() * 2.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 8000);
  }
}

function renderGallery(photos) {
  photoGallery.innerHTML = "";
  if (!photos.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    placeholder.textContent = "Yahan birthday photos reveal hongi.";
    photoGallery.appendChild(placeholder);
    return;
  }

  photos.forEach((photo, index) => {
    const card = document.createElement("figure");
    card.className = "photo-card";
    const image = document.createElement("img");
    image.src = photo;
    image.alt = `Birthday photo ${index + 1}`;
    card.appendChild(image);
    photoGallery.appendChild(card);
  });
}

function updatePhotoCount(count) {
  if (count >= MIN_PHOTOS) {
    photoCountText.textContent = `${count} photos ready hain. Ab aap share link bana sakte ho.`;
    return;
  }
  photoCountText.textContent = `Abhi ${count} photos select hui hain. Share link ke liye minimum ${MIN_PHOTOS} chahiye.`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image read failed"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxSize = 280, quality = 0.45) {
  const src = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = src;
  });
}

function playNote(freq, startTime, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.95);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

async function playSong() {
  if (isPlaying) {
    return;
  }
  if (!window.AudioContext && !window.webkitAudioContext) {
    playButton.textContent = "Audio not supported";
    return;
  }
  if (!audioContext) {
    audioContext = audioContextFactory();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  isPlaying = true;
  playButton.textContent = "Playing...";

  let cursor = audioContext.currentTime + 0.05;
  melody.forEach(([note, duration], index) => {
    playNote(noteMap[note], cursor, duration);
    if (index % 4 === 0) {
      setTimeout(() => launchConfetti(10), index * 250);
    }
    cursor += duration;
  });

  setTimeout(() => {
    isPlaying = false;
    playButton.textContent = "Song Play Karo";
  }, (cursor - audioContext.currentTime) * 1000);
}

async function compressSelectedPhotos(files) {
  const limitedFiles = files.slice(0, MAX_SHARE_PHOTOS);
  return Promise.all(limitedFiles.map((file) => compressImage(file)));
}

function createShareUrl(name, photos) {
  const payload = { name, photos };
  return `${window.location.origin}${window.location.pathname}#gift=${toBase64Url(
    JSON.stringify(payload)
  )}`;
}

async function saveWishOnServer(name, photos) {
  const response = await fetch("/api/wishes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, photos }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Wish save nahi ho payi.");
  }

  return payload.share_url;
}

async function buildShareUrl() {
  const name = nameInput.value.trim();
  if (selectedPhotos.length < MIN_PHOTOS) {
    throw new Error(`Please upload at least ${MIN_PHOTOS} photos before sharing.`);
  }

  if (!compressedPhotos.length) {
    compressedPhotos = await compressSelectedPhotos(selectedPhotos);
  }

  let url = "";
  try {
    url = await saveWishOnServer(name, compressedPhotos);
    photoCountText.textContent = "Server par wish save ho gayi. Short share link ready hai.";
  } catch {
    url = createShareUrl(name, compressedPhotos);
    if (url.length > 18000) {
      throw new Error(
        "Server connect nahi hua aur fallback link bahut badi ho rahi hai. Chhoti photos use karo ya python server chalao."
      );
    }
    photoCountText.textContent =
      "Server connect nahi hua, isliye fallback share link banayi gayi hai.";
  }

  shareLink.value = url;
  return url;
}

async function showSelectedPhotos(files) {
  selectedPhotos = Array.from(files || []);
  compressedPhotos = [];
  updatePhotoCount(selectedPhotos.length);

  if (!selectedPhotos.length) {
    renderGallery([]);
    return;
  }

  const previewPhotos = await Promise.all(
    selectedPhotos.slice(0, 10).map((file) => compressImage(file, 380, 0.65))
  );
  renderGallery(previewPhotos);
}

async function loadSharedStateFromUrl() {
  const wishMatch = window.location.pathname.match(/^\/wish\/([A-Za-z0-9_-]+)$/);
  if (wishMatch) {
    try {
      const response = await fetch(`/api/wishes/${wishMatch[1]}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Wish load nahi hui.");
      }

      showReceiverGate({
        name: payload.name ? payload.name.trim() : "",
        photos: Array.isArray(payload.photos) ? payload.photos : [],
      });
      return;
    } catch {
      showReceiverGate({ name: "", photos: [] });
      photoCountText.textContent = "Shared link ko load nahi kiya ja saka.";
      return;
    }
  }

  const hash = window.location.hash.slice(1);
  if (hash.startsWith("gift=")) {
    try {
      const payload = JSON.parse(fromBase64Url(hash.slice(5)));
      showReceiverGate({
        name: payload.name ? payload.name.trim() : "",
        photos: Array.isArray(payload.photos) ? payload.photos : [],
      });
      return;
    } catch {
      photoCountText.textContent = "Shared link ko read nahi kiya ja saka.";
    }
  }

  showCreateMode();
  updateWishView(nameInput.value);
  renderGallery([]);
}

photoInput.addEventListener("change", async (event) => {
  await showSelectedPhotos(event.target.files);
});

birthdayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showCreateMode();
  updateWishView(nameInput.value);
  launchConfetti(28);
  await playSong();
});

receiverForm.addEventListener("submit", (event) => {
  event.preventDefault();
  revealSharedWish(receiverNameInput.value);
});

shareButton.addEventListener("click", async () => {
  try {
    await buildShareUrl();
    shareButton.textContent = "Link Ready";
    setTimeout(() => {
      shareButton.textContent = "Share Link Banao";
    }, 1600);
  } catch (error) {
    shareLink.value = "";
    shareButton.textContent = "Try Again";
    photoCountText.textContent = error.message || "Share link generate nahi ho payi.";
    setTimeout(() => {
      shareButton.textContent = "Share Link Banao";
      updatePhotoCount(selectedPhotos.length);
    }, 1800);
  }
});

copyButton.addEventListener("click", async () => {
  try {
    const url = shareLink.value || (await buildShareUrl());
    await navigator.clipboard.writeText(url);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Link Copy Karo";
    }, 1500);
  } catch (error) {
    photoCountText.textContent = error.message || "Link copy nahi ho payi.";
  }
});

playButton.addEventListener("click", () => {
  playSong();
  launchConfetti(24);
});

updatePhotoCount(0);
loadSharedStateFromUrl();

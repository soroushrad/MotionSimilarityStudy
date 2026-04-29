let participant = {};
let selectedVideos = [];
let currentIndex = 0;
let responses = [];

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSck3lQJVQF8GRby6_nIw_ycqPhb1WhXpTmIBqZD6fYEn88wKQ/formResponse";

const FIELD_MAP = {
  participant_id: "entry.301448104",
  age: "entry.1650670881",
  gender: "entry.2028815044",
  video: "entry.728121523",
  clip: "entry.1329244795",
  variant: "entry.1963389551",
  rating: "entry.1711735973",
  timestamp: "entry.388067952"
};

const variants = [
  "jerk_NZ1",
  "jerk_NZ2",
  "offset_L01",
  "offset_L05",
  "phase_NZ",
  "timewarp_NZ1",
  "timewarp_NZ2"
];

const allVideos = [];

for (let i = 1; i <= 15; i++) {
  const clipNumber = String(i).padStart(2, "0");

  variants.forEach(variant => {
    allVideos.push(`clip${clipNumber}_${variant}_right_vs_original.mp4`);
  });
}

function startStudy() {
  const age = document.getElementById("age").value.trim();
  const gender = document.getElementById("gender").value;

  if (!age || !gender) {
    alert("Please fill in age range and gender.");
    return;
  }

  const id = generateParticipantId();

  participant = {
    id,
    age,
    gender
  };

  selectedVideos = selectVideosForParticipant(allVideos, 3);

  if (selectedVideos.length === 0) {
    alert("No videos found. Check filenames.");
    return;
  }

  currentIndex = 0;
  responses = [];

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("studyScreen").classList.remove("hidden");
  document.getElementById("endScreen").classList.add("hidden");

  showVideo();
}

function selectVideosForParticipant(videoList, numberOfClips) {
  const grouped = {};

  videoList.forEach(video => {
    const clip = extractClip(video);
    if (!clip) return;

    if (!grouped[clip]) grouped[clip] = [];
    grouped[clip].push(video);
  });

  const clips = Object.keys(grouped);
  shuffleArray(clips);

  const selectedClips = clips.slice(0, numberOfClips);

  let finalVideos = [];

  selectedClips.forEach(clip => {
    variants.forEach(variant => {
      const found = grouped[clip].find(v =>
        v.toLowerCase().includes(variant.toLowerCase())
      );

      if (found) finalVideos.push(found);
    });
  });

  shuffleArray(finalVideos);
  return finalVideos;
}

function showVideo() {
  const video = selectedVideos[currentIndex];

  document.getElementById("progressText").textContent =
    `Video ${currentIndex + 1} of ${selectedVideos.length}`;

  const player = document.getElementById("videoPlayer");

  player.src = `videos/${video}`;
  player.load();

  player.play().catch(() => {
    console.log("Autoplay blocked");
  });
}

function saveAnswer(rating) {
  const video = selectedVideos[currentIndex];

  responses.push({
    participant_id: participant.id,
    age: participant.age,
    gender: participant.gender,
    video: video,
    clip: extractClip(video),
    variant: extractVariant(video),
    rating: rating,
    timestamp: new Date().toISOString()
  });

  currentIndex++;

  if (currentIndex >= selectedVideos.length) {
    document.getElementById("studyScreen").classList.add("hidden");
    document.getElementById("endScreen").classList.remove("hidden");
  } else {
    showVideo();
  }
}

async function downloadCSV() {
  const submitButton = document.querySelector("#endScreen button");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }

  for (const r of responses) {
    const formData = new FormData();

    formData.append(FIELD_MAP.participant_id, r.participant_id);
    formData.append(FIELD_MAP.age, r.age);
    formData.append(FIELD_MAP.gender, r.gender);
    formData.append(FIELD_MAP.video, r.video);
    formData.append(FIELD_MAP.clip, r.clip);
    formData.append(FIELD_MAP.variant, r.variant);
    formData.append(FIELD_MAP.rating, r.rating);
    formData.append(FIELD_MAP.timestamp, r.timestamp);

    try {
      await fetch(FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      await delay(200);
    } catch (error) {
      console.log("Submission error:", error);
    }
  }

  alert("Responses submitted successfully.");

  location.reload();
}

function generateParticipantId() {
  const now = new Date();

  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const time =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `P_${date}_${time}_${random}`;
}

function extractClip(filename) {
  const match = filename.match(/clip\d+/i);
  return match ? match[0] : "";
}

function extractVariant(filename) {
  const found = variants.find(v =>
    filename.toLowerCase().includes(v.toLowerCase())
  );

  return found || "";
}

function shuffleArray(array) {
  array.sort(() => Math.random() - 0.5);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

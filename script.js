let participant = {};
let selectedVideos = [];
let currentIndex = 0;
let responses = [];

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
  const id = document.getElementById("participantId").value.trim();
  const age = document.getElementById("age").value.trim();
  const gender = document.getElementById("gender").value;

  if (!id || !age || !gender) {
    alert("Please fill in all fields.");
    return;
  }

  participant = {
    id,
    age,
    gender
  };

  selectedVideos = selectVideosForParticipant(allVideos, 3);

  if (selectedVideos.length === 0) {
    alert("No videos selected. Please check video filenames.");
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

    if (!grouped[clip]) {
      grouped[clip] = [];
    }

    grouped[clip].push(video);
  });

  const clips = Object.keys(grouped);
  shuffleArray(clips);

  const selectedClips = clips.slice(0, numberOfClips);

  let finalVideos = [];

  selectedClips.forEach(clip => {
    variants.forEach(variant => {
      const found = grouped[clip].find(video =>
        video.toLowerCase().includes(variant.toLowerCase())
      );

      if (found) {
        finalVideos.push(found);
      }
    });
  });

  shuffleArray(finalVideos);

  return finalVideos;
}

function showVideo() {
  const video = selectedVideos[currentIndex];

  document.getElementById("progressText").textContent =
    `Video ${currentIndex + 1} of ${selectedVideos.length}`;

  const videoPlayer = document.getElementById("videoPlayer");

  videoPlayer.src = `videos/${video}`;
  videoPlayer.load();

  videoPlayer.play().catch(() => {
    console.log("Autoplay was blocked. User can press play manually.");
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

function downloadCSV() {
  let csv = "participant_id,age,gender,video,clip,variant,rating,timestamp\n";

  responses.forEach(row => {
    csv += [
      cleanCSV(row.participant_id),
      cleanCSV(row.age),
      cleanCSV(row.gender),
      cleanCSV(row.video),
      cleanCSV(row.clip),
      cleanCSV(row.variant),
      cleanCSV(row.rating),
      cleanCSV(row.timestamp)
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const fileName = `${participant.id}_${participant.age}_${getDateTimeString()}.csv`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert("Result file downloaded successfully.");

  location.reload();
}

function extractClip(filename) {
  const match = filename.match(/clip\d+/i);
  return match ? match[0] : "";
}

function extractVariant(filename) {
  const found = variants.find(variant =>
    filename.toLowerCase().includes(variant.toLowerCase())
  );

  return found || "";
}

function shuffleArray(array) {
  array.sort(() => Math.random() - 0.5);
}

function getDateTimeString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hour}${minute}${second}`;
}

function cleanCSV(value) {
  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
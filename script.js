const notes = [
  { letter: "C", color: "#df2d18", noteTop: "76%", noteLeft: "58%" },
  { letter: "D", color: "#f58213", noteTop: "68%", noteLeft: "60%" },
  { letter: "E", color: "#f8e71c", noteTop: "58%", noteLeft: "60%" },
  { letter: "F", color: "#40df49", noteTop: "48%", noteLeft: "57%" },
  { letter: "G", color: "#147c72", noteTop: "39%", noteLeft: "57%" },
  { letter: "A", color: "#623182", noteTop: "31%", noteLeft: "58%" },
  { letter: "H", color: "#d64bc9", noteTop: "22%", noteLeft: "59%" },
];

const scoopBank = document.querySelector("#scoopBank");
const conesGrid = document.querySelector("#conesGrid");
const levelTabs = document.querySelector("#levelTabs");
const scoopTemplate = document.querySelector("#scoopTemplate");
const coneTemplate = document.querySelector("#coneTemplate");
const score = document.querySelector("#score");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#resetButton");
const levelSizes = [3, 4, 5, 6, 7];

let selectedLetter = null;
let matched = new Set();
let currentLevelIndex = 0;

function activeNotes() {
  return notes.slice(0, levelSizes[currentLevelIndex]);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function playTone(isCorrect) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = isCorrect ? 660 : 180;
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.2);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.22);
}

function updateScore() {
  score.textContent = `${matched.size} / ${activeNotes().length}`;
}

function setFeedback(text, type = "") {
  feedback.textContent = text;
  feedback.className = `feedback ${type}`.trim();
}

function clearSelection() {
  selectedLetter = null;
  document.querySelectorAll(".scoop.selected").forEach((scoop) => scoop.classList.remove("selected"));
}

function selectScoop(letter) {
  if (matched.has(letter)) return;
  selectedLetter = letter;
  document.querySelectorAll(".scoop").forEach((scoop) => {
    scoop.classList.toggle("selected", scoop.dataset.letter === letter);
  });
  setFeedback(`Teď najdi kornout ${letter}.`);
}

function tryMatch(letter, coneCard) {
  if (!selectedLetter || matched.has(letter) || matched.has(selectedLetter)) return;

  if (selectedLetter !== letter) {
    coneCard.classList.remove("wrong");
    void coneCard.offsetWidth;
    coneCard.classList.add("wrong");
    setFeedback("Ještě jednou. Barva patří k jinému písmenku.", "bad");
    playTone(false);
    return;
  }

  const note = notes.find((item) => item.letter === letter);
  matched.add(letter);
  coneCard.classList.add("done");
  const placed = coneCard.querySelector(".placed-scoop");
  placed.style.setProperty("--scoop-color", note.color);
  placed.classList.add("visible");
  document.querySelector(`.scoop[data-letter="${letter}"]`)?.classList.add("matched");
  clearSelection();
  updateScore();
  setFeedback(`Správně, ${letter} má svůj kopeček.`, "good");
  playTone(true);

  if (matched.size === activeNotes().length) {
    document.body.classList.add("celebrate");
    const hasNextLevel = currentLevelIndex < levelSizes.length - 1;
    setFeedback(hasNextLevel ? "Hotovo! Můžeš zkusit další stránku." : "Hotovo! Všechny zmrzliny jsou správně poskládané.", "good");
  }
}

function createScoop(note) {
  const scoop = scoopTemplate.content.firstElementChild.cloneNode(true);
  scoop.dataset.letter = note.letter;
  scoop.style.setProperty("--scoop-color", note.color);
  scoop.style.setProperty("--note-top", note.noteTop);
  scoop.style.setProperty("--note-left", note.noteLeft);
  scoop.setAttribute("aria-label", `Kopeček pro notu ${note.letter}`);

  scoop.addEventListener("click", () => selectScoop(note.letter));
  scoop.addEventListener("dragstart", (event) => {
    selectScoop(note.letter);
    event.dataTransfer.setData("text/plain", note.letter);
  });

  return scoop;
}

function createCone(note) {
  const coneCard = coneTemplate.content.firstElementChild.cloneNode(true);
  coneCard.dataset.letter = note.letter;
  coneCard.querySelector(".letter").textContent = note.letter;
  coneCard.setAttribute("aria-label", `Kornout ${note.letter}`);

  coneCard.addEventListener("click", () => tryMatch(note.letter, coneCard));
  coneCard.addEventListener("dragover", (event) => {
    event.preventDefault();
    coneCard.classList.add("drop-ready");
  });
  coneCard.addEventListener("dragleave", () => coneCard.classList.remove("drop-ready"));
  coneCard.addEventListener("drop", (event) => {
    event.preventDefault();
    selectedLetter = event.dataTransfer.getData("text/plain");
    coneCard.classList.remove("drop-ready");
    tryMatch(note.letter, coneCard);
  });

  return coneCard;
}

function renderGame() {
  const currentNotes = activeNotes();
  matched = new Set();
  selectedLetter = null;
  document.body.classList.remove("celebrate");
  scoopBank.replaceChildren(...shuffle(currentNotes).map(createScoop));
  conesGrid.replaceChildren(...currentNotes.map(createCone));
  document.documentElement.style.setProperty("--level-count", currentNotes.length);
  updateScore();
  setFeedback(`Stránka ${currentLevelIndex + 1}: přiřaď ${currentNotes.map((note) => note.letter).join(", ")}.`);
  renderLevels();
}

function renderLevels() {
  levelTabs.replaceChildren(...levelSizes.map((size, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-tab";
    button.textContent = `${index + 1}`;
    button.setAttribute("aria-label", `Stránka ${index + 1}, ${size} not`);
    button.setAttribute("aria-pressed", String(index === currentLevelIndex));
    button.addEventListener("click", () => {
      currentLevelIndex = index;
      renderGame();
    });
    return button;
  }));
}

resetButton.addEventListener("click", renderGame);
renderGame();

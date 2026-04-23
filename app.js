const questions = window.QUESTIONS;
const list = document.querySelector("#quizList");
const score = document.querySelector("#score");
const chips = document.querySelectorAll(".chip");
const markedCount = document.querySelector("#markedCount");
const redoMarkedBtn = document.querySelector("#redoMarked");
let currentChapter = "all";
const STORAGE_KEY = "macro-quiz-marked";
let marked = loadMarked();

function loadMarked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveMarked() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...marked]));
}

function optionText(q, label) {
  return q.options[label] || "";
}

function render() {
  const visible = currentChapter === "all"
    ? questions
    : currentChapter === "marked"
      ? questions.filter(q => marked.has(q.id))
    : questions.filter(q => q.chapter === currentChapter);
  score.textContent = `显示 ${visible.length} / ${questions.length} 题`;
  markedCount.textContent = `已标记 ${marked.size} 题`;
  list.innerHTML = visible.map((q, idx) => `
    <article class="question-card ${marked.has(q.id) ? "marked" : ""}" data-id="${q.id}">
      <div class="meta">
        <span>${q.chapter} · 第 ${q.number} 题</span>
        <span>${idx + 1} / ${visible.length}</span>
      </div>
      <div class="card-actions">
        <button class="mark-btn ${marked.has(q.id) ? "active" : ""}" type="button">
          ${marked.has(q.id) ? "取消标记" : "标记本题"}
        </button>
      </div>
      <p class="question">${escapeHtml(q.question)}</p>
      <fieldset class="options">
        ${Object.entries(q.options).map(([label, text]) => `
          <label class="option" data-label="${label}">
            <input type="radio" name="${q.id}" value="${label}" />
            <span><strong>${label}.</strong> ${escapeHtml(text)}</span>
          </label>
        `).join("")}
      </fieldset>
      <button class="submit" type="button">提交答案</button>
      <div class="result" aria-live="polite"></div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

list.addEventListener("click", event => {
  const markButton = event.target.closest(".mark-btn");
  if (markButton) {
    const card = markButton.closest(".question-card");
    const id = card.dataset.id;
    if (marked.has(id)) {
      marked.delete(id);
    } else {
      marked.add(id);
    }
    saveMarked();
    if (currentChapter === "marked" && !marked.has(id)) {
      render();
      return;
    }
    renderCardState(card, id);
    markedCount.textContent = `已标记 ${marked.size} 题`;
    return;
  }

  const button = event.target.closest(".submit");
  if (!button) return;
  const card = button.closest(".question-card");
  const q = questions.find(item => item.id === card.dataset.id);
  const checked = card.querySelector("input[type='radio']:checked");
  const result = card.querySelector(".result");
  if (!checked) {
    result.className = "result show bad";
    result.innerHTML = "<strong>请先选择一个答案。</strong>";
    return;
  }
  const userAnswer = checked.value;
  const correct = userAnswer === q.answer;
  card.querySelectorAll(".option").forEach(option => {
    option.classList.remove("correct", "incorrect");
    const label = option.dataset.label;
    if (label === q.answer) option.classList.add("correct");
    if (label === userAnswer && !correct) option.classList.add("incorrect");
  });
  result.className = `result show ${correct ? "good" : "bad"}`;
  result.innerHTML = `
    <strong>${correct ? "回答正确" : "回答错误"}</strong>
    <div class="answer-row">你的答案：${userAnswer}. ${escapeHtml(optionText(q, userAnswer))}</div>
    <div class="answer-row">正确答案：${q.answer}. ${escapeHtml(optionText(q, q.answer))}</div>
    <div class="explanation">解析：${escapeHtml(q.explanation)}</div>
  `;
});

function renderCardState(card, id) {
  const isMarked = marked.has(id);
  card.classList.toggle("marked", isMarked);
  const btn = card.querySelector(".mark-btn");
  btn.classList.toggle("active", isMarked);
  btn.textContent = isMarked ? "取消标记" : "标记本题";
}

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(item => item.classList.remove("active"));
    chip.classList.add("active");
    currentChapter = chip.dataset.chapter;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

redoMarkedBtn.addEventListener("click", () => {
  if (!marked.size) {
    alert("还没有标记题目。");
    return;
  }
  document.querySelectorAll(".question-card").forEach(card => {
    if (!marked.has(card.dataset.id)) return;
    card.querySelectorAll("input[type='radio']").forEach(input => {
      input.checked = false;
    });
    card.querySelectorAll(".option").forEach(option => {
      option.classList.remove("correct", "incorrect");
    });
    const result = card.querySelector(".result");
    result.className = "result";
    result.innerHTML = "";
  });
  currentChapter = "marked";
  chips.forEach(item => item.classList.toggle("active", item.dataset.chapter === "marked"));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

render();

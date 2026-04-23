const questions = window.QUESTIONS;
const list = document.querySelector("#quizList");
const score = document.querySelector("#score");
const chips = document.querySelectorAll(".chip");
let currentChapter = "all";

function optionText(q, label) {
  return q.options[label] || "";
}

function render() {
  const visible = currentChapter === "all"
    ? questions
    : questions.filter(q => q.chapter === currentChapter);
  score.textContent = `显示 ${visible.length} / ${questions.length} 题`;
  list.innerHTML = visible.map((q, idx) => `
    <article class="question-card" data-id="${q.id}">
      <div class="meta">
        <span>${q.chapter} · 第 ${q.number} 题</span>
        <span>${idx + 1} / ${visible.length}</span>
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

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(item => item.classList.remove("active"));
    chip.classList.add("active");
    currentChapter = chip.dataset.chapter;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

render();

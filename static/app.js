const notesInput = document.querySelector("#notes");
const languageInput = document.querySelector("#language");
const countInput = document.querySelector("#question-count");
const charCount = document.querySelector("#char-count");
const message = document.querySelector("#message");
const results = document.querySelector("#results");
const explainButton = document.querySelector("#explain-button");
const quizButton = document.querySelector("#quiz-button");

notesInput.addEventListener("input", () => {
  charCount.textContent = `${notesInput.value.length.toLocaleString()} / 20,000`;
});

function showMessage(text, kind) {
  message.textContent = text;
  message.className = `message ${kind}`;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
}

async function requestAssistant(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function safeText(tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function setBusy(busy) {
  explainButton.disabled = busy;
  quizButton.disabled = busy;
}

explainButton.addEventListener("click", async () => {
  results.replaceChildren();
  clearMessage();
  setBusy(true);
  showMessage("Making a clear explanation from your material…", "loading");
  try {
    const data = await requestAssistant("/api/explain", {
      notes: notesInput.value,
      language: languageInput.value,
    });
    clearMessage();
    const card = document.createElement("article");
    card.className = "result-card card";
    const heading = document.createElement("div");
    heading.className = "result-heading";
    heading.append(safeText("span", "✦", "result-icon"));
    const title = document.createElement("div");
    title.append(safeText("h2", "Here's the simple version"), safeText("p", "A clearer way to understand your material"));
    heading.append(title);
    card.append(heading, safeText("div", data.explanation, "explanation"));
    if (data.key_points.length) {
      const list = document.createElement("ul");
      list.className = "key-points";
      data.key_points.forEach((point) => list.append(safeText("li", point)));
      card.append(list);
    }
    results.append(card);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
});

quizButton.addEventListener("click", async () => {
  results.replaceChildren();
  clearMessage();
  setBusy(true);
  showMessage("Building your practice quiz…", "loading");
  try {
    const data = await requestAssistant("/api/quiz", {
      notes: notesInput.value,
      language: languageInput.value,
      count: Number(countInput.value),
    });
    clearMessage();
    renderQuiz(data.questions);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
});

function renderQuiz(questions) {
  const card = document.createElement("article");
  card.className = "result-card card";
  const heading = document.createElement("div");
  heading.className = "result-heading";
  heading.append(safeText("span", "▤", "result-icon"));
  const title = document.createElement("div");
  title.append(safeText("h2", "Practice quiz"), safeText("p", "Choose one answer for each question, then check your results."));
  heading.append(title);
  card.append(heading);

  questions.forEach((question, index) => {
    const block = document.createElement("section");
    block.className = "quiz-question";
    block.dataset.questionIndex = String(index);
    block.append(safeText("span", question.topic, "topic-tag"));
    block.append(safeText("p", `${index + 1}. ${question.question}`, "quiz-prompt"));
    const options = document.createElement("div");
    options.className = "option-list";
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${index}`;
      input.value = String(optionIndex);
      label.append(input, safeText("span", option));
      options.append(label);
    });
    block.append(options);
    card.append(block);
  });

  const submit = safeText("button", "Check my answers", "button button-primary quiz-submit");
  submit.type = "button";
  submit.addEventListener("click", () => gradeQuiz(card, questions, submit));
  card.append(submit);
  results.append(card);
}

function gradeQuiz(card, questions, submit) {
  const selected = questions.map((_, index) => {
    const choice = card.querySelector(`input[name="question-${index}"]:checked`);
    return choice ? Number(choice.value) : null;
  });
  if (selected.some((answer) => answer === null)) {
    showMessage("Answer every question before checking your results.", "error");
    return;
  }
  clearMessage();
  let correctCount = 0;
  const missedTopics = new Set();

  questions.forEach((question, index) => {
    const block = card.querySelector(`[data-question-index="${index}"]`);
    const labels = block.querySelectorAll(".option");
    labels.forEach((label, optionIndex) => {
      label.querySelector("input").disabled = true;
      if (optionIndex === question.answer_index) label.classList.add("correct");
      if (optionIndex === selected[index] && selected[index] !== question.answer_index) label.classList.add("incorrect");
    });
    if (selected[index] === question.answer_index) {
      correctCount += 1;
    } else {
      missedTopics.add(question.topic);
      block.append(safeText("p", `Answer: ${question.options[question.answer_index]}. ${question.explanation}`, "answer-note"));
    }
  });

  const summary = document.createElement("div");
  summary.className = "score-summary";
  summary.append(safeText("strong", `You got ${correctCount} out of ${questions.length} correct.`));
  if (missedTopics.size) {
    summary.append(safeText("div", "Topics to revisit:", ""));
    const tags = document.createElement("div");
    tags.className = "revision-list";
    missedTopics.forEach((topic) => tags.append(safeText("span", topic, "revision-tag")));
    summary.append(tags);
  } else {
    summary.append(safeText("div", "Excellent work — you got every question right!"));
  }
  card.insertBefore(summary, submit);
  submit.remove();
}

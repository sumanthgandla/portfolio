// ===== Theme Toggle (saved) =====
const root = document.documentElement;
const toggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeIcon.textContent = theme === "light" ? "☀️" : "🌙";
}

const saved = localStorage.getItem("theme");
setTheme(saved ? saved : "dark");

toggleBtn.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

// ===== Mobile Menu =====
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

burger.addEventListener("click", () => {
  nav.classList.toggle("is-open");
});

document.querySelectorAll(".nav__link").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("is-open"));
});

// ===== Scroll Reveal Animations =====
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });

revealEls.forEach(el => io.observe(el));

// ===== Footer Year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Progress Bar =====
const progress = document.getElementById("progress");
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progress.style.width = `${pct}%`;
});

// ===== Portfolio Chatbot =====
const CHATBOT_API_ENDPOINT = "/api/chat";

const PORTFOLIO_CONTEXT = `
You are Sumanth AI, a concise, friendly chatbot embedded in Sumanth Gandla's portfolio.
Answer only from the portfolio details below. If a visitor asks for something unknown, say you do not have that detail and invite them to contact Sumanth.
Keep answers helpful, specific, and conversational. For recruiters, highlight role fit, project impact, and contact paths.

Portfolio details:
- Name: Sumanth Gandla.
- Location: Mount Pleasant, Michigan.
- Focus: Data analytics, business intelligence, reporting automation, consulting, and process transformation.
- Education: MS in Information Systems at Central Michigan University, Aug 2024 to May 2026.
- Education: B.Tech in Mechanical Engineering from G. Pullaiah College of Engineering and Technology, Jun 2019 to May 2023.
- Summary: Early-career Information Systems graduate student experienced in stakeholder collaboration, extracting, cleaning, validating datasets, and delivering interactive dashboards for performance monitoring and executive reporting.
- Core tools: Power BI, Tableau, SQL, Python, Excel.
- Data skills: KPI development, reporting, business analysis, data modeling, SQL joins, subqueries, CTEs, aggregations, pandas, NumPy, pivot tables, Power Query, advanced Excel formulas.
- Emerging technology interest: Generative AI use cases for analytics and automation.
- Experience: Data Analytics Intern at Phoenix Global in Hyderabad, India from Jun 2023 to Dec 2023.
- Internship work: translated business requirements into reporting solutions, extracted/cleaned/validated Excel and multi-source datasets, built Power BI and Tableau dashboards, developed KPIs and calculated metrics for financial and operational analysis, and found process improvements that reduced manual data preparation effort.
- Project 1: U.S. Housing Market & Mortgage Trends Dashboard. Analyzed 10+ years of U.S. housing and mortgage data to identify affordability trends. Built an interactive Tableau dashboard with filters and parameters for multi-dimensional analysis. Tools: Tableau, SQL, Python.
- Project 2: Housing Market Dataset Validation & Integration. Standardized multi-year state-level housing datasets, aligned date formats and geographic hierarchies, and verified dataset relationships to improve reporting workflows. Tools: SQL, Tableau, data quality.
- Project 3: Optimizing Climate Policy for a 2 degrees C Future. Built policy scenarios in EN-ROADS and used regression/sensitivity analysis to assess emissions impacts. Recommended high-impact strategies including carbon pricing and renewable incentives. Tools: Excel, regression, analysis.
- Certifications: Lean Six Sigma Green Belt, Celonis Rising Star Business, Celonis Rising Star Technical Graphic, Machine Learning & Data Science with Python from PHN Technology, Python Certification Grade A from Wave Infotech.
- Contact: email sumanthgandla@gmail.com, phone +1 989-854-8386, LinkedIn https://www.linkedin.com/in/sumanth-gandla.
`;

const chatbotRoot = document.querySelector(".chatbot");
const chatbotLauncher = document.getElementById("chatbotLauncher");
const openChatNav = document.getElementById("openChatNav");
const chatbotClose = document.getElementById("chatbotClose");
const chatbotForm = document.getElementById("chatbotForm");
const chatbotInput = document.getElementById("chatbotInput");
const chatbotMessages = document.getElementById("chatbotMessages");
const chatbotNote = document.getElementById("chatbotNote");
const chatHistory = [];

function setChatOpen(isOpen) {
  chatbotRoot.classList.toggle("is-open", isOpen);
  chatbotLauncher.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) chatbotInput.focus();
}

function appendChatMessage(text, sender, extraClass = "") {
  const message = document.createElement("div");
  message.className = `chatbot__message chatbot__message--${sender} ${extraClass}`.trim();
  message.textContent = text;
  chatbotMessages.appendChild(message);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return message;
}

async function askPortfolioAssistant(question) {
  const response = await fetch(CHATBOT_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: PORTFOLIO_CONTEXT,
      messages: [...chatHistory, { role: "user", content: question }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat endpoint failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.answer;
}

async function handleChatSubmit(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;

  appendChatMessage(cleanQuestion, "user");
  chatbotInput.value = "";
  chatbotInput.disabled = true;
  const typing = appendChatMessage("Thinking through the portfolio...", "bot", "chatbot__message--typing");

  try {
    const answer = await askPortfolioAssistant(cleanQuestion);
    typing.textContent = answer || "The API returned an empty answer. Please try again.";
    chatbotNote.textContent = "Live AI answer generated from Sumanth's portfolio context.";
    chatHistory.push({ role: "user", content: cleanQuestion }, { role: "assistant", content: typing.textContent });
  } catch (error) {
    console.warn(error.message);
    typing.textContent = "I could not reach the OpenAI API. Check the browser console and server logs for the exact error.";
    chatbotNote.textContent = error.message;
  } finally {
    chatbotInput.disabled = false;
    chatbotInput.focus();
  }
}

chatbotLauncher.addEventListener("click", () => setChatOpen(!chatbotRoot.classList.contains("is-open")));
chatbotClose.addEventListener("click", () => setChatOpen(false));
openChatNav.addEventListener("click", () => {
  nav.classList.remove("is-open");
  setChatOpen(true);
});
chatbotForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleChatSubmit(chatbotInput.value);
});
document.querySelectorAll("[data-chat-prompt]").forEach((button) => {
  button.addEventListener("click", () => handleChatSubmit(button.dataset.chatPrompt));
});

// ===== Contact Form (simple demo) =====
function handleContact(event) {
  event.preventDefault();
  const note = document.getElementById("formNote");
  note.textContent = "Thanks! (Demo form) — connect this to Formspree / EmailJS when you’re ready.";
  event.target.reset();
  return false;
}
window.handleContact = handleContact;

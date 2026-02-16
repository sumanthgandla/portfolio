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

// ===== Contact Form (simple demo) =====
function handleContact(event) {
  event.preventDefault();
  const note = document.getElementById("formNote");
  note.textContent = "Thanks! (Demo form) — connect this to Formspree / EmailJS when you’re ready.";
  event.target.reset();
  return false;
}
window.handleContact = handleContact;

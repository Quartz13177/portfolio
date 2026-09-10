/* =========================================================
   포트폴리오 스크립트
   전체 구조는 딱 3단계입니다.
     1) state  : 화면이 지금 어떤 상태인지 담아두는 상자
     2) 이벤트 : 사용자가 뭔가 하면 state 값을 바꾼다
     3) render : state 를 보고 화면을 다시 그린다
   (React 의 state -> 렌더링 흐름을 순수 JS 로 흉내낸 것)
   ========================================================= */

/* ★ 본인 GitHub 아이디로 바꿔주세요 ★ */
const GITHUB_USERNAME = "Quartz10";

const SKILLS = ["HTML", "CSS", "JavaScript", "Git", "GitHub Pages", "VS Code"];

/* ---------------------------------------------------------
   1) 상태(state) : 이 앱이 기억해야 할 값 전부
   --------------------------------------------------------- */
const state = {
  theme: "light",          // "light" | "dark"
  menuOpen: false,         // 햄버거 메뉴가 열려 있는가
  projects: {
    status: "loading",     // "loading" | "success" | "error" | "empty"
    items: [],             // GitHub 저장소 목록
    filter: "all",         // 선택된 언어
  },
};

/* ---------------------------------------------------------
   2) 자주 쓰는 요소 미리 찾아두기 (querySelector)
   --------------------------------------------------------- */
const header = document.querySelector("#header");
const navMenu = document.querySelector("#navMenu");
const menuToggle = document.querySelector("#menuToggle");
const themeToggle = document.querySelector("#themeToggle");
const topBtn = document.querySelector("#topBtn");
const skillList = document.querySelector("#skillList");
const filters = document.querySelector("#filters");
const projectsArea = document.querySelector("#projectsArea");
const contactForm = document.querySelector("#contactForm");
const formSuccess = document.querySelector("#formSuccess");

/* =========================================================
   다크 모드 : 이벤트 -> state.theme 변경 -> 화면 갱신
   ========================================================= */
function renderTheme() {
  // html 태그의 data-theme 값만 바꾸면 CSS 변수가 통째로 교체된다
  document.documentElement.setAttribute("data-theme", state.theme);
  themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", state.theme); // 새로고침해도 유지
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  // 저장된 값이 있으면 그것을, 없으면 시스템(OS) 설정을 따른다
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  state.theme = saved || (prefersDark ? "dark" : "light");
  renderTheme();
}

themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark"; // 상태 변경
  renderTheme();                                           // 화면 갱신
});

/* =========================================================
   햄버거 메뉴 : 이벤트 -> state.menuOpen 변경 -> 화면 갱신
   ========================================================= */
function renderMenu() {
  navMenu.classList.toggle("active", state.menuOpen);
  menuToggle.textContent = state.menuOpen ? "✕" : "☰";
}

menuToggle.addEventListener("click", () => {
  state.menuOpen = !state.menuOpen;
  renderMenu();
});

/* =========================================================
   부드러운 스크롤 : 메뉴를 누르면 해당 섹션으로 이동 + 메뉴 닫기
   ========================================================= */
document.querySelectorAll('.nav-menu a, .hero-btns a, .logo').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();                       // a 태그 기본 이동을 막고
    const target = document.querySelector(link.getAttribute("href"));
    target.scrollIntoView({ behavior: "smooth" }); // 직접 부드럽게 이동
    state.menuOpen = false;
    renderMenu();
  });
});

/* =========================================================
   스크롤 상태 : 헤더 배경(60px) + 맨 위로 버튼(300px)
   ========================================================= */
const HEADER_OFFSET = 60;
const TOP_BTN_OFFSET = 300;

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > HEADER_OFFSET);
  topBtn.classList.toggle("show", y > TOP_BTN_OFFSET);
});

topBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================================================
   스크롤 애니메이션 : 화면에 20% 이상 보이면 나타나게
   ========================================================= */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // 한 번만 실행
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

/* =========================================================
   Skills : 배열을 forEach 로 돌면서 목록 만들기
   ========================================================= */
SKILLS.forEach((skill) => {
  const li = document.createElement("li");
  li.textContent = skill;
  skillList.appendChild(li);
});

/* =========================================================
   Projects : GitHub API (비동기) -> 상태 4가지 -> 렌더링
   ========================================================= */

// (1) 카드 하나를 HTML 문자열로 (템플릿 리터럴 + 구조분해 할당)
function cardHTML(repo) {
  const { name, description, html_url, language, stargazers_count } = repo;
  return `
    <article class="card">
      <h3>${name}</h3>
      <p>${description || "설명이 없는 저장소입니다."}</p>
      <div class="card-meta">
        <span>💻 ${language || "기타"}</span>
        <span>⭐ ${stargazers_count}</span>
      </div>
      <a href="${html_url}" target="_blank" rel="noopener">GitHub에서 보기 →</a>
    </article>
  `;
}

// (2) state.projects 만 보고 화면을 그린다
function renderProjects() {
  const { status, items, filter } = state.projects;

  if (status === "loading") {
    filters.innerHTML = "";
    projectsArea.innerHTML = `
      <div class="state-box"><div class="spinner"></div><p>로딩 중...</p></div>`;
    return;
  }

  if (status === "error") {
    filters.innerHTML = "";
    projectsArea.innerHTML = `
      <div class="state-box">
        <p>프로젝트를 불러올 수 없습니다.</p>
        <button class="btn btn-primary" id="retryBtn">다시 시도</button>
      </div>`;
    document.querySelector("#retryBtn").addEventListener("click", loadProjects);
    return;
  }

  if (status === "empty") {
    filters.innerHTML = "";
    projectsArea.innerHTML = `<div class="state-box"><p>표시할 프로젝트가 없습니다.</p></div>`;
    return;
  }

  // 성공 상태 : 필터 버튼 + 카드 목록
  const languages = ["all", ...new Set(items.map((repo) => repo.language || "기타"))];
  filters.innerHTML = languages
    .map(
      (lang) =>
        `<button class="filter-btn ${lang === filter ? "active" : ""}" data-lang="${lang}">
           ${lang === "all" ? "전체" : lang}
         </button>`
    )
    .join("");

  const shown =
    filter === "all"
      ? items
      : items.filter((repo) => (repo.language || "기타") === filter);

  projectsArea.innerHTML = `<div class="card-grid">${shown.map(cardHTML).join("")}</div>`;
}

// (3) 필터 버튼 클릭 -> state.filter 변경 -> 다시 렌더링
filters.addEventListener("click", (event) => {
  const btn = event.target.closest(".filter-btn");
  if (!btn) return;
  state.projects.filter = btn.dataset.lang;
  renderProjects();
});

// (4) 실제 데이터 요청
async function loadProjects() {
  state.projects.status = "loading";
  renderProjects();

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );
    if (!res.ok) throw new Error(`GitHub 응답 오류: ${res.status}`); // 403(레이트 리밋) 포함

    const repos = await res.json();
    state.projects.items = repos;
    state.projects.filter = "all";
    state.projects.status = repos.length === 0 ? "empty" : "success";
  } catch (error) {
    console.error(error);
    state.projects.status = "error";
  }

  renderProjects();
}

/* =========================================================
   Contact 폼 : 입력 -> 유효성 상태 -> 에러 메시지 표시/숨김
   ========================================================= */
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 필드 하나를 검사해서 에러 메시지를 보여주고, 통과 여부를 돌려준다
function validateField(id) {
  const input = document.querySelector(`#${id}`);
  const errorBox = document.querySelector(`#${id}Error`);
  const value = input.value.trim();
  let message = "";

  if (value === "") {
    message = "필수 입력 항목입니다.";
  } else if (id === "email" && !EMAIL_RULE.test(value)) {
    message = "이메일 형식이 올바르지 않습니다.";
  }

  errorBox.textContent = message;
  return message === "";
}

// 입력하는 동안에도 즉시 다시 검사 (input 이벤트)
["name", "email", "message"].forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("input", () => validateField(id));
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault(); // 페이지 새로고침 방지

  // 세 필드를 모두 검사 (&& 로 묶으면 앞이 실패할 때 뒤가 안 돌아가므로 배열로 검사)
  const results = ["name", "email", "message"].map(validateField);
  const isValid = results.every((ok) => ok);

  if (!isValid) {
    formSuccess.textContent = "";
    return;
  }

  formSuccess.textContent = "메시지가 정상적으로 전송되었습니다. 감사합니다!";
  contactForm.reset();
});

/* =========================================================
   시작
   ========================================================= */
initTheme();
renderMenu();
loadProjects();

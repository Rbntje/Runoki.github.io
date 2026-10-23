// Add one object per game. Keep its cover image and game files together in its folder.
const GAMES = [
  {
    id: "orbit-tap",
    title: "Orbit Tap",
    category: "Arcade",
    description: "Catch the moving dot and see how many you can tap before time runs out.",
    folder: "games/orbit-tap",
    image: "games/orbit-tap/cover.svg"
  }
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

const grid = document.querySelector("#game-grid");
if (grid) {
  const filterBar = document.querySelector("#category-list");
  const search = document.querySelector("#game-search");
  const stateKey = "runoki-list-state";
  let selectedCategory = "All";
  let savedState = null;
  try { savedState = JSON.parse(sessionStorage.getItem(stateKey) || "null"); } catch {}
  const categories = ["All", ...new Set(GAMES.map(game => game.category).filter(Boolean))];
  if (savedState && categories.includes(savedState.category)) selectedCategory = savedState.category;
  if (savedState && typeof savedState.query === "string") search.value = savedState.query;

  filterBar.innerHTML = categories.map(category =>
    `<button class="category-button" type="button" data-category="${escapeHTML(category)}" aria-pressed="${category === selectedCategory}">${escapeHTML(category)}</button>`
  ).join("");

  function renderGames() {
    const query = search.value.trim().toLowerCase();
    const visible = GAMES.filter(game =>
      (selectedCategory === "All" || game.category === selectedCategory) &&
      (game.title.toLowerCase().includes(query) || game.category.toLowerCase().includes(query))
    );
    grid.innerHTML = visible.length ? visible.map((game, index) => `
      <article class="game-card" style="animation-delay:${Math.min(index * 65, 400)}ms">
        <a class="card-link" href="game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${escapeHTML(game.title)}">
          <div class="game-art"><img src="${escapeHTML(game.image)}" alt="${escapeHTML(game.title)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="card-placeholder" hidden>${escapeHTML(game.title)}<br>Cover coming soon</div></div>
          <div class="card-meta"><h3 class="card-title">${escapeHTML(game.title)}</h3><p class="card-category">${escapeHTML(game.category)}</p></div>
        </a>
      </article>`).join("") : '<p class="empty-state">No games found. Try another search, or give up and go outside.</p>';
  }
  function saveListState() {
    try {
      sessionStorage.setItem(stateKey, JSON.stringify({ category: selectedCategory, query: search.value, scrollY: window.scrollY }));
    } catch {}
  }
  filterBar.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    filterBar.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderGames();
  });
  search.addEventListener("input", renderGames);
  grid.addEventListener("click", event => {
    if (event.target.closest("a.card-link")) saveListState();
  });
  renderGames();
  if (savedState && Number.isFinite(savedState.scrollY)) {
    requestAnimationFrame(() => window.scrollTo(0, savedState.scrollY));
    try { sessionStorage.removeItem(stateKey); } catch {}
  }
}

const title = document.querySelector("#detail-title");
if (title) {
  const id = new URLSearchParams(location.search).get("id");
  const game = GAMES.find(item => item.id === id);
  const player = document.querySelector("#game-stage");
  const frame = document.querySelector("#game-frame");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  let fallbackFullscreen = false;

  const setFallbackFullscreen = enabled => {
    fallbackFullscreen = enabled;
    player.classList.toggle("is-fullscreen-fallback", enabled);
    document.body.classList.toggle("runoki-fullscreen", enabled);
    fullscreenButton.textContent = enabled ? "Exit fullscreen" : "Fullscreen";
  };
  const updateFullscreenLabel = () => {
    if (document.fullscreenElement) {
      fallbackFullscreen = false;
      player.classList.remove("is-fullscreen-fallback");
      document.body.classList.remove("runoki-fullscreen");
      fullscreenButton.textContent = "Exit fullscreen";
    } else if (!fallbackFullscreen) fullscreenButton.textContent = "Fullscreen";
  };

  if (!game) {
    title.textContent = "Game not found";
    document.querySelector("#detail-description").textContent = "That game wandered off. Head back to the list and pick another.";
    document.querySelector("#play-button").hidden = true;
    document.querySelector("#stage-play").hidden = true;
  } else {
    document.title = `${game.title} — Runoki`;
    title.textContent = game.title;
    document.querySelector("#bar-title").textContent = game.title;
    document.querySelector("#detail-description").textContent = game.description;
    document.querySelector("#detail-tag").textContent = game.category;
    const begin = () => {
      if (!player.classList.contains("is-playing")) {
        frame.src = `${game.folder}/index.html`;
        frame.title = game.title;
        player.classList.add("is-playing");
      }
    };
    document.querySelector("#play-button").addEventListener("click", begin);
    document.querySelector("#stage-play").addEventListener("click", begin);
    fullscreenButton.addEventListener("click", async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (fallbackFullscreen) {
        setFallbackFullscreen(false);
        return;
      }
      begin();
      try {
        if (!player.requestFullscreen) throw new Error("Fullscreen is unavailable");
        await player.requestFullscreen();
      } catch { setFallbackFullscreen(true); }
    });
    document.addEventListener("fullscreenchange", updateFullscreenLabel);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && fallbackFullscreen) setFallbackFullscreen(false);
    });
    document.querySelectorAll("[data-return-link]").forEach(link => {
      link.addEventListener("click", event => {
        try {
          const previous = new URL(document.referrer);
          if (previous.origin === location.origin && previous.pathname.endsWith("/index.html")) {
            event.preventDefault();
            history.back();
          }
        } catch {}
      });
    });
    window.addEventListener("pagehide", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setFallbackFullscreen(false);
    });
  }
}
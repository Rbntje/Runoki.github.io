// Add one object per game. Its cover appears in both the game list and the moving homepage ribbons.
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

// The three homepage ribbons are generated from GAMES, so adding a game adds it here too.
function buildRibbon(id, reverse = false) {
  const track = document.querySelector(id);
  if (!track || !GAMES.length) return;
  const repeats = Math.max(1, Math.ceil((window.innerWidth * 1.25) / (GAMES.length * 225)));
  const segment = () => `<div class="marquee-segment">${Array.from({ length: repeats }, () => GAMES.map(game =>
    `<div class="marquee-tile"><img src="${escapeHTML(game.image)}" alt="" loading="lazy"><span>${escapeHTML(game.title)}</span></div>`
  ).join("")).join("")}</div>`;
  track.innerHTML = segment() + segment();
  if (reverse) track.dataset.direction = "reverse";
}
buildRibbon("#marquee-top");
buildRibbon("#marquee-middle", true);
buildRibbon("#marquee-bottom");

const grid = document.querySelector("#game-grid");
if (grid) {
  const filterBar = document.querySelector("#category-list");
  const search = document.querySelector("#game-search");
  let selectedCategory = "All";
  const categories = ["All", ...new Set(GAMES.map(game => game.category).filter(Boolean))];

  filterBar.innerHTML = categories.map(category =>
    `<button class="category-button" type="button" data-category="${escapeHTML(category)}" aria-pressed="${category === selectedCategory}">${escapeHTML(category)}</button>`
  ).join("");

  function visibleGames() {
    const query = search.value.trim().toLowerCase();
    return GAMES.filter(game =>
      (selectedCategory === "All" || game.category === selectedCategory) &&
      (game.title.toLowerCase().includes(query) || game.category.toLowerCase().includes(query))
    );
  }
  function renderGames() {
    const visible = visibleGames();
    document.querySelector("#surprise-button").disabled = visible.length === 0;
    grid.innerHTML = visible.length ? visible.map((game, index) => `
      <article class="game-card" style="--card-delay:${Math.min(index * 75, 450)}ms">
        <a class="card-link" href="game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${escapeHTML(game.title)}">
          <div class="game-art"><img src="${escapeHTML(game.image)}" alt="${escapeHTML(game.title)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="card-placeholder" hidden>${escapeHTML(game.title)}<br>Cover coming soon</div></div>
          <div class="card-meta"><h3 class="card-title">${escapeHTML(game.title)}</h3><p class="card-category">${escapeHTML(game.category)}</p></div>
        </a>
      </article>`).join("") : '<p class="empty-state">No games found. Try another search, or give up and go outside.</p>';
  }
  filterBar.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    filterBar.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderGames();
  });
  search.addEventListener("input", renderGames);
  document.querySelector("#surprise-button").addEventListener("click", () => {
    const choices = visibleGames();
    if (!choices.length) return;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    location.href = "game.html?id=" + encodeURIComponent(pick.id);
  });
  renderGames();
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
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (fallbackFullscreen) { setFallbackFullscreen(false); return; }
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
    window.addEventListener("pagehide", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setFallbackFullscreen(false);
    });
  }
}
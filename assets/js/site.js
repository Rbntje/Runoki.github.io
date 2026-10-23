// Add one object per game. Put its cover image and game files inside its folder.
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
  let selectedCategory = "All";

  const categories = ["All", ...new Set(GAMES.map(game => game.category).filter(Boolean))];
  filterBar.innerHTML = categories.map(category =>
    `<button class="category-button" type="button" data-category="${escapeHTML(category)}" aria-pressed="${category === "All"}">${escapeHTML(category)}</button>`
  ).join("");

  function renderGames() {
    const query = (search.value || "").trim().toLowerCase();
    const visible = GAMES.filter(game =>
      (selectedCategory === "All" || game.category === selectedCategory) &&
      (game.title.toLowerCase().includes(query) || game.category.toLowerCase().includes(query))
    );
    grid.innerHTML = visible.length ? visible.map(game => `
      <article class="game-card">
        <a class="card-link" href="game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${escapeHTML(game.title)}">
          <div class="game-art"><img src="${escapeHTML(game.image)}" alt="${escapeHTML(game.title)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="card-placeholder" hidden>${escapeHTML(game.title)}</div></div>
          <div class="card-meta"><h3 class="card-title">${escapeHTML(game.title)}</h3><p class="card-category">${escapeHTML(game.category)}</p></div>
        </a>
      </article>`).join("") : '<p class="empty-state">No games here yet.</p>';
    document.querySelector("#game-count").textContent = visible.length;
  }
  filterBar.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    filterBar.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderGames();
  });
  search.addEventListener("input", renderGames);
  renderGames();
}

const title = document.querySelector("#detail-title");
if (title) {
  const id = new URLSearchParams(location.search).get("id");
  const game = GAMES.find(item => item.id === id);
  const player = document.querySelector("#game-stage");
  const frame = document.querySelector("#game-frame");
  const begin = () => {
    if (!game || player.classList.contains("is-playing")) return;
    frame.src = `${game.folder}/index.html`;
    frame.title = game.title;
    player.classList.add("is-playing");
  };
  if (!game) {
    title.textContent = "Game not found";
    document.querySelector("#detail-description").textContent = "Head back to all games and choose another one.";
    document.querySelector("#play-button").hidden = true;
    document.querySelector("#stage-play").hidden = true;
  } else {
    document.title = `${game.title} — Runoki`;
    title.textContent = game.title;
    document.querySelector("#bar-title").textContent = game.title + " — Runoki";
    document.querySelector("#detail-description").textContent = game.description;
    document.querySelector("#detail-tag").textContent = game.category;
    document.querySelector("#play-button").addEventListener("click", begin);
    document.querySelector("#stage-play").addEventListener("click", begin);
    document.querySelector("#fullscreen-button").addEventListener("click", async () => {
      if (!player.classList.contains("is-playing")) begin();
      try {
        if (!document.fullscreenElement) await player.requestFullscreen();
        else await document.exitFullscreen();
      } catch { player.classList.toggle("is-fullscreen-fallback"); }
    });
  }
}
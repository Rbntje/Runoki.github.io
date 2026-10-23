const GAMES = [
  { id: "orbit-tap", title: "Orbit Tap", category: "Arcade", description: "A tiny timing game. Catch the moving dot and see how long you can keep your streak alive.", folder: "games/orbit-tap", art: "art-aqua", symbol: "O", stamp: "01 / ARCADE" }
];

function cardMarkup(game, index) {
  return `<article class="game-card" style="animation-delay:${index * 90}ms">
    <a class="card-link" href="game.html?id=${encodeURIComponent(game.id)}" aria-label="View ${escapeHTML(game.title)}">
      <div class="game-art ${escapeHTML(game.art || "art-aqua")}">
        <span class="art-orbit"></span><span class="art-shape">${escapeHTML(game.symbol || "✳")}</span>
        <span class="art-stamp">${escapeHTML(game.stamp || "RUNOKI GAME")}</span>
      </div>
      <div class="card-meta"><div><h3 class="card-title">${escapeHTML(game.title)}</h3><p class="card-category">${escapeHTML(game.category)}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div>
    </a>
  </article>`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

const grid = document.querySelector("#game-grid");
if (grid) {
  document.querySelector("#game-count").textContent = String(GAMES.length).padStart(2, "0");
  grid.innerHTML = GAMES.length ? GAMES.map(cardMarkup).join("") : '<p class="empty-state">New games are on the way. Check back soon.</p>';
}

const title = document.querySelector("#detail-title");
if (title) {
  const id = new URLSearchParams(location.search).get("id");
  const game = GAMES.find(item => item.id === id);
  const player = document.querySelector("#game-stage");
  const frame = document.querySelector("#game-frame");
  const begin = () => {
    if (!game) return;
    frame.src = `${game.folder}/index.html`;
    frame.title = game.title;
    player.classList.add("is-playing");
  };
  if (!game) {
    title.textContent = "Game not found";
    document.querySelector("#detail-description").textContent = "This game link may be old. Head back to the collection to find something else.";
    document.querySelector("#play-button").hidden = true;
    document.querySelector("#stage-play").hidden = true;
  } else {
    document.title = `${game.title} — Runoki`;
    title.textContent = game.title;
    document.querySelector("#bar-title").textContent = game.title + " · Runoki";
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
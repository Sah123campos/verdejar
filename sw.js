// Service worker: guarda os arquivos para o jogo abrir sem internet.
// Estratégia "rede primeiro": sempre tenta a versão mais nova e usa o cache se estiver offline.
const CACHE = "verdejar-v1";
const ARQUIVOS = [
  "./", "index.html", "css/estilo.css", "manifest.webmanifest", "assets/icone.svg", "assets/fontes/PixelifySans.woff2",
  "src/main.js", "src/jogo.js", "src/mundo.js", "src/personagem.js", "src/pixel.js", "src/editor.js",
  "src/entrada.js", "src/audio.js", "src/telacheia.js", "src/triagem.js", "src/ui.js", "src/salvar.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});

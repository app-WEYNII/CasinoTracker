# Casino Tracker

PWA légère (vanilla JS, IndexedDB via Dexie.js) pour tracker tes sessions de casino : slots, blackjack, bonus hunt, et statistiques de bankroll.

> 🟢 **Statut :** PWA installable, fonctionne hors-ligne après la première visite.

---

## 📁 Structure

```
casino-tracker/
├── index.html              # App complète (HTML + CSS + JS inline)
├── manifest.json           # Manifeste PWA
├── sw.js                   # Service worker (cache v1)
├── .nojekyll               # Désactive Jekyll sur GitHub Pages
├── README.md
└── icons/
    ├── favicon.ico
    ├── favicon-16.png
    ├── favicon-32.png
    ├── apple-touch-icon-120.png
    ├── apple-touch-icon-152.png
    ├── apple-touch-icon-167.png
    ├── apple-touch-icon-180.png
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-192-maskable.png
    └── icon-512-maskable.png
```

---

## 🚀 Déploiement sur GitHub Pages

1. Crée un repo (ex. `casino-tracker`) dans l'organisation `app-WEYNII`.
2. Pousse tous les fichiers à la racine du repo :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/app-WEYNII/casino-tracker.git
   git push -u origin main
   ```
3. Dans **Settings → Pages**, choisis :
   - Source : `Deploy from a branch`
   - Branch : `main` / `/ (root)`
4. L'app sera accessible sous `https://app-weynii.github.io/casino-tracker/`.

---

## 🔄 Mise à jour de l'app

Quand tu modifies `index.html` (ou n'importe quel asset mis en cache), **bump la version du cache** dans `sw.js` :

```js
const CACHE_VERSION = 'v2';  // ← incrémenter ici
```

Sans ce bump, les anciens fichiers servis par le service worker resteront en place chez tes utilisateurs jusqu'à expiration.

L'`index.html` détecte automatiquement les nouvelles versions du SW et active la nouvelle version au prochain chargement de page. Pour forcer un rechargement immédiat, décommente les lignes correspondantes en bas de `index.html`.

---

## 📱 Installation

- **iOS Safari :** bouton Partager → *Sur l'écran d'accueil*.
- **Android Chrome :** bannière auto, ou menu → *Installer l'application*.
- **Desktop Chrome/Edge :** icône d'installation dans la barre d'URL.

---

## 🧪 Test local

Le service worker exige un contexte sécurisé. Pour tester localement :

```bash
# Python (déjà installé sur la plupart des systèmes)
python3 -m http.server 8000
# Puis ouvre http://localhost:8000
```

`localhost` est traité comme un origine sécurisée par les navigateurs, donc le SW se registre normalement.

---

## 🛠️ Stack

- HTML/CSS/JS vanilla, **aucun build step**
- [Dexie.js](https://dexie.org/) 3.2.7 (chargé depuis CDN) pour la couche IndexedDB
- SVG inline pour les graphes (pas de Chart.js)
- Service worker natif pour le cache offline

# Anime Team Sidebar

A narrow club hub for the **Anime Team** Chess.com club. It has no build step and no server code, and all data is pulled live from the public Chess.com and AniList APIs.

## Files

| File         | What it's for                                      | Edit it?          |
|--------------|----------------------------------------------------|-------------------|
| `config.js`  | Discord/Instagram links, club links, leader titles | Yes               |
| `themes.js`  | Monthly anime themes + schedule                    | Yes, every month  |
| `index.html` | Page layout                                        | Rarely            |
| `style.css`  | Look and layout (colors come from the theme)       | Rarely            |
| `app.js`     | Loads all the live data                            | No need           |

## Monthly theme change (about 5 minutes)

1. Find the anime on anilist.co. The number in the URL is its id (`anilist.co/anime/195539/...` → `195539`).
2. In `themes.js`, copy an existing theme block and give it a new key, e.g. `"frieren2"`.
3. Change `anime`, `anilistId`, `tagline`, the fonts and the `colors`. Leave `banner: ""` to use the official AniList banner automatically, or paste any image URL.
4. Preview it before the month starts: open `index.html?theme=frieren2`.
5. Add it to the schedule:
   ```js
   window.SCHEDULE = {
     "2026-10": "edgerunners2",
     "2026-11": "frieren2",
   };
   ```
   The site switches automatically on the 1st. You can schedule several months ahead.

Theme options:
- `fontDisplay` / `fontBody`: any font name from fonts.google.com

Color tip: AniList shows each show's main color on its page, and that makes a good starting `accent`.

## Things to fill in

- **Discord**: the invite and server ID are in `config.js`. To also show the faces of who is online, turn on *Server Settings → Widget → Enable Server Widget* in Discord.
- **Leader titles**: Chess.com only reports "admin". Add special titles in `roles` in `config.js`.

## What updates by itself

Discord online count, member count, active members, average rating, the leadership list, matches and scores, newest members, the leaderboard (cached 12h per visitor) and trending anime.

## Previewing on your computer

Browsers block some features when you double-click an HTML file, so serve the folder instead. Any of these works from inside the folder:

```
npx serve .
```

## Publishing (when you're ready)

The easiest free option is **GitHub Pages** on your own account:
1. Create a GitHub account and a new public repository, e.g. `anime-team`.
2. Upload these files (*Add file → Upload files*).
3. Go to *Settings → Pages*, set *Source: Deploy from a branch*, choose `main` / root and save.
4. A minute later it's live at `https://<your-username>.github.io/anime-team/`.

After that, monthly changes are just editing `themes.js` on GitHub and clicking *Commit*.

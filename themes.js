// ============================================================
//  MONTHLY THEMES
//
//  To add next month's theme:
//    1. Copy one of the themes below, give it a new key, change the values.
//    2. Add a line to SCHEDULE:  "2026-11": "your-key",
//  That's it. On the 1st of the month the site switches automatically.
//
//  Preview any theme before its month by opening the page with
//    ?theme=your-key      e.g.  index.html?theme=bleach-tybw
//
//  Banner: leave `banner` as "" and set `anilistId` to use the show's
//  official AniList banner automatically. (The id is the number in the
//  AniList URL: anilist.co/anime/195539/...)
//
//  Tip for a calm look: pick soft, pastel-ish accents and a dark,
//  slightly tinted background rather than pure black.
// ============================================================

window.THEMES = {

  "edgerunners2": {
    anime: "Cyberpunk: Edgerunners 2",
    anilistId: 195539,
    banner: "",                    // "" = use AniList banner
    bannerPosition: "center 30%",
    tagline: "Relax, grab a coffee, play a few moves.",

    fontDisplay: "Nunito",         // any Google Font name
    fontBody: "Nunito",

    colors: {
      bg:       "#14141f",
      surface:  "#1d1d2c",
      surface2: "#272739",
      border:   "#30304a",
      text:     "#eeeef8",
      muted:    "#a3a3c2",
      accent:   "#b4a7ff",         // main highlight (soft lavender)
      accent2:  "#ffc9a8",         // secondary highlight (peach)
      win:      "#9ad9c9",
      loss:     "#f0b3c3",
      draw:     "#8e8eae",
    },
  },

  "bleach-tybw": {
    anime: "BLEACH: Thousand-Year Blood War",
    anilistId: 185874,
    banner: "",
    bannerPosition: "center 25%",
    tagline: "Bankai your opponents.",

    fontDisplay: "Nunito",
    fontBody: "Nunito",

    colors: {
      bg:       "#131418",
      surface:  "#1c1d23",
      surface2: "#26272f",
      border:   "#30313b",
      text:     "#f1f1f4",
      muted:    "#a0a1ad",
      accent:   "#f2a65a",
      accent2:  "#f4f4f6",
      win:      "#9ad9c9",
      loss:     "#f0b3b3",
      draw:     "#8d8e9a",
    },
  },

};

// Which theme to show each month ("YYYY-MM": "theme-key").
// If the current month isn't listed, the most recent earlier entry is used.
window.SCHEDULE = {
  "2026-10": "edgerunners2",
};

// ============================================================
//  CLUB SETTINGS — edit this file to change links and roles.
//  (Themes live in themes.js.)
// ============================================================

window.CLUB_CONFIG = {
  // The part after chess.com/club/ in your club's URL
  clubId: "anime-team-3",
  clubName: "Anime Team",

  // Community links. Leave a url as "" to hide that button.
  discordUrl: "https://discord.gg/XqaCsmYuV3",   // use a non-expiring invite
  discordServerId: "1526023845272621116",
  // Optional: turn on Server Settings → Widget in Discord to also show
  // the faces of who's online right now.
  instagramUrl: "https://www.instagram.com/animeteam.cc/",
  instagramHandle: "@animeteam.cc",

  // Extra buttons on the "More" tab
  links: [
    { label: "Club Home",     url: "https://www.chess.com/club/anime-team-3" },
    { label: "Club Matches",  url: "https://www.chess.com/club/matches/anime-team-3" },
    { label: "Club Events",   url: "https://www.chess.com/club/events/anime-team-3" },
    { label: "Forums",        url: "https://www.chess.com/clubs/forum/anime-team-3" },
  ],

  // The leadership list is pulled LIVE from Chess.com's admin list, so it
  // never goes stale. Chess.com only says "admin", so give special titles here
  // (lowercase usernames). Anyone not listed shows as "Admin".
  // Listed people are shown first, in this order.
  roles: {
    "crayon": "Owner",
    "dannyboy_guling": "Co-Owner",
  },

  // Leaderboard: how many of this week's active members to scan for ratings.
  // Results are cached in each visitor's browser for 12 hours.
  leaderboardScanLimit: 300,
};

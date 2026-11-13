// Public contact details shown on the website. Change them here once and
// every page (footer, support, contact, privacy, licence) follows.
export const SUPPORT_EMAIL = 'melaninentertainment255@gmail.com';
export const SITE_NAME = 'BLACK-XPACE';
export const SITE_LOCATION = 'Dar es Salaam, Tanzania';
// Date shown as "Last updated" on the Privacy and Licence pages.
export const POLICIES_UPDATED = '9 November 2026';
// YouTube tutorial shown in the homepage Featured Release. Paste the video id
// (the part after "v=" in the link); leave it empty to show "coming soon".
export const FEATURED_VIDEO = { id: 'YEorsfZe4vU', title: 'How to use MLAM Voice MIDI' }; // test video; will move to the admin panel

// Songs shown on the homepage "From our plugins to your playlist" wall. Add
// only real tracks whose artist and producer agreed to be shown. Square cover
// images go in public/ (for example /playlist/song-name.jpg). While the list
// is empty the wall shows plugin artwork and invites people to submit a song.
// song/artist/plugin are optional: a photo with no credits shows without a caption.
export type PlaylistTrack = { image: string; song?: string; artist?: string; producer?: string; plugin?: string; url?: string };
export const PLAYLIST_TRACKS: PlaylistTrack[] = [
  { image: "/playlist/photo-1.jpg" },
  { image: "/playlist/photo-2.jpg" },
  { image: "/playlist/photo-3.jpg" },
  { image: "/playlist/photo-4.jpg" },
  { image: "/playlist/photo-5.jpg" },
  { image: "/playlist/photo-6.jpg" },
  { image: "/playlist/photo-7.jpg" },
  { image: "/playlist/photo-8.jpg" },
  { image: "/playlist/photo-9.jpg" },
  { image: "/playlist/photo-10.jpg" },
  { image: "/playlist/photo-11.jpg" },
  { image: "/playlist/photo-12.jpg" },
  { image: "/playlist/photo-13.jpg" },
];

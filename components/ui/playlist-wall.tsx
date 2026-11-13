import type { PlaylistTrack } from "@/lib/site";

type Props = { tracks: PlaylistTrack[]; fallbackImages: string[] };

// "From our plugins to your playlist": a staggered wall of square covers in
// columns that scroll sideways like the DAW logo strip. Each tile shows the
// song, artist, producer and plugin used on hover, focus or tap. Until real
// tracks are added, the wall shows our own plugin artwork, so no artist or
// credit is ever invented.
const COLUMNS = 6;

export default function PlaylistWall({ tracks, fallbackImages }: Props) {
  const empty = tracks.length === 0;
  // Fill the wall to at least two tiles per column: real photos and tracks on
  // every other tile, plugin artwork in between, until there are enough.
  const minimum = COLUMNS * 2;
  const tiles: PlaylistTrack[] = [];
  let next = 0;
  for (let i = 0; tiles.length < Math.max(minimum, tracks.length); i++) {
    if (next < tracks.length && (i % 2 === 0 || tracks.length - next >= minimum - tiles.length)) tiles.push(tracks[next++]);
    else tiles.push({ image: fallbackImages[i % fallbackImages.length] });
  }
  const columns = Array.from({ length: COLUMNS }, (_, c) => tiles.filter((_, i) => i % COLUMNS === c));

  return (
    <div className={`pw-wrap${empty ? " is-empty" : ""}`}>
      <div className="pw-wall" aria-hidden={empty || undefined}>
        {/* The columns are rendered twice so the strip can loop without a gap. */}
        {[...columns, ...columns].map((column, c) => (
          <div className="pw-col" key={c} aria-hidden={c >= COLUMNS || undefined}>
            {column.map((tile, i) => {
              const track = tile.song || tile.artist ? tile : null;
              const caption = track && (
                <span className="pw-caption">
                  <span className="pw-song">{[track.song, track.artist].filter(Boolean).join(" – ")}</span>
                  {track.producer && <span className="pw-meta">Produced by {track.producer}</span>}
                  {track.plugin && <span className="pw-plugin">{track.plugin}</span>}
                </span>
              );
              const content = (
                <>
                  <img src={tile.image} alt={track ? [track.song, track.artist].filter(Boolean).join(" – ") : ""} width={300} height={300} loading="lazy" />
                  {caption}
                </>
              );
              if (tile.url) {
                return <a className="pw-tile" key={i} href={tile.url} target="_blank" rel="noopener noreferrer" tabIndex={c >= COLUMNS ? -1 : undefined}>{content}</a>;
              }
              return <div className="pw-tile" key={i} tabIndex={track && c < COLUMNS ? 0 : undefined}>{content}</div>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

type Glob = Record<string, string>;

/** Maps each file in a glob to its name without extension, e.g. ".../logos/FIS.png" -> "FIS". */
function byName(files: Glob): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''), url]),
  );
}

// Vite needs the glob options written inline.
export const logos = byName(import.meta.glob<string>('../assets/logos/*', { eager: true, import: 'default' }));
export const people = byName(import.meta.glob<string>('../assets/people/*', { eager: true, import: 'default' }));
export const schoolLogos = byName(import.meta.glob<string>('../assets/education/*', { eager: true, import: 'default' }));
export const charityImages = byName(import.meta.glob<string>('../assets/charity/*', { eager: true, import: 'default' }));

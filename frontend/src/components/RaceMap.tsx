import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { formatIsoDate } from '../content/dates';
import { groupByLocation } from '../content/raceLocations';
import type { RaceResult } from '../content/types';
import './RaceMap.css';

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!);

/**
 * A map of where the races were, one pin per town: bigger for towns with more races, and a click
 * lists them. OpenStreetMap tiles through Leaflet, so there is no API key. The results table below
 * has the same information for anyone who can't use the map.
 */
function RaceMap({ races }: { races: RaceResult[] }) {
  const container = useRef<HTMLDivElement>(null);
  const places = groupByLocation(races);

  useEffect(() => {
    if (!container.current || places.length === 0) return;
    // No scroll-wheel zoom, and no one-finger dragging on phones, so scrolling the page past the map
    // never gets caught by it. Pinch and the +/- buttons still zoom.
    const map = L.map(container.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const pins = places.map((place) => {
      const label = `${place.location}: ${place.races.length} ${place.races.length === 1 ? 'race' : 'races'}`;
      const pin = L.circleMarker([place.lat, place.lng], {
        radius: 7 + 2 * Math.min(place.races.length - 1, 4),
        className: 'race-pin',
      })
        .bindTooltip(escape(label))
        .bindPopup(
          `<strong>${escape(place.location)}</strong><ul class="race-pin-races">${place.races
            .map(
              (race) =>
                `<li>${escape(race.event)}<span class="race-pin-detail">${formatIsoDate(race.date)} · ${escape(race.time)}</span></li>`,
            )
            .join('')}</ul>`,
          // Small enough for a phone (a long list scrolls), and panned clear of the +/- buttons.
          { maxWidth: 230, maxHeight: 170, autoPanPaddingTopLeft: [56, 12] },
        )
        .addTo(map);
      return { pin, place };
    });
    map.fitBounds(L.latLngBounds(places.map(({ lat, lng }) => [lat, lng])), { padding: [28, 28] });
    // Pins are drawn once the map has a view, so label them (for tests and inspection) after it does.
    for (const { pin, place } of pins) pin.getElement()?.setAttribute('data-location', place.location);

    return () => {
      map.remove();
    };
    // Rebuild only when the race list itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [races]);

  if (places.length === 0) return null;
  return (
    <div
      ref={container}
      className="race-map"
      role="region"
      aria-label={`Map of race locations: ${places.length} ${places.length === 1 ? 'place' : 'places'}`}
    />
  );
}

export default RaceMap;

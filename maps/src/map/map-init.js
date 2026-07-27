import L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm';
import maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.18.0/+esm';
import { state, updateState } from '../core/state.js';
import { markerIcons } from '../core/marker-icons.js';
import { findBestInsertIndex } from '../core/utils.js';
import { updateRouteGeometry, syncRouteMarkers } from './route-manager.js';
import { generateMapLibreStyle } from './artistic-style.js';
import { clearMarkers } from './marker-manager.js';

let map = null;
let tileLayer = null;
let artisticMap = null;
let currentArtisticThemeName = null;
let isSyncing = false;
let styleChangeInProgress = false;
let pendingArtisticStyle = null;
let pendingArtisticThemeName = null;

export const getMap = () => map;
export const getArtisticMap = () => artisticMap;

export function initMap(containerId, initialCenter, initialZoom, initialTileUrl) {
	map = L.map(containerId, {
		zoomControl: false,
		attributionControl: false,
		scrollWheelZoom: 'center',
		touchZoom: 'center'
	}).setView(initialCenter, initialZoom);

	tileLayer = L.tileLayer(initialTileUrl, {
		maxZoom: 19,
		crossOrigin: true,
	}).addTo(map);

	map.on('moveend', () => {
		if (isSyncing) return;
		isSyncing = true;

		const center = map.getCenter();
		const zoom = map.getZoom();
		updateState({
			lat: center.lat,
			lon: center.lng,
			zoom: zoom
		});

		if (artisticMap) {
			artisticMap.jumpTo({
				center: [center.lng, center.lat],
				zoom: zoom - 1,
				bearing: state.bearing || 0,
				pitch: state.pitch || 0
			});
		}

		isSyncing = false;
	});

	try {
		initArtisticMap('artistic-map', [initialCenter[1], initialCenter[0]], initialZoom - 1);
	} catch (err) {
		console.error('Failed to initialize artistic map (MapLibre GL):', err);
	}

	if (state.showRoute) {
		updateRouteGeometry();
	}

	return map;
}

function initArtisticMap(containerId, center, zoom) {
	artisticMap = new maplibregl.Map({
		container: containerId,
		style: { version: 8, sources: {}, layers: [] },
		center: center,
		zoom: zoom,
		bearing: state.bearing || 0,
		pitch: state.pitch || 0,
		interactive: true,
		attributionControl: false,
		preserveDrawingBuffer: true
	});

	artisticMap.scrollZoom.setWheelZoomRate(1);
	artisticMap.scrollZoom.setZoomRate(1 / 600);

	artisticMap.on('style.load', () => {
		if (pendingArtisticStyle) {
			const next = pendingArtisticStyle;
			const nextName = pendingArtisticThemeName;
			pendingArtisticStyle = null;
			pendingArtisticThemeName = null;
			currentArtisticThemeName = nextName;
			artisticMap.setStyle(next);
		} else {
			styleChangeInProgress = false;
			setTimeout(() => updateArtisticLayerSettings(state), 0);
		}
	});

	artisticMap.on('moveend', () => {
		if (isSyncing) return;
		isSyncing = true;

		const center = artisticMap.getCenter();
		const zoom = artisticMap.getZoom();

		updateState({
			lat: center.lat,
			lon: center.lng,
			zoom: zoom + 1,
			bearing: artisticMap.getBearing(),
			pitch: artisticMap.getPitch()
		});

		if (map) {
			map.setView([center.lat, center.lng], zoom + 1, { animate: false });
		}

		isSyncing = false;
	});

	artisticMap.on('mousedown', 'route-line', (e) => {
		e.preventDefault();
		const startPos = e.point;
		let pointAdded = false;
		let index = -1;

		isSyncing = true;
		artisticMap.dragPan.disable();

		const onMouseMove = (me) => {
			const currentPos = me.point;
			const dist = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));

			if (!pointAdded && dist > 5) {
				const via = [...(state.routeViaPoints || [])];
				const routePoints = [
					{ lat: state.routeStartLat, lon: state.routeStartLon },
					...via,
					{ lat: state.routeEndLat, lon: state.routeEndLon }
				];
				index = findBestInsertIndex(me.lngLat.lat, me.lngLat.lng, routePoints);
				via.splice(index, 0, { lat: me.lngLat.lat, lon: me.lngLat.lng });
				updateState({ routeViaPoints: via });
				pointAdded = true;
			}

			if (pointAdded && index !== -1) {
				const v = [...state.routeViaPoints];
				v[index] = { lat: me.lngLat.lat, lon: me.lngLat.lng };
				updateState({ routeViaPoints: v });
				syncRouteMarkers(false);
			}
		};

		const onMouseUp = () => {
			artisticMap.off('mousemove', onMouseMove);
			artisticMap.off('mouseup', onMouseUp);
			artisticMap.dragPan.enable();
			isSyncing = false;
			if (pointAdded) {
				updateRouteGeometry();
			}
		};

		artisticMap.on('mousemove', onMouseMove);
		artisticMap.on('mouseup', onMouseUp);
	});

	artisticMap.on('mouseenter', 'route-line', () => {
		artisticMap.getCanvas().style.cursor = 'crosshair';
	});

	artisticMap.on('mouseleave', 'route-line', () => {
		artisticMap.getCanvas().style.cursor = '';
	});
}

export function updateArtisticStyle(theme) {
	if (!artisticMap) return;
	if (currentArtisticThemeName === theme.name) return;

	currentArtisticThemeName = theme.name;
	const style = generateMapLibreStyle(theme);

	if (styleChangeInProgress) {
		pendingArtisticStyle = style;
		pendingArtisticThemeName = theme.name;
		try { artisticMap.setStyle(style); } catch (e) { }
		return;
	}

	styleChangeInProgress = true;
	try {
		artisticMap.setStyle(style);
	} catch (e) {
		pendingArtisticStyle = style;
		pendingArtisticThemeName = theme.name;
	}
}

export function updateMapPosition(lat, lon, zoom, options = { animate: true }) {
	if (map) {
		if (lat !== undefined && lon !== undefined) {
			map.setView([lat, lon], zoom ?? map.getZoom(), options);
		} else if (zoom !== undefined) {
			map.setZoom(zoom, options);
		}
	}
	if (artisticMap) {
		const center = (lat !== undefined && lon !== undefined) ? [lon, lat] : artisticMap.getCenter();
		artisticMap.jumpTo({
			center,
			zoom: zoom !== undefined ? zoom - 1 : artisticMap.getZoom(),
			bearing: state.bearing || 0,
			pitch: state.pitch || 0
		});
	}
}

export function updateMapCamera({ lat, lon, zoom, bearing, pitch } = {}) {
	const nextLat = lat ?? state.lat;
	const nextLon = lon ?? state.lon;
	const nextZoom = zoom ?? state.zoom;
	const nextBearing = bearing ?? state.bearing ?? 0;
	const nextPitch = pitch ?? state.pitch ?? 0;

	if (map) map.setView([nextLat, nextLon], nextZoom, { animate: false });
	if (artisticMap) {
		artisticMap.jumpTo({
			center: [nextLon, nextLat],
			zoom: nextZoom - 1,
			bearing: nextBearing,
			pitch: nextPitch
		});
	}
}

export function fitMapBounds(bounds) {
	if (!bounds) return;
	const south = Number(bounds.south);
	const north = Number(bounds.north);
	const west = Number(bounds.west);
	const east = Number(bounds.east);
	if (![south, north, west, east].every(Number.isFinite)) return;

	if (map) map.fitBounds([[south, west], [north, east]], { padding: [32, 32], animate: true });
	if (artisticMap) {
		artisticMap.fitBounds([[west, south], [east, north]], {
			padding: 48,
			duration: 500,
			bearing: state.bearing || 0,
			pitch: state.pitch || 0
		});
	}
}

export function updateArtisticLayerSettings(currentState = state) {
	if (!artisticMap || !artisticMap.isStyleLoaded()) return;
	const setLayout = (id, visible) => {
		try { if (artisticMap.getLayer(id)) artisticMap.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'); } catch (e) { }
	};
	const setPaint = (id, prop, value) => {
		try { if (artisticMap.getLayer(id)) artisticMap.setPaintProperty(id, prop, value); } catch (e) { }
	};

	['road-default', 'road-residential', 'road-tertiary', 'road-secondary', 'road-primary', 'road-motorway'].forEach(id => setLayout(id, currentState.showRoads !== false));
	setLayout('buildings', currentState.showBuildings !== false);
	setLayout('water', currentState.showWater !== false);
	setLayout('park', currentState.showParks !== false);
	setLayout('terrain', currentState.showTerrain !== false);
	setLayout('rail', currentState.showRail !== false);
	setLayout('boundaries', currentState.showBoundaries !== false);

	const weight = Number(currentState.roadWeight || 1);
	setPaint('road-default', 'line-width', 0.5 * weight);
	setPaint('road-residential', 'line-width', 0.6 * weight);
	setPaint('road-tertiary', 'line-width', 0.9 * weight);
	setPaint('road-secondary', 'line-width', 1.15 * weight);
	setPaint('road-primary', 'line-width', 1.65 * weight);
	setPaint('road-motorway', 'line-width', 2.2 * weight);
	setPaint('buildings', 'fill-opacity', Number(currentState.buildingOpacity ?? 0.9));
	setPaint('terrain', 'fill-opacity', Number(currentState.terrainOpacity ?? 0.82));
	setPaint('park', 'fill-opacity', Number(currentState.terrainOpacity ?? 0.82));
}

export function updateMapTheme(tileUrl) {
	if (tileLayer) {
		tileLayer.setUrl(tileUrl);
	}
}

export function waitForTilesLoad(timeout = 30000) {
	return new Promise((resolve) => {
		if (!map || !tileLayer) return resolve();
		try {
			if (tileLayer._tiles) {
				const tiles = Object.values(tileLayer._tiles || {});
				const anyLoading = tiles.some(t => {
					const el = t.el || t.tile || (t._el);
					return el && el.complete === false;
				});
				if (!anyLoading) return resolve();
			}
		} catch (e) { }

		let resolved = false;
		const onLoad = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
		tileLayer.once('load', onLoad);
		const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, timeout);
	});
}

export function waitForArtisticIdle(timeout = 30000) {
	return new Promise((resolve) => {
		if (!artisticMap) return resolve();
		let resolved = false;
		const onIdle = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
		try { artisticMap.once('idle', onIdle); } catch (e) { resolve(); return; }
		const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, timeout);
	});
}

export function getMapInstance() { return map; }
export function getArtisticMapInstance() { return artisticMap; }

export function invalidateMapSize() {
	if (map) map.invalidateSize({ animate: false });
	if (artisticMap) artisticMap.resize();
}

export { updateRouteStyles, syncRouteMarkers, updateRouteGeometry } from './route-manager.js';
export { updateMarkerStyles, updateMarkerIcon, updateMarkerSize, updateMarkerVisibility, updateMarkerPosition } from './marker-manager.js';


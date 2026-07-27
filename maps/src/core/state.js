import { themes } from './themes.js';
import { artisticThemes } from './artistic-themes.js';
import { loadCustomThemes } from './custom-themes.js';

let observers = [];

const STORAGE_KEY = 'map-to-poster:settings';

export const defaultState = {
	city: "PODGORICA",
	cityOverride: "",
	country: "MONTENEGRO",
	countryOverride: "",
	cityFont: "'Playfair Display', serif",
	countryFont: "'Outfit', sans-serif",
	coordsFont: "'Outfit', sans-serif",
	lat: 42.4304,
	lon: 19.2594,
	zoom: 13,
	bearing: 0,
	pitch: 0,
	searchBounds: null,
	theme: "minimal",
	width: 1800,
	height: 2400,
	isExporting: false,
	overlayBgType: 'vignette',
	overlaySize: 'medium',
	showLabels: true,
	showRoads: true,
	showBuildings: true,
	showWater: true,
	showParks: true,
	showTerrain: true,
	showRail: true,
	showBoundaries: true,
	roadWeight: 1.15,
	buildingOpacity: 0.9,
	terrainOpacity: 0.82,
	grainOpacity: 0.1,
	renderMode: 'tile',
	artisticTheme: 'studio_paper',
	matEnabled: false,
	matWidth: 40,
	matShowBorder: true,
	matBorderWidth: 1,
	matBorderOpacity: 1,
	showMarker: false,
	markers: [
		{ lat: 42.4304, lon: 19.2594 }
	],
	markerIcon: 'pin',
	markerSize: 1,
	showRoute: false,
	routeStartLat: 42.4304,
	routeStartLon: 19.2594,
	routeEndLat: 42.4380,
	routeEndLon: 19.2700,
	routeGeometry: [],
	routeViaPoints: [],
	overlayX: 0.5,
	overlayY: 0.85,
	showCountry: true,
	showCoords: true,
};

export const state = { ...defaultState };

const SAVED_KEYS = [
	'city',
	'cityOverride',
	'country',
	'countryOverride',
	'cityFont',
	'countryFont',
	'coordsFont',
	'lat',
	'lon',
	'zoom',
	'bearing',
	'pitch',
	'theme',
	'width',
	'height',
	'overlayBgType',
	'overlaySize',
	'showLabels',
	'showRoads',
	'showBuildings',
	'showWater',
	'showParks',
	'showTerrain',
	'showRail',
	'showBoundaries',
	'roadWeight',
	'buildingOpacity',
	'terrainOpacity',
	'grainOpacity',
	'renderMode',
	'artisticTheme',
	'matEnabled',
	'matWidth',
	'matShowBorder',
	'matBorderWidth',
	'matBorderOpacity',
	'showMarker',
	'markers',
	'markerIcon',
	'markerSize',
	'showRoute',
	'routeStartLat',
	'routeStartLon',
	'routeEndLat',
	'routeEndLon',
	'routeViaPoints',
	'overlayX',
	'overlayY',
	'showCountry',
	'showCoords'
];

function loadSettings() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return;
		const toApply = {};
		for (const k of SAVED_KEYS) {
			if (k in parsed) toApply[k] = parsed[k];
		}
		Object.assign(state, toApply);
	} catch (e) {
	}
}

function saveSettings() {
	try {
		const out = {};
		for (const k of SAVED_KEYS) {
			out[k] = state[k];
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
	} catch (e) {
	}
}

loadSettings();

export function updateState(partialState) {
	Object.assign(state, partialState);
	saveSettings();
	notifyObservers();
}

export function subscribe(callback) {
	observers.push(callback);
	callback(state);
}

function notifyObservers() {
	observers.forEach(callback => callback(state));
}

export function getSelectedTheme() {
	return themes[state.theme] || themes.standard || themes.minimal;
}

export function getSelectedArtisticTheme() {
	if (state.artisticTheme && state.artisticTheme.startsWith('custom_')) {
		const custom = loadCustomThemes();
		if (custom[state.artisticTheme]) return custom[state.artisticTheme];
	}
	return artisticThemes[state.artisticTheme] || artisticThemes.studio_paper;
}

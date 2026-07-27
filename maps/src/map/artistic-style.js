import { state } from '../core/state.js';

function visibility(enabled) {
	return enabled === false ? 'none' : 'visible';
}

export function generateMapLibreStyle(theme) {
	const weight = Number(state.roadWeight || 1);
	const terrainOpacity = Number(state.terrainOpacity ?? 0.82);
	const buildingOpacity = Number(state.buildingOpacity ?? 0.9);

	return {
		version: 8,
		name: theme.name,
		sources: {
			openfreemap: {
				type: 'vector',
				url: 'https://tiles.openfreemap.org/planet'
			},
			'route-source': {
				type: 'geojson',
				data: {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: [[state.routeStartLon, state.routeStartLat], [state.routeEndLon, state.routeEndLat]]
					}
				}
			}
		},
		layers: [
			{
				id: 'background',
				type: 'background',
				paint: { 'background-color': theme.bg }
			},
			{
				id: 'terrain',
				source: 'openfreemap',
				'source-layer': 'landcover',
				type: 'fill',
				layout: { visibility: visibility(state.showTerrain) },
				paint: {
					'fill-color': theme.terrain || theme.parks || theme.bg,
					'fill-opacity': terrainOpacity
				}
			},
			{
				id: 'park',
				source: 'openfreemap',
				'source-layer': 'park',
				type: 'fill',
				layout: { visibility: visibility(state.showParks) },
				paint: {
					'fill-color': theme.parks,
					'fill-opacity': terrainOpacity
				}
			},
			{
				id: 'water',
				source: 'openfreemap',
				'source-layer': 'water',
				type: 'fill',
				layout: { visibility: visibility(state.showWater) },
				paint: { 'fill-color': theme.water }
			},
			{
				id: 'boundaries',
				source: 'openfreemap',
				'source-layer': 'boundary',
				type: 'line',
				layout: { visibility: visibility(state.showBoundaries) },
				paint: {
					'line-color': theme.boundary || theme.road_default,
					'line-width': 0.7,
					'line-opacity': 0.75,
					'line-dasharray': [2, 2]
				}
			},
			{
				id: 'buildings',
				source: 'openfreemap',
				'source-layer': 'building',
				type: 'fill',
				minzoom: 12,
				layout: { visibility: visibility(state.showBuildings) },
				paint: {
					'fill-color': theme.building || theme.road_residential,
					'fill-opacity': buildingOpacity,
					'fill-outline-color': theme.road_default
				}
			},
			{
				id: 'rail',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['match', ['get', 'class'], ['rail', 'transit'], true, false],
				layout: { visibility: visibility(state.showRail) },
				paint: {
					'line-color': theme.rail || theme.road_secondary,
					'line-width': 0.9,
					'line-opacity': 0.8,
					'line-dasharray': [2, 1.5]
				}
			},
			{
				id: 'road-default',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['!', ['match', ['get', 'class'], ['motorway', 'primary', 'secondary', 'tertiary', 'residential', 'rail', 'transit'], true, false]],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_default, 'line-width': 0.5 * weight, 'line-opacity': 0.9 }
			},
			{
				id: 'road-residential',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'residential'],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_residential, 'line-width': 0.6 * weight, 'line-opacity': 0.92 }
			},
			{
				id: 'road-tertiary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'tertiary'],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_tertiary, 'line-width': 0.9 * weight, 'line-opacity': 0.95 }
			},
			{
				id: 'road-secondary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'secondary'],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_secondary, 'line-width': 1.15 * weight, 'line-opacity': 0.96 }
			},
			{
				id: 'road-primary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'primary'],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_primary, 'line-width': 1.65 * weight, 'line-opacity': 0.98 }
			},
			{
				id: 'road-motorway',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'motorway'],
				layout: { visibility: visibility(state.showRoads) },
				paint: { 'line-color': theme.road_motorway, 'line-width': 2.2 * weight, 'line-opacity': 1 }
			},
			{
				id: 'route-line-casing',
				source: 'route-source',
				type: 'line',
				layout: {
					'line-cap': 'round',
					'line-join': 'round',
					visibility: state.showRoute ? 'visible' : 'none'
				},
				paint: {
					'line-color': theme.bg || '#ffffff',
					'line-width': 9
				}
			},
			{
				id: 'route-line',
				source: 'route-source',
				type: 'line',
				layout: {
					'line-cap': 'round',
					'line-join': 'round',
					visibility: state.showRoute ? 'visible' : 'none'
				},
				paint: {
					'line-color': theme.route || '#F36A2E',
					'line-width': 4
				}
			}
		]
	};
}

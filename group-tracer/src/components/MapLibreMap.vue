<script setup lang="ts">
import maplibregl, { Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

interface IProps {
  markers?: [number, number][];
  attribution?: string;
  tileSize?: number;
  maxZoom?: number;
  maxPitch?: number;
  startLocation?: [number, number];
}

const props = withDefaults(defineProps<IProps>(), {
  markers: () => [],
  attribution: "&copy; Ojvar",
  tileSize: 256,
  maxZoom: 18,
  maxPitch: 85,
  startLocation: () => [50.006, 36.3128] as [number, number],
});

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
let markers: Marker[] = [];

onMounted(() => {
  if (!mapContainer.value) {
    return;
  }

  map = new maplibregl.Map({
    container: mapContainer.value,
    zoom: 7,
    center: props.startLocation,
    hash: true,
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: props.tileSize,
          attribution: props.attribution,
          maxzoom: 19,
        },
        // local-points to be added after load
      },
      layers: [
        { id: "osm", type: "raster", source: "osm" },
        // point layer added after load
      ],
      sky: {},
    },
    maxZoom: props.maxZoom,
    maxPitch: props.maxPitch,
  });

  map.on("load", async () => {
    if (!map) return;
    await updateGeoJsonSource(map);
    map.addLayer({
      id: "local-points-layer",
      type: "circle",
      source: "local-points",
      paint: {
        "circle-radius": 8,
        "circle-color": "#eb4034",
        "circle-opacity": 0.7,
      },
    });
  });

  map.on("moveend", async () => {
    if (!map) return;
    await updateGeoJsonSource(map);
  });

  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    })
  );

  // Initial markers
  updateMarkers();
});

const updateMarkers = () => {
  if (!map) {
    return;
  }
  markers.forEach((marker) => marker.remove());
  markers =
    props.markers?.map((marker) =>
      new maplibregl.Marker().setLngLat(marker).addTo(map as maplibregl.Map)
    ) ?? [];
};

// Watch for changes in markers prop
watch(() => props.markers, updateMarkers, { deep: true });

onBeforeUnmount(() => {
  // Remove all markers
  markers.forEach((marker) => marker.remove());
  markers = [];
  map?.remove();
});

async function updateGeoJsonSource(m: maplibregl.Map | null) {
  if (!m) return;
  // get map center tile (rough approach)
  const zoom = Math.round(m.getZoom());
  const lngLat = m.getCenter();
  const tile = lngLatToTile(lngLat.lng, lngLat.lat, zoom);
  const url = `http://localhost:3000/tiles/${zoom}/${tile.x}/${tile.y}`;
  const geojson = await fetch(url).then(r => r.json());

  if (m.getSource("local-points")) {
    (m.getSource("local-points") as maplibregl.GeoJSONSource).setData(geojson);
  } else {
    m.addSource("local-points", {
      type: "geojson",
      data: geojson,
    });
  }
}

function lngLatToTile(lon: number, lat: number, zoom: number) {
  const z = Math.floor(zoom);
  const xtile = Math.floor(((lon + 180) / 360) * Math.pow(2, z));
  const ytile = Math.floor(
    (
      (1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) +
            1 / Math.cos((lat * Math.PI) / 180)
        ) /
          Math.PI) /
        2
    ) * Math.pow(2, z)
  );
  return { x: xtile, y: ytile, z };
}
</script>

<template>
  <div class="maplibre-map" ref="mapContainer" />
</template>

<style scoped>
.maplibre-map {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>

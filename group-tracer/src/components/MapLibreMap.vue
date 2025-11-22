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
    // pitch: 70,
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
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
      sky: {},
    },
    maxZoom: props.maxZoom,
    maxPitch: props.maxPitch,
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
      new maplibregl.Marker().setLngLat(marker).addTo(map!)
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

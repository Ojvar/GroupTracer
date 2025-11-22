<template>
  <q-page class="column items-center q-pa-xl q-gutter-md">
    <section class="column items-center q-gutter-sm">
      <div class="text-subtitle2">{{ $t("active") }}</div>
      <div class="row q-gutter-sm">
        <q-btn
          v-for="lang in languages"
          :key="lang"
          color="primary"
          outline
          @click="setLang(lang)"
        >
          {{ lang.toUpperCase() }}
        </q-btn>
      </div>
    </section>

    <section class="full-width column items-center q-gutter-sm">
      <div class="text-h6 text-center">Simple MapLibre Example</div>
      <map-libre-map :markers="markers" />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import MapLibreMap from "components/MapLibreMap.vue";
import { useLocale } from "src/compositions/useLocale";
import { ref } from "vue";

const { $t, languages, setLang } = useLocale();

const markers = ref<[number, number][]>([
  [49.99, 36.3],
  [49.99, 36.4],
]);

setTimeout(() => {
  markers.value = [...markers.value, [49.99, 36.2]];
}, 3000);
</script>

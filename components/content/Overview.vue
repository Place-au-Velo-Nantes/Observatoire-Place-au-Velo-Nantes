<template>
  <div>
    <div v-if="geojson">
      <div class="text-center text-xl text-gray-900">
        Distance totale: <span class="font-bold" :style="`color: ${color}`">{{ displayDistanceInKm(distance, 1) }}</span>
      </div>
      <div v-if="voie.trafic" class="text-center text-sm text-gray-900">
        Fréquentation max 2030: <span class="font-bold" :style="`color: ${color}`">{{ voie.trafic }}</span>
      </div>
      <ProgressBar :voies="[geojson]" />
      <Stats :voies="[geojson]" :precision="1" />
      <StatsQuality v-if="displayQuality()" :voies="[geojson]" :precision="1" />
      <Typology :voies="[geojson]" />
    </div>
    <section aria-labelledby="shipping-heading" class="mt-10">
      <ClientOnly>
        <Map :features="features" :options="mapOptions" style="height: 40vh" />
      </ClientOnly>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';


const { path } = useRoute();
const { getLineColor } = useColors();
const { getTotalDistance, displayDistanceInKm } = useStats();
const { displayQuality } = useConfig();

const { voie } = defineProps<{ voie: Collections['voiesCyclablesPage']}>();

const mapOptions = {
  fullscreen: true,
  onFullscreenControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `${route.params._slug}/carte` });
  }
};

const { data: geojson } = await useAsyncData(`geojson-${path}`, () => {
  return queryCollection('voiesCyclablesGeojson')
    .path(voie.path)
    .first();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => geojson.value?.features || []);

const color = getLineColor(Number(voie.line));
const distance = geojson.value ? getTotalDistance([geojson.value]) : 0;
</script>

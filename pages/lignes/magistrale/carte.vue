<template>
  <div class="h-full w-full relative">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder style="height: 100%; width: 100%" />
      </template>
      <Map
        :features="filteredFeatures"
        :options="mapOptions"
        class="h-full w-full"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :filters="filters"
        :actions="actions"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useVoiesCyclablesGeojson, useGetVoiesCyclablesNums } from '~/composables/useVoiesCyclables';
import { isLineStringFeature } from '~/types';

definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies: allLines } = await useGetVoiesCyclablesNums();

// Filter features by infrastructure type "magistrale" across ALL lines
// This aggregates all segments from all lines that have infrastructure = 'magistrale'
const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojsons.value) return [];
  // flatMap collects features from all geojsons (all lines) and filters by infrastructure type
  return geojsons.value
    .flatMap((geojson) => geojson.features)
    .filter((feature) => isLineStringFeature(feature) && feature.properties.infrastructure === 'magistrale');
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allLines,
});

// Set infrastructure filter to only show magistrale immediately
// Since we've already pre-filtered features to only magistrale, we need to ensure
// the filter state matches so it doesn't filter them out
// We set this synchronously to avoid timing issues
if (filters.infrastructureFilters.value.length > 0) {
  filters.infrastructureFilters.value.forEach((filter) => {
    if (filter.infrastructures?.includes('magistrale')) {
      filter.isEnabled = true;
    } else {
      filter.isEnabled = false;
    }
  });
}

// Ensure all line filters are enabled so all lines are shown
// This is important because we want to show magistrale infrastructure from ALL lines
watchEffect(() => {
  if (filters.lineFilters.value.length > 0) {
    filters.lineFilters.value.forEach((filter) => {
      filter.isEnabled = true;
    });
  }
});

// Also watch for changes to ensure filter state stays correct
watchEffect(() => {
  if (filters.infrastructureFilters.value.length > 0) {
    filters.infrastructureFilters.value.forEach((filter) => {
      if (filter.infrastructures?.includes('magistrale')) {
        filter.isEnabled = true;
      } else {
        filter.isEnabled = false;
      }
    });
  }
});

const mapOptions = {
  shrink: true,
  canUseSidePanel: true,
  showLineFilters: true,
  showInfrastructureFilters: false,
  onShrinkControlClick: () => {
    return navigateTo({ path: '/lignes/magistrale' });
  },
};

const description = `Carte interactive des infrastructures magistrales. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux reportés après 2026.`;
useHead({
  title: 'Carte - Infrastructure Magistrale',
  meta: [
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
  ],
});
</script>

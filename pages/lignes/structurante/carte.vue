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

// Filter features by infrastructure type "structurante" across ALL lines
// This aggregates all segments from all lines that have infrastructure = 'structurante'
const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojsons.value) return [];
  // flatMap collects features from all geojsons (all lines) and filters by infrastructure type
  return geojsons.value
    .flatMap((geojson) => geojson.features)
    .filter((feature) => isLineStringFeature(feature) && feature.properties.infrastructure === 'structurante');
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allLines,
});

// Set infrastructure filter to only show structurante
watchEffect(() => {
  if (filters.infrastructureFilters.value.length > 0) {
    filters.infrastructureFilters.value.forEach((filter) => {
      if (filter.infrastructures?.includes('structurante')) {
        filter.isEnabled = true;
      } else {
        filter.isEnabled = false;
      }
    });
  }
});

// Ensure all line filters are enabled so all lines are shown
// This is important because we want to show structurante infrastructure from ALL lines
watchEffect(() => {
  if (filters.lineFilters.value.length > 0) {
    filters.lineFilters.value.forEach((filter) => {
      filter.isEnabled = true;
    });
  }
});

const mapOptions = {
  shrink: true,
  canUseSidePanel: true,
  showLineFilters: true,
  showInfrastructureFilters: false,
  onShrinkControlClick: () => {
    return navigateTo({ path: '/lignes/structurante' });
  },
};

const description = `Carte interactive des infrastructures structurantes. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux reportés après 2026.`;
useHead({
  title: 'Carte - Infrastructure Structurante',
  meta: [
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
  ],
});
</script>

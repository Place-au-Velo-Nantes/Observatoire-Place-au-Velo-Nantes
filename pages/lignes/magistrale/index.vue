<template>
  <div class="container mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
    <h1 class="text-center text-3xl text-lvv-blue-600 font-bold mb-8">Infrastructure Magistrale</h1>
    <div v-if="!filteredGeojson">Chargement ...</div>
    <div v-else>
      <div class="text-center text-xl text-gray-900 mb-4">
        Distance totale:
        <span class="font-bold text-lvv-blue-600">
          {{ displayDistanceInKm(getTotalDistance([filteredGeojson]), 1) }}
        </span>
      </div>
      <ProgressBar :voies="[filteredGeojson]" />
      <Stats :voies="[filteredGeojson]" :precision="1" class="mt-8 max-w-2xl mx-auto" />
      <StatsQuality v-if="displayQuality()" :voies="[filteredGeojson]" :precision="1" class="mt-8 max-w-2xl mx-auto" />
      <Typology :voies="[filteredGeojson]" class="mt-8 max-w-2xl mx-auto" />
      <section aria-labelledby="map-heading" class="mt-10">
        <ClientOnly fallback-tag="div">
          <template #fallback>
            <MapPlaceholder :custom-style="{ height: '40vh' }" />
          </template>
          <Map
            :features="filteredFeatures"
            :options="mapOptions"
            style="height: 40vh"
            :total-distance="totalDistance"
            :filtered-distance="filteredDistance"
            :filters="filters"
            :actions="actions"
          />
        </ClientOnly>

        <div class="mt-2 flex justify-end gap-4">
          <NuxtLink
            to="/lignes/magistrale/carte"
            class="flex items-center gap-2 text-base font-semibold text-gray-500 hover:text-lvv-blue-600 no-underline"
          >
            <span>Voir la carte complète</span>
            <Icon name="mdi:arrow-right" class="h-5 w-5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useVoiesCyclablesGeojson, useGetVoiesCyclablesNums } from '~/composables/useVoiesCyclables';
import { isLineStringFeature } from '~/types';

const { getTotalDistance, displayDistanceInKm } = useStats();
const { displayQuality } = useConfig();

definePageMeta({
  pageTransition: false,
});

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies: allLines } = await useGetVoiesCyclablesNums();

// Filter features by infrastructure type "magistrale" across ALL lines
// This aggregates all segments from all lines that have infrastructure = 'magistrale'
const filteredGeojson = computed(() => {
  if (!geojsons.value) return null;

  // flatMap collects features from all geojsons (all lines) and filters by infrastructure type
  const filteredFeatures = geojsons.value.flatMap((geojson) =>
    geojson.features.filter(
      (feature) => isLineStringFeature(feature) && feature.properties.infrastructure === 'magistrale',
    ),
  );

  if (filteredFeatures.length === 0) return null;

  return {
    type: 'FeatureCollection' as const,
    features: filteredFeatures,
  } as Collections['voiesCyclablesGeojson'];
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!filteredGeojson.value) return [];
  return filteredGeojson.value.features;
});

// Initialize filters with only magistrale infrastructure enabled
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
  fullscreen: true,
  roundedCorners: true,
  onFullscreenControlClick: () => {
    return navigateTo({ path: '/lignes/magistrale/carte' });
  },
};

const description = `Découvrez toutes les infrastructures magistrales des Grandes Voies. Statistiques, carte interactive et détails.`;
useHead({
  title: 'Infrastructure Magistrale',
  meta: [
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
  ],
});
</script>

<template>
  <div class="flex h-screen w-screen">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder />
      </template>

      <Map
        :features="mapFeatures"
        :options="{
          geolocation: true,
          updateUrlOnFeatureClick: true,
          canUseSidePanel: true,
          showLineFilters: true,
          showDetailsPanel: true,
          showDateFilter: true,
        }"
        class="h-full flex-1"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :geojsons="geojsons"
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
// import type { LineStringFeature } from '~/types';

const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies } = await useGetVoiesCyclablesNums();

// Load and transform the GeoVelo export file for Hors GVV
// const { data: geoveloData } = await useGeoveloData();
const geoveloData = ref([]);

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  const gvvFeatures = geojsons.value ? geojsons.value.flatMap((geojson) => geojson.features) : [];
  const horsGvvFeatures = (geoveloData.value || []) as Collections['voiesCyclablesGeojson']['features'];
  return [...gvvFeatures, ...horsGvvFeatures];
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allGeojsons: computed(() => geojsons.value),
  allLines: computed(() => voies.value),
});

const mapFeatures = computed(() => filteredFeatures.value as Collections['voiesCyclablesGeojson']['features']);

const description = `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
const COVER_IMAGE_URL = 'https://placeauvelo-nantes.fr/wp-content/uploads/2017/04/logo_place_au_velo_nantes.png';
useHead({
  title: `Carte à jour des ${getRevName()}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    { key: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
    { key: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL },
  ],
});
</script>

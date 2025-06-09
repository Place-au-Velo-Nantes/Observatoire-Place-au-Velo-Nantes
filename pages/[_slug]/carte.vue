<template>
  <ClientOnly>
    <Map :features="features" :options="mapOptions" class="h-full w-full" />
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const { path } = useRoute();
const { getVoieCyclableRegex } = useUrl();
const { getRevName } = useConfig();

const regex = getVoieCyclableRegex();
const match = path.match(regex);
const line = match ? match[1] : '';

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
  middleware: 'voie-cyclable'
});

const mapOptions = {
  shrink: true,
  onShrinkControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `/${route.params._slug}` });
  }
};

const { data: geojson } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson')
    .path(`/voies-cyclables/ligne-${line}`)
    .first();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojson.value) return [];
  return geojson.value.features;
});

const description = `Carte de la ${getRevName('singular')} ${line}. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux reportés après 2026.`;
useHead({
  title: `Carte de la ${getRevName('singular')} ${line}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description }
  ]
});
</script>

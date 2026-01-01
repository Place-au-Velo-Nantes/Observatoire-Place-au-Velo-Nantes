<template>
  <div class="w-full">
    <img
      src="~/assets/grandes_voies_velo.png"
      class="object-contain w-full h-screen"
      :alt="`plan officiel des ${getRevName()}`"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'embed',
});

const { getRevName } = useConfig();

const description = `Découvrez le plan officiel des ${getRevName()}.`;
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';

useHead({
  title: `Plan des ${getRevName()}`,
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

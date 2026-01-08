<template>
  <div>
    <HomeHeroSection />
    <HomeStatSection />
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Et les Grandes Voies Vélo alors ?</h2>
          <p class="text-xl text-gray-500">
            Les Grandes Voies Vélo sont des itinéraires signalés qui utilisent (principalement) des voies magistrales,
            qui sont les voies cyclables avec le plus haut niveau de service (150 km prévus, dont 50 km d’ici 2026)<br />
            Le projet vise à rendre le réseau cyclable métropolitain plus lisible grâce à 9 itinéraires balisés (A à I),
            connectés aux grands parcours (Loire à Vélo, Vélodyssée…).
          </p>
        </div>
      </div>
      <ProgressBar :voies="voies" class="mt-8 md:mt-10" />
      <Stats :voies="voies" class="mt-8" />
      <StatsQuality v-if="displayQuality() && displayQualityOnHomePage()" :voies="voies" class="mt-8" />
      <Typology :voies="voies" class="mt-8 max-w-2xl mx-auto" />
    </div>
    <div>
      <NuxtLink href="/tableau-de-bord" class="flex items-center justify-center text-lvv-blue-600 hover:underline">
        Voir le tableau de bord complet
        <Icon name="heroicons:arrow-right" class="ml-1 h-5 w-5" />
      </NuxtLink>
    </div>
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Avancement par ligne</h2>
          <p class="text-xl text-gray-500">
            Choisissez une {{ getRevName('singular') }} pour connaitre le détail du projet et voir son niveau
            d'avancement.
          </p>
        </div>
        <HomeLinesSection class="mt-5" />
      </div>
    </div>
    <div class="py-16">
      <LvvCta />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const { getRevName, displayQuality, displayQualityOnHomePage } = useConfig();

const { geojsons } = await useVoiesCyclablesGeojson();
const voies: Ref<Collections['voiesCyclablesGeojson'][]> = computed(() => geojsons.value || []);
</script>

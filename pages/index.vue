<template>
  <div>
    <HomeHeroSection />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">Le SDIC, c'est quoi ?</h2>
        <p class="mt-3 text-xl text-gray-500 sm:mt-4">
          Le Schéma Directeur des Itinéraires Cyclables est le plan stratégique de Nantes Métropole pour développer un
          réseau cyclable sécurisé et structuré, avec 640 km d’aménagements prévus dont 312 km d'aménagements de haute
          qualité. Il vise à atteindre 15% de part du vélo dans les déplacements grâce à des voies hiérarchisées.
        </p>
        <div class="mt-12 text-left">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">Quatre grands types de voies</h3>

          <div class="space-y-8">
            <div>
              <h4 class="text-xl font-bold text-lvv-blue-600">Les voies magistrales : 150 kilomètres</h4>
              <p class="mt-2 text-lg text-gray-500">
                Elles bénéficient des meilleurs aménagements pour rejoindre sa destination le plus rapidement possible,
                en toute sécurité. C’est le premier niveau du réseau : 6 voies + 2 itinéraires de rocade qui raccordent,
                d’Est en Ouest et du Nord au Sud, « la périphérie à la périphérie » et à la centralité. Les 50 premiers
                kilomètres de ce réseau, dont chaque branche sera numérotée comme les lignes du réseau TAN, seront
                réalisés d’ici 2026. Les 24 communes en bénéficieront.
              </p>
            </div>

            <div>
              <h4 class="text-xl font-bold text-lvv-blue-600">Les voies structurantes : 162 kilomètres</h4>
              <p class="mt-2 text-lg text-gray-500">
                Elles empruntent des axes fréquentés, sur lesquels elles assurent la meilleure sécurité. C’est le
                deuxième niveau du réseau, sur lequel on ne roule pas beaucoup moins vite que sur le premier, puisqu’il
                n’y a plus de conflits d’usage avec les automobilistes et les piétons.
              </p>
            </div>

            <div>
              <h4 class="text-xl font-bold text-lvv-blue-600">Les voies secondaires et de maillage : 330 kilomètres</h4>
              <p class="mt-2 text-lg text-gray-500">
                Elles complètent le réseau, pour rejoindre les axes principaux ou le cœur des quartiers. Leur
                aménagement s’adapte à la diversité des situations urbaines, toujours pour assurer la sécurité des
                cyclistes, mais aussi des piétons.
              </p>
            </div>
          </div>

          <p class="mt-6 text-sm text-gray-400 italic">Source: Nantes Métropole</p>
        </div>
      </div>
    </div>

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

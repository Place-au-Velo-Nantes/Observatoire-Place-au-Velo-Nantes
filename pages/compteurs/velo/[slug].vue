<template>
  <ContentFrame
    v-if="counter"
    header="compteur vélo"
    :title="counter.name"
    :sub-title="counter.arrondissement"
    :description="counter.description"
    :image-url="counter.imageUrl"
  >
    <div v-if="features[0].properties.neighborData">
      Compteur à proximité :
      <a :href="features[0].properties.neighborData.properties.link" class="hover:underline">{{
        features[0].properties.neighborData.properties.name
      }}</a>
    </div>
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder style="height: 40vh" additional-class="mt-6" />
      </template>
      <Map
        :features="features"
        :options="{ roundedCorners: true, legend: false, filter: false }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>
    <h2>Total des passages par année</h2>
    <p>Ce premier diagramme représente le nombre total de passages détecté par le compteur vélo chaque année.</p>
    <ChartTotalByYear :title="graphTitles.totalByYear" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Comparaison des passages pour un mois donné</h2>
    <p>
      Choisissez un mois dans le menu déroulant ci-dessous pour visualiser l'évolution de la fréquentation cyclable pour
      le même mois de chaque année.
    </p>
    <ChartMonthComparison
      :title="graphTitles.monthComparison"
      :data="counter"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <template v-if="counter.limitation">
      <h2>Limitation</h2>
      <p>{{ counter.limitation }}</p>
    </template>

    <!-- <template v-if="counter && counter.lines && counter.lines.length > 0">
      <h2>{{ getRevName() }} mesurées par ce compteur</h2>
      <ul>
        <li v-for="line in counter.lines" :key="line">
          <LineLink :line="String(line)" />
        </li>
      </ul>
    </template> -->

    <h2>Source des données</h2>
    <p>
      Les données proviennent de data.nantesmetropole.fr :<br />-
      <a
        href="https://data.nantesmetropole.fr/explore/dataset/244400404_comptages-velo-nantes-metropole-historique-jour/information/"
        target="_blank"
        >données 2014-2019</a
      >
      : cumule par mois des comptages ajustés (c'est-à-dire avec une estimation sans les anomalies) pour 18 boucles.<br />-
      <a
        href="https://data.nantesmetropole.fr/explore/dataset/244400404_comptages-velo-nantes-metropole/information/"
        target="_blank"
        >données à partir de 2020</a
      >
      : cumule par mois des comptages pour cette boucle.<br />-
      <a
        href="https://data.nantesmetropole.fr/explore/dataset/244400404_comptages-velo-nantes-metropole-boucles-comptage/information/"
        target="_blank"
        >boucles de comptage.</a
      >
    </p>
  </ContentFrame>
</template>

<script setup>
import MapPlaceholder from '~/components/MapPlaceholder.vue';

const { path } = useRoute();
// const { getRevName } = useConfig();
const { withoutTrailingSlash } = useUrl();
const { getCompteursFeatures } = useMap();

const { data: counter } = await useAsyncData(path, () => {
  return queryCollection('compteurs').path(withoutTrailingSlash(path)).first();
});

if (!counter.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const graphTitles = {
  totalByYear: `Fréquentation cycliste annuelle - ${counter.value.name}`,
  monthComparison: `Fréquentation cycliste - ${counter.value.name}`,
};

const features = getCompteursFeatures({ counters: [counter.value], type: 'compteur-velo' });

if (counter.value.neighbor) {
  //ajout des données du compteur voisin
  const { data: neighborCounter } = await useAsyncData(() => {
    return queryCollection('compteurs').where('idPdc', '=', counter.value.neighbor).all();
  });
  features[0].properties.neighborData = getCompteursFeatures({
    counters: [neighborCounter.value[0]],
    type: 'compteur-velo',
  })[0];
}

const DESCRIPTION = `Compteur vélo ${counter.value.name}`;
const IMAGE_URL = counter.value.imageUrl;
useHead({
  meta: [
    // description
    { hid: 'description', name: 'description', content: DESCRIPTION },
    { hid: 'og:description', property: 'og:description', DESCRIPTION },
    { hid: 'twitter:description', name: 'twitter:description', DESCRIPTION },
    // cover image
    { hid: 'og:image', property: 'og:image', content: IMAGE_URL },
    { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL },
  ],
});
</script>

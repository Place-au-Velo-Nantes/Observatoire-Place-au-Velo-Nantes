<template>
  <div class="bg-white pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
    <div class="relative max-w-lg mx-auto divide-y-2 divide-gray-200 lg:max-w-7xl">
      <div>
        <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
          Cartes Minute
        </h2>
        <p class="mt-3 text-xl text-gray-500 sm:mt-4">
          💡📐 Conception et réalisation : <u><a href="mailto:cartominute@gmail.com">Collectif Nouvelles Aires</a></u> et <u><a href="mailto:nathan.blassel@neonab.com">Neonab</a></u><br>
          🏠💻 Hébergement et Interface : Association <u><a href="www.lavilleavelo.org">La Ville à Vélo</a></u>
        </p>
      </div>
      <div class="mt-12 grid gap-16 pt-12 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-4">
        <div v-for="carte in cartesMinutes" :key="carte.index" class="p-4 rounded-lg hover:bg-gray-50">
          <NuxtLink :to="carte.link" target="_blank">
            <div>
              <img class="h-48 lg:h-56 object-cover w-full object-center relative block bg-white rounded-lg overflow-hidden" :src="carte.imageUrl">
            </div>
            <p class="text-xl font-semibold text-gray-900 mt-4">
              {{ carte.title }}
            </p>
            <h4 class="text-gray-500 text-base">
              {{ carte.description }}
            </h4>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: cartesMinutes } = await useAsyncData(() => {
  return queryCollection('cartesMinutes').all();
});
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-2">
    <h3 class="text-base font-semibold mb-1 text-gray-900">Couleurs des segments</h3>
    <div class="space-y-1">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="colorMode"
          :checked="!isCycloscoreColorMode"
          class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          @change="setColorMode('line')"
        />
        <span class="text-sm text-gray-700">Par ligne (GVV/non-GVV)</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="colorMode"
          :checked="isCycloscoreColorMode"
          class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          @change="setColorMode('cycloscore')"
        />
        <span class="text-sm text-gray-700">Par cycloscore</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const isCycloscoreColorMode = computed(() => route.query.colorMode === 'cycloscore');

function setColorMode(mode: 'line' | 'cycloscore') {
  const query = { ...route.query };

  if (mode === 'cycloscore') {
    query.colorMode = 'cycloscore';
  } else {
    delete query.colorMode;
  }

  router.replace({ query });
}
</script>

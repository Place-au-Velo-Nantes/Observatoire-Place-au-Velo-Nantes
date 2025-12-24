<template>
  <div class="legend-inline-container bg-white rounded-lg shadow-lg p-3" style="min-width: 200px; max-width: 200px">
    <LegendContent size="small" :color-mode="colorMode" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const colorMode = computed(() => (route.query.colorMode === 'cycloscore' ? 'cycloscore' : 'line'));
</script>

<style scoped>
.legend-inline-container {
  pointer-events: auto;
}
</style>

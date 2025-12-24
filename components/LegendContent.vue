<template>
  <div v-if="colorMode === 'line'" :class="['grid', gridClass, 'gap-x-2 gap-y-1', textSizeClass]">
    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['bg-lvv-blue-600', lineHeightClass]" />
    </div>
    <div class="my-auto">terminé</div>

    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['relative', lineHeightClass]">
        <div class="absolute h-full w-full">
          <div class="h-full bg-lvv-blue-600 dashed-line animated-dashes" />
        </div>
      </div>
    </div>
    <div class="my-auto">en travaux</div>

    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['relative', lineHeightClass]">
        <div class="absolute h-full w-full">
          <div class="h-full bg-lvv-blue-600 dashed-line" />
        </div>
      </div>
    </div>
    <div class="my-auto">prévu pour 2026</div>

    <div :class="['my-auto rounded-md border-gray-500 border relative', borderClass]">
      <div :class="['bg-white', lineHeightClass]" />
      <div :class="['text-lvv-blue-600 font-bold leading-none absolute', xTextClass]">
        <span v-if="props.size === 'small'">x x x x</span>
        <span v-else>x x x x x</span>
      </div>
    </div>
    <div class="my-auto">reporté après 2026</div>
  </div>

  <div v-else :class="['grid', gridClass, 'gap-x-2 gap-y-1', textSizeClass]">
    <div v-for="score in cycloscoreOrder" :key="score" class="contents">
      <div :class="['my-auto rounded border-gray-500 border', borderClass]">
        <div
          class="flex items-center justify-center font-bold"
          :class="[squareSizeClass]"
          :style="`background-color: ${cycloscoreColors[score]}; color: ${getTextColor(score)}`"
        >
          {{ score === 'Non renseigné' ? '?' : score }}
        </div>
      </div>
      <div class="my-auto">{{ score }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CYCLOSCORE_COLORS } from '~/composables/useColors';

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'large';
    colorMode?: 'line' | 'cycloscore';
  }>(),
  {
    size: 'large',
    colorMode: 'line',
  },
);

const gridClass = computed(() => (props.size === 'small' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[64px_1fr]'));
const textSizeClass = computed(() => (props.size === 'small' ? 'text-xs' : 'text-sm'));
const lineHeightClass = computed(() => (props.size === 'small' ? 'h-0.5' : 'h-1'));
const borderClass = computed(() => (props.size === 'small' ? 'rounded-sm' : 'rounded-md'));
const xTextClass = computed(() => (props.size === 'small' ? 'text-[12px] -top-[5px]' : '-top-[7px]'));
const squareSizeClass = computed(() => (props.size === 'small' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'));

const cycloscoreOrder = ['A', 'B', 'C', 'D', 'E', 'Non renseigné'] as const;

const cycloscoreColors = computed(() => {
  return {
    A: CYCLOSCORE_COLORS.A,
    B: CYCLOSCORE_COLORS.B,
    C: CYCLOSCORE_COLORS.C,
    D: CYCLOSCORE_COLORS.D,
    E: CYCLOSCORE_COLORS.E,
    'Non renseigné': CYCLOSCORE_COLORS.UNKNOWN,
  };
});

function getTextColor(score: string): string {
  if (score === 'Non renseigné') {
    return '#FFFFFF';
  }
  // A and B use white text, C, D, E use black text
  if (score === 'A' || score === 'B') {
    return '#FFFFFF';
  }
  return '#000000';
}
</script>

<style scoped>
.dashed-line {
  background-image: linear-gradient(to right, transparent 50%, white 50%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
}

.animated-dashes {
  animation: dash-animation 0.5s linear infinite;
}

@keyframes dash-animation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 12px 0;
  }
}
</style>

<template>
  <button
    type="button"
    class="text-sm outline outline-2 outline-offset-[-1px] focus:outline-none transition-all flex items-center gap-2"
    :class="{
      'px-2 py-1.5 rounded-2xl': !isCycloscore,
      rounded: isCycloscore,
      'bg-lvv-blue-600 text-white hover:bg-lvv-blue-700 outline-lvv-blue-800 focus:ring-lvv-blue-400':
        isEnabled && !customStyle && !isCycloscore,
      'bg-white text-gray-900 hover:bg-gray-50 outline-gray-300 focus:ring-gray-300':
        !isEnabled && !customStyle && !isCycloscore,
      'focus-visible:opacity-80 hover:opacity-80': isEnabled && !disabled,
      'cursor-not-allowed opacity-50': disabled,
      'cursor-pointer': !disabled,
    }"
    :style="computedStyle"
    :disabled="disabled"
    @click="!disabled && emit('click')"
  >
    <span
      v-if="isCycloscore"
      class="inline-flex items-center justify-center w-7 h-7 rounded text-sm font-bold"
      :style="cycloscoreSquareStyle"
    >
      {{ cycloscoreLetter }}
    </span>
    <span v-if="!isCycloscore || label !== cycloscoreLetter">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaseFilterItem } from '~/types';
import { CYCLOSCORE_COLOR_VALUES } from '~/composables/useColors';

const props = defineProps<{
  label: string;
  isEnabled: boolean;
  customStyle?: BaseFilterItem['customStyle'];
  disabled?: boolean;
}>();

const emit = defineEmits(['click']);

// Check if this is a cycloscore filter (single letter A-G or A+ AND has cycloscore color)
const isCycloscore = computed(() => {
  const cycloscorePattern = /^[A-G](\+)?$/;
  const matchesPattern = cycloscorePattern.test(props.label);

  // Also check if it has a cycloscore color to avoid affecting line filters
  const hasCycloscoreColor =
    props.customStyle?.backgroundColor &&
    CYCLOSCORE_COLOR_VALUES.includes(props.customStyle.backgroundColor as (typeof CYCLOSCORE_COLOR_VALUES)[number]);

  return matchesPattern && hasCycloscoreColor;
});

const cycloscoreLetter = computed(() => {
  if (!isCycloscore.value) return '';
  return props.label;
});

const cycloscoreSquareStyle = computed(() => {
  if (!props.customStyle || !props.customStyle.backgroundColor) {
    return {};
  }

  // Only apply square styling if it's a cycloscore color
  const isCycloscoreColor = CYCLOSCORE_COLOR_VALUES.includes(
    props.customStyle.backgroundColor as (typeof CYCLOSCORE_COLOR_VALUES)[number],
  );
  if (!isCycloscoreColor) {
    return {};
  }

  const style: Record<string, string> = {
    backgroundColor: props.isEnabled && !props.disabled ? props.customStyle.backgroundColor : '#FFFFFF',
    color: props.isEnabled && !props.disabled ? props.customStyle.textColor || '#000000' : '#9CA3AF',
    border: props.isEnabled && !props.disabled ? 'none' : `1px solid ${props.customStyle.backgroundColor}`,
  };

  if (!props.isEnabled || props.disabled) {
    style.opacity = '0.5';
  }

  return style;
});

const computedStyle = computed(() => {
  const style: Record<string, string> = {};
  style.outlineOffset = '1px';
  style.margin = '0px';

  // For cycloscore filters, use transparent background to show the square
  if (isCycloscore.value && props.customStyle) {
    style.backgroundColor = 'transparent';
    style.outlineColor =
      props.isEnabled && !props.disabled ? props.customStyle.backgroundColor || '#D1D5DB' : '#D1D5DB';
    style.border = 'none';
    style.outline = props.isEnabled && !props.disabled ? '2px solid' : '1px solid';
    if (props.disabled) {
      style.opacity = '0.5';
    }
    return style;
  }

  style.backgroundColor = props.isEnabled ? '#152B68' : '#FFFFFF';
  style.outlineColor = props.isEnabled ? '#152B68' : '#D1D5DB';

  if (!props.customStyle) {
    return style;
  }

  if (props.isEnabled) {
    if (props.customStyle.backgroundColor) {
      style.backgroundColor = props.customStyle.backgroundColor;
      style.outlineColor = props.customStyle.backgroundColor;
    }

    if (props.customStyle.borderStyle) {
      style.outlineStyle = props.customStyle.borderStyle;
    }

    if (props.customStyle.textColor) {
      style.color = props.customStyle.textColor;
    }
  } else {
    style.backgroundColor = '#FFFFFF';
    style.opacity = '0.8';

    if (props.customStyle.backgroundColor) {
      style.outlineColor = props.customStyle.backgroundColor;
    }

    if (props.customStyle.borderStyle) {
      style.outlineStyle = props.customStyle.borderStyle;
    }
  }

  return style;
});
</script>

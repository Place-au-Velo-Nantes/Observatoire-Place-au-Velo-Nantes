<template>
  <div class="not-prose text-gray-900 w-48">
    <div class="py-1 bg-zinc-100 flex flex-col items-center justify-center">
      <template v-if="lines.includes('X')">
        <div class="font-bold text-base">Autre axe principal</div>
      </template>
      <template v-else>
        <div class="font-bold text-base">
          {{ title }}
        </div>
      </template>
      <div class="flex flex-row space-x-1">
        <template v-for="line in lines" :key="line">
          <div
            v-if="line === 'X'"
            class="px-2 rounded-full flex items-center justify-center text-white text-xs font-bold"
            :style="`background-color: ${getLineColor(line)}`"
          >
            Hors grande voie
          </div>
          <div
            v-else
            class="h-8 w-8 rounded-full flex items-center justify-center text-white text-base font-bold"
            :style="`background-color: ${getLineColor(line)}`"
          >
            <a :href="`/grandes-voies-velo-nantes-${line}`">
              {{ line }}
            </a>
          </div>
        </template>
      </div>
    </div>
    <div class="px-2 divide-y">
      <div class="py-1 flex flex-col items-center">
        <div class="text-base font-bold">Tronçon</div>
        <div class="text-sm text-center">
          {{ feature.properties.name }}
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Statut</div>
        <div>
          <div class="text-sm" :class="getStatus(feature.properties).class">
            {{ getStatus(feature.properties).label }}
          </div>
          <div v-if="getStatus(feature.properties).date" class="italic">
            {{ getStatus(feature.properties).date }}
          </div>
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Longueur</div>
        <div class="text-sm">{{ Math.round(getDistance({ features: [feature] }) / 25) * 25 }}m</div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Type</div>
        <div class="text-sm text-right">
          {{ typologyNames[feature.properties.type] ?? 'Inconnu' }}
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Infrastructure</div>
        <div class="text-sm text-right">
          {{ feature.properties.infrastructure ?? 'Inconnu' }}
        </div>
      </div>
      <div v-if="displayQuality() && feature.properties.quality" class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Qualité</div>
        <div class="text-xs" :class="getQuality(feature.properties.quality).class">
          <Icon
            :name="getQuality(feature.properties.quality).icon"
            class="h-4 w-4 align-middle"
            :class="getQuality(feature.properties.quality).classIcon"
          />
          {{ getQuality(feature.properties.quality).label }}
        </div>
      </div>
      <div v-if="feature.properties.cycloscore" class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Cycloscore</div>
        <div class="text-sm text-right">
          {{ feature.properties.cycloscore }}
        </div>
      </div>
    </div>
    <div class="bg-lvv-blue-600 flex justify-center">
      <a class="p-1 text-white text-base italic hover:underline" :href="getSectionDetailsUrl(feature.properties)">
        voir le détail <Icon name="mdi:link-variant" class="h-4 w-4 text-white" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LaneQuality, LineStringFeature } from '~/types';

const { getLineColor } = useColors();
const { getRevName, displayQuality } = useConfig();
const { getDistance, typologyNames, qualityNames } = useStats();
const { getVoieCyclablePath } = useUrl();

const { feature, lines } = defineProps<{
  feature: LineStringFeature;
  lines: string[];
}>();

const title = computed(() => {
  return lines.length > 1 ? getRevName() : getRevName('singular');
});

function getSectionDetailsUrl(properties: LineStringFeature['properties']): string {
  if (properties.link) {
    return properties.link;
  }
  return getVoieCyclablePath(properties.line);
}

function getDoneAtText(doneAt: string): string {
  // If doneAt is just a year (e.g. "2022"), return "en 2022"
  if (/^\d{4}$/.test(doneAt)) {
    return `en ${doneAt}`;
  }
  const [day, month, year] = doneAt.split('/');
  const isBeforeMandat =
    new Date(Number(year), Number(month) - 1, Number(day)).getTime() < new Date(2021, 0, 1).getTime();
  if (isBeforeMandat) {
    return 'avant 2021';
  }
  return `le ${doneAt}`;
}

function getStatus(properties: LineStringFeature['properties']): { label: string; class: string; date?: string } {
  const statusMapping = {
    done: {
      label: 'terminé',
      date: properties.doneAt && getDoneAtText(properties.doneAt),
      class: 'text-white bg-lvv-blue-600 rounded-xl px-2 w-fit',
    },
    wip: {
      label: 'en travaux',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    planned: {
      label: 'prévu',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-lvv-blue-600',
    },
    tested: {
      label: 'en test',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    postponed: {
      label: 'reporté',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2',
    },
    variante: {
      label: 'variante',
      class: '',
    },
    'variante-postponed': {
      label: 'variante reportée',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2',
    },
    unknown: {
      label: 'à définir',
      class: 'text-gray-900 bg-gray-200 rounded-xl px-2',
    },
  };
  return statusMapping[properties.status];
}

function getQuality(quality: LaneQuality): { label: string; class: string; icon: string; classIcon: string } {
  const statusMapping = {
    unsatisfactory: {
      label: qualityNames.unsatisfactory,
      class: 'rounded-xl px-1 border border-red-600',
      classIcon: 'text-red-600',
      icon: 'mdi:close',
    },
    satisfactory: {
      label: qualityNames.satisfactory,
      class: 'rounded-xl px-1 border border-green-600',
      classIcon: 'text-green-600',
      icon: 'mdi:check',
    },
    'not-rated-yet': {
      label: qualityNames.unknown,
      class: 'rounded-xl px-1 border border-gray-600',
      classIcon: '',
      icon: '',
    },
  };
  return statusMapping[quality];
}
</script>

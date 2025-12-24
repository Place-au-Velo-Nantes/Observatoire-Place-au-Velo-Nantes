<template>
  <div class="space-y-6">
    <FilterSection
      title="Statut d'avancement"
      :filters="filters.statusFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleStatusFilter"
      @select-all="
        filters.statusFilters.value.forEach((status: StatusTypeQualityFilterItem) => (status.isEnabled = true))
      "
      @deselect-all="
        filters.statusFilters.value.forEach((status: StatusTypeQualityFilterItem) => (status.isEnabled = false))
      "
    />

    <FilterSection
      title="Qualité d'aménagement"
      :filters="filters.qualityFilters.value"
      :show-selection-buttons="false"
      @toggle-filter="actions.toggleQualityFilter"
    />

    <FilterSection
      title="Type d'aménagement"
      :filters="filters.typeFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleTypeFilter"
      @select-all="filters.typeFilters.value.forEach((type: StatusTypeQualityFilterItem) => (type.isEnabled = true))"
      @deselect-all="filters.typeFilters.value.forEach((type: StatusTypeQualityFilterItem) => (type.isEnabled = false))"
    />

    <FilterSection
      v-if="options.showInfrastructureFilters"
      title="Infrastructure"
      :filters="filters.infrastructureFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleInfrastructureFilter"
      @select-all="
        filters.infrastructureFilters.value.forEach((infra: StatusTypeQualityFilterItem) => (infra.isEnabled = true))
      "
      @deselect-all="
        filters.infrastructureFilters.value.forEach((infra: StatusTypeQualityFilterItem) => (infra.isEnabled = false))
      "
    />

    <FilterSection
      title="Cycloscore"
      :filters="filters.cycloscoreFilters.value"
      :show-selection-buttons="true"
      :disabled-indices="filters.cycloscoreFilterDisabled?.value"
      @toggle-filter="actions.toggleCycloscoreFilter"
      @select-all="
        filters.cycloscoreFilters.value.forEach(
          (cycloscore: StatusTypeQualityFilterItem) => (cycloscore.isEnabled = true),
        )
      "
      @deselect-all="
        filters.cycloscoreFilters.value.forEach(
          (cycloscore: StatusTypeQualityFilterItem) => (cycloscore.isEnabled = false),
        )
      "
    />

    <FilterSection
      v-if="options.showLineFilters"
      title="Grande voie vélo"
      :filters="filters.lineFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleLineFilter"
      @select-all="filters.lineFilters.value.forEach((line: LineFilterItem) => (line.isEnabled = true))"
      @deselect-all="filters.lineFilters.value.forEach((line: LineFilterItem) => (line.isEnabled = false))"
    />

    <div v-if="options.showDateFilter && filters.minDate.value !== filters.maxDate.value" class="mt-2">
      <h3 class="text-base font-medium mb-4">Date de réalisation</h3>
      <div>
        <DoubleRangeSlider
          :model-value="filters.dateRange.value"
          :min="filters.minDate.value"
          :max="filters.maxDate.value"
          :step="1"
          @update:model-value="actions.setDateRange"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-2">
          <span>{{ formatMonthYear(filters.dateRange.value[0]) }}</span>
          <span>{{ formatMonthYear(filters.dateRange.value[1]) }}</span>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-gray-200">
      <h3 class="text-base font-medium mb-3">Couleurs des segments</h3>
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-sm" :class="isCycloscoreColorMode ? 'text-gray-500' : 'text-gray-700'">
            Couleurs par ligne (GVV/non-GVV)
          </span>
          <span class="text-xs" :class="isCycloscoreColorMode ? 'text-gray-700' : 'text-gray-500'">
            Couleurs par cycloscore
          </span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" :checked="isCycloscoreColorMode" class="sr-only peer" @change="toggleColorMode" />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
          ></div>
        </label>
      </div>
    </div>

    <hr class="h-px bg-gray-200 border-0 my-4" />
  </div>
</template>

<script setup lang="ts">
import FilterSection from '~/components/filter/FilterSection.vue';
import DoubleRangeSlider from '~/components/DoubleRangeSlider.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import type { FiltersState, FilterActions, StatusTypeQualityFilterItem, LineFilterItem } from '~/types';
dayjs.locale('fr');

const props = defineProps<{
  showLineFilters: boolean;
  showInfrastructureFilters?: boolean;
  showDateFilter?: boolean;
  filters: FiltersState;
  actions: FilterActions;
}>();
const defaultOptions = { showLineFilters: false, showInfrastructureFilters: true, showDateFilter: false };
const options = { ...defaultOptions, ...props };

const route = useRoute();
const router = useRouter();

const isCycloscoreColorMode = computed(() => route.query.colorMode === 'cycloscore');

function toggleColorMode(event: Event) {
  const target = event.target as HTMLInputElement;
  const query = { ...route.query };

  if (target.checked) {
    query.colorMode = 'cycloscore';
  } else {
    delete query.colorMode;
  }

  router.replace({ query });
}

function formatMonthYear(stepIndex: number) {
  if (stepIndex >= props.filters.dateSteps.value.length || stepIndex < 0) {
    return '2026+';
  }

  const monthIndex = props.filters.dateSteps.value[stepIndex];
  if (monthIndex === undefined || monthIndex >= 999999) {
    return '2026+';
  }

  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return dayjs(new Date(year, month)).format('MMM YYYY');
}
</script>

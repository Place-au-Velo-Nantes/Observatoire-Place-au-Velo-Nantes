import {
  type FiltersState,
  type FilterActions,
  isLineStringFeature,
  isPointFeature,
  type LaneQuality,
  type LaneStatus,
  type LaneType,
  type LineFilterItem,
  type UseBikeLaneFiltersOptions,
} from '~/types';
import type { Collections } from '@nuxt/content';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { CYCLOSCORE_COLORS } from '~/composables/useColors';
dayjs.locale('fr');

export function useBikeLaneFilters({ allFeatures, allGeojsons, allLines }: UseBikeLaneFiltersOptions) {
  const { getAllUniqLineStrings, getDistance } = useStats();
  const { getLineColor, getCycloscoreColor } = useColors();
  const route = useRoute();
  const router = useRouter();
  const currentPage = route.name;

  const statusFilters = ref([
    {
      label: 'Terminé',
      isEnabled: true,
      statuses: ['done', 'variante'],
    },
    {
      label: 'En travaux',
      isEnabled: true,
      statuses: ['wip', 'tested'],
      customStyle: {
        backgroundColor: '#152B68',
        borderColor: '#FFFFFF',
        borderStyle: 'dashed' as const,
        borderWidth: '2px',
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'Prévu pour 2026',
      isEnabled: true,
      statuses: ['planned'],
      customStyle: {
        backgroundColor: '#8B7FA0',
        borderColor: '#8B7FA0',
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'Reporté',
      isEnabled: true,
      statuses: ['postponed', 'variante-postponed'],
      customStyle: {
        backgroundColor: '#C84271',
        borderColor: '#C84271',
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'À définir',
      isEnabled: true,
      statuses: ['unknown'],
      customStyle: {
        backgroundColor: '#E5E7EB',
        borderColor: '#9CA3AF',
        borderStyle: 'dashed' as const,
        textColor: '#111827',
      },
    },
  ]);

  const typeFilters = ref([
    { label: 'Bidirectionnelle', isEnabled: true, types: ['bidirectionnelle'] },
    { label: 'Bilaterale', isEnabled: true, types: ['bilaterale'] },
    { label: 'Voie Bus', isEnabled: true, types: ['voie-bus', 'voie-bus-elargie'] },
    { label: 'Voie verte', isEnabled: true, types: ['voie-verte'] },
    { label: 'Vélorue', isEnabled: true, types: ['velorue'] },
    { label: 'Bandes cyclables', isEnabled: true, types: ['bandes-cyclables'] },
    { label: 'Chaucidou', isEnabled: true, types: ['chaucidou'] },
    { label: 'Zone de rencontre', isEnabled: true, types: ['zone-de-rencontre'] },
    { label: 'Aire piétonne', isEnabled: true, types: ['aire-pietonne'] },
    { label: 'Inconnu', isEnabled: true, types: ['inconnu'] },
    { label: 'Aucun', isEnabled: true, types: ['aucun'] },
  ]);

  const qualityFilters = ref([
    {
      label: 'Satisfaisant',
      isEnabled: true,
      qualities: ['satisfactory'],
    },
    {
      label: 'Non satisfaisant',
      isEnabled: true,
      qualities: ['unsatisfactory'],
      customStyle: {
        backgroundColor: '#C84271',
        borderColor: '#fff',
        borderStyle: 'dashed' as const,
        borderWidth: '2px',
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'Pas encore évalué',
      isEnabled: true,
      qualities: ['not-rated-yet'],
      customStyle: {
        backgroundColor: '#E0DFE7',
        borderColor: '#A7A5B4',
        textColor: '#1F2933',
      },
    },
  ]);

  const infrastructureFilters = ref([
    {
      label: 'Magistrale',
      isEnabled: true,
      infrastructures: ['magistrale'],
    },
    {
      label: 'Structurante',
      isEnabled: true,
      infrastructures: ['structurante'],
    },
    {
      label: 'Secondaire',
      isEnabled: true,
      infrastructures: ['secondaire'],
    },
    {
      label: 'Maillage',
      isEnabled: true,
      infrastructures: ['maillage'],
    },
    {
      label: 'Aucune',
      isEnabled: true,
      infrastructures: ['aucune'],
    },
  ]);

  const cycloscoreFilters = ref([
    {
      label: 'A',
      isEnabled: true,
      cycloscores: ['A'],
      customStyle: {
        backgroundColor: getCycloscoreColor('A'),
        borderColor: getCycloscoreColor('A'),
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'B',
      isEnabled: true,
      cycloscores: ['B'],
      customStyle: {
        backgroundColor: getCycloscoreColor('B'),
        borderColor: getCycloscoreColor('B'),
        textColor: '#FFFFFF',
      },
    },
    {
      label: 'C',
      isEnabled: true,
      cycloscores: ['C'],
      customStyle: {
        backgroundColor: getCycloscoreColor('C'),
        borderColor: getCycloscoreColor('C'),
        textColor: '#000000',
      },
    },
    {
      label: 'E',
      isEnabled: true,
      cycloscores: ['E'],
      customStyle: {
        backgroundColor: getCycloscoreColor('E'),
        borderColor: getCycloscoreColor('E'),
        textColor: '#000000',
      },
    },
    {
      label: 'Non renseigné',
      isEnabled: true,
      cycloscores: [null as unknown as string],
      customStyle: {
        backgroundColor: CYCLOSCORE_COLORS.UNKNOWN,
        borderColor: CYCLOSCORE_COLORS.UNKNOWN,
        textColor: '#FFFFFF',
      },
    },
  ]);

  const lineFilters = ref<LineFilterItem[]>([]);
  const NON_GVV_LINE_ID = 'X';
  const NON_GVV_LABEL = 'Hors GVV';

  const createLineFilter = (lineId: string, label?: string): LineFilterItem => {
    const color = getLineColor(lineId);
    return {
      label: label ?? `${lineId}`,
      isEnabled: true,
      line: lineId,
      color,
      customStyle: {
        backgroundColor: color,
        borderColor: color,
        textColor: '#FFFFFF',
      },
    };
  };

  const applyLineQueryFilter = () => {
    if (!Object.hasOwn(route.query, 'lines')) {
      return;
    }

    const linesQuery = route.query.lines;
    const enabled = linesQuery && (linesQuery as string).length > 0 ? (linesQuery as string).split(',') : [];
    lineFilters.value.forEach((f) => (f.isEnabled = enabled.includes(f.line)));
  };

  const upsertNonGvvFilter = () => {
    const hasNonGvvSegments = (allFeatures.value ?? []).some(
      (feature) => isLineStringFeature(feature) && feature.properties.line === NON_GVV_LINE_ID,
    );

    // Always remove the placeholder before re-adding it to avoid duplicates or stale entries
    lineFilters.value = lineFilters.value.filter((filter) => filter.line !== NON_GVV_LINE_ID);

    if (!hasNonGvvSegments) {
      return;
    }

    lineFilters.value = [...lineFilters.value, createLineFilter(NON_GVV_LINE_ID, NON_GVV_LABEL)];

    applyLineQueryFilter();
  };

  const dateRange = ref<[number, number]>([0, 0]);
  const minDate = ref(0);
  const maxDate = ref(0);
  const dateSteps = ref<number[]>([]);

  const query = route.query;

  if (Object.hasOwn(query, 'statuses')) {
    const statusesQuery = query.statuses;
    const enabled = statusesQuery && (statusesQuery as string).length > 0 ? (statusesQuery as string).split(',') : [];
    statusFilters.value.forEach((f) => (f.isEnabled = f.statuses.every((s) => enabled.includes(s))));
  }

  if (Object.hasOwn(query, 'types')) {
    const typesQuery = query.types;
    const enabled = typesQuery && (typesQuery as string).length > 0 ? (typesQuery as string).split(',') : [];
    typeFilters.value.forEach((f) => (f.isEnabled = f.types.every((t) => enabled.includes(t))));
  }

  if (Object.hasOwn(query, 'qualities')) {
    const qualitiesQuery = query.qualities;
    const enabled =
      qualitiesQuery && (qualitiesQuery as string).length > 0 ? (qualitiesQuery as string).split(',') : [];
    qualityFilters.value.forEach((f) => (f.isEnabled = f.qualities.every((q) => enabled.includes(q))));
  }

  if (Object.hasOwn(query, 'infrastructures')) {
    const infrastructuresQuery = query.infrastructures;
    const enabled =
      infrastructuresQuery && (infrastructuresQuery as string).length > 0
        ? (infrastructuresQuery as string).split(',')
        : [];
    infrastructureFilters.value.forEach((f) => (f.isEnabled = f.infrastructures.every((i) => enabled.includes(i))));
  }

  if (Object.hasOwn(query, 'cycloscores')) {
    const cycloscoresQuery = query.cycloscores;
    const enabled =
      cycloscoresQuery && (cycloscoresQuery as string).length > 0
        ? (cycloscoresQuery as string).split(',').filter((s) => s.length > 0)
        : [];
    cycloscoreFilters.value.forEach((f) => {
      // Handle null/empty cycloscore for "Non renseigné"
      if (f.cycloscores.includes(null as unknown as string)) {
        // "Non renseigné" is enabled by default, and disabled only if letter scores are explicitly in the query
        // Since we don't store "Non renseigné" in the URL, if there's a query, it means some letters are selected
        // So "Non renseigné" should be disabled when there's a query
        f.isEnabled = enabled.length === 0;
      } else {
        f.isEnabled = f.cycloscores.some((c) => enabled.includes(c));
      }
    });
  }

  function processDateData(geojsonData: Collections['voiesCyclablesGeojson'][] | undefined | null) {
    if (!geojsonData) return;

    const uniqueDates = new Set<number>();

    geojsonData.forEach((geojson) => {
      geojson.features.forEach((feature) => {
        if ('doneAt' in feature.properties && feature.properties.doneAt) {
          const parts = feature.properties.doneAt.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[1]!) - 1; // 0 indexed, 11 = December!
            const year = parseInt(parts[2]!);
            const monthIndex = year * 12 + month;
            uniqueDates.add(monthIndex);
          }
        }
      });
    });

    if (uniqueDates.size > 0) {
      dateSteps.value = Array.from(uniqueDates).sort((a, b) => a - b);
      dateSteps.value.push(999999);

      minDate.value = 0;
      maxDate.value = dateSteps.value.length - 1;

      if (route.query.start && route.query.end) {
        const parseYearMonth = (str: string): number => {
          const parts = str.split('-');
          if (parts.length !== 2) {
            return 999999;
          }

          const year = parseInt(parts[0]!);
          const month = parseInt(parts[1]!) - 1;
          return year * 12 + month;
        };

        const startMonth = parseYearMonth(route.query.start as string);
        const endMonth = parseYearMonth(route.query.end as string);
        const startIdx = dateSteps.value.findIndex((m) => m >= startMonth);
        const endIdx = dateSteps.value.findIndex((m) => m >= endMonth);
        dateRange.value = [startIdx >= 0 ? startIdx : 0, endIdx >= 0 ? endIdx : maxDate.value];
      } else {
        dateRange.value = [0, maxDate.value];
      }
    }
  }

  if (allGeojsons) {
    watchEffect(() => {
      if (allGeojsons.value && allGeojsons.value.length > 0) {
        processDateData(allGeojsons.value);
      }
    });
  }

  if (allLines) {
    watch(
      allLines,
      (newLines) => {
        if (newLines) {
          const linesSet = new Set<string>();
          newLines.forEach((voie) => {
            if (voie.line) linesSet.add(String(voie.line));
          });

          lineFilters.value = Array.from(linesSet)
            .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' }))
            .map((lineId) => createLineFilter(lineId));

          applyLineQueryFilter();
          upsertNonGvvFilter();
        }
      },
      { immediate: true },
    );
  }

  watch(
    allFeatures,
    () => {
      upsertNonGvvFilter();
    },
    { immediate: true },
  );

  const visibleStatuses = computed(() =>
    statusFilters.value.filter((item) => item.isEnabled).flatMap((item) => item.statuses as LaneStatus[]),
  );
  const visibleTypes = computed(() =>
    typeFilters.value.filter((item) => item.isEnabled).flatMap((item) => item.types as LaneType[]),
  );
  const visibleQualities = computed(() =>
    qualityFilters.value.filter((item) => item.isEnabled).flatMap((item) => item.qualities as LaneQuality[]),
  );
  const visibleInfrastructures = computed(() =>
    infrastructureFilters.value.filter((item) => item.isEnabled).flatMap((item) => item.infrastructures as string[]),
  );
  const visibleCycloscores = computed(() => {
    const enabled = cycloscoreFilters.value.filter((item) => item.isEnabled);
    const scores: (string | null)[] = [];
    enabled.forEach((item) => {
      item.cycloscores.forEach((c) => {
        if (c === null) {
          scores.push(null);
        } else {
          scores.push(c);
        }
      });
    });
    return scores;
  });
  const visibleLines = computed(() => lineFilters.value.filter((item) => item.isEnabled).map((item) => item.line));
  const visibleDateRange = computed(() => {
    if (dateSteps.value.length > 0) {
      const startMonth = dateSteps.value[dateRange.value[0]] || 0;
      const endMonth = dateSteps.value[dateRange.value[1]] || 999999;
      return [startMonth, endMonth] as [number, number];
    }
    return undefined;
  });

  watch(
    [statusFilters, typeFilters, qualityFilters, infrastructureFilters, cycloscoreFilters, lineFilters, dateRange],
    () => {
      const newQuery = { ...route.query };

      const allStatuses = statusFilters.value.flatMap((f) => f.statuses);
      if (visibleStatuses.value.length < allStatuses.length) {
        newQuery.statuses = visibleStatuses.value.join(',');
      } else {
        delete newQuery.statuses;
      }

      const allTypes = typeFilters.value.flatMap((f) => f.types);
      if (visibleTypes.value.length < allTypes.length) {
        newQuery.types = visibleTypes.value.join(',');
      } else {
        delete newQuery.types;
      }

      const allQualities = qualityFilters.value.flatMap((f) => f.qualities);
      if (visibleQualities.value.length < allQualities.length) {
        newQuery.qualities = visibleQualities.value.join(',');
      } else {
        delete newQuery.qualities;
      }

      const allInfrastructures = infrastructureFilters.value.flatMap((f) => f.infrastructures);
      if (visibleInfrastructures.value.length < allInfrastructures.length) {
        newQuery.infrastructures = visibleInfrastructures.value.join(',');
      } else {
        delete newQuery.infrastructures;
      }

      const allCycloscores = cycloscoreFilters.value.flatMap((f) => f.cycloscores);
      const nonNullCycloscores = visibleCycloscores.value.filter((c) => c !== null) as string[];

      // Only add query param if not all cycloscores are selected (including "Non renseigné")
      if (visibleCycloscores.value.length < allCycloscores.length) {
        // If only "Non renseigné" is selected, we don't add the query param (it's the default)
        if (nonNullCycloscores.length > 0) {
          newQuery.cycloscores = nonNullCycloscores.join(',');
        } else {
          // All letter filters are deselected, only "Non renseigné" is selected - remove query param
          delete newQuery.cycloscores;
        }
      } else {
        delete newQuery.cycloscores;
      }

      if (lineFilters.value.length > 0) {
        const allLines = lineFilters.value.map((f) => f.line);
        if (visibleLines.value.length < allLines.length) {
          newQuery.lines = visibleLines.value.join(',');
        } else {
          delete newQuery.lines;
        }
      }

      if (visibleDateRange.value && (dateRange.value[0] !== minDate.value || dateRange.value[1] !== maxDate.value)) {
        const formatMonthIndex = (monthIndex: number): string => {
          if (monthIndex >= 999999) {
            return '2026+';
          }

          const year = Math.floor(monthIndex / 12);
          const month = (monthIndex % 12) + 1;
          return `${year}-${month.toString().padStart(2, '0')}`;
        };

        newQuery.start = formatMonthIndex(visibleDateRange.value[0]);
        newQuery.end = formatMonthIndex(visibleDateRange.value[1]);
      } else {
        delete newQuery.start;
        delete newQuery.end;
      }

      if (currentPage !== route.name) {
        return;
      }
      void router.replace({ query: newQuery });
    },
    { deep: true },
  );

  const filteredFeatures = computed(() => {
    return (allFeatures.value ?? []).filter((feature) => {
      if (isLineStringFeature(feature) || isPointFeature(feature)) {
        if (
          lineFilters.value.length > 0 &&
          feature.properties.line &&
          !visibleLines.value.includes(feature.properties.line)
        ) {
          return false;
        }
      }

      if (isLineStringFeature(feature)) {
        if (visibleDateRange.value) {
          let featureMonth = 999999;
          if (feature.properties.doneAt) {
            const parts = feature.properties.doneAt.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1]!) - 1;
              const year = parseInt(parts[2]!);
              featureMonth = year * 12 + month;
            }
          }

          if (featureMonth < visibleDateRange.value[0] || featureMonth > visibleDateRange.value[1]) {
            return false;
          }
        }

        const infrastructureMatch = (() => {
          // If no infrastructure filters are enabled, show all features
          if (visibleInfrastructures.value.length === 0) {
            return true;
          }

          // If all infrastructure filters are enabled, show all features
          const allInfrastructureFiltersEnabled = infrastructureFilters.value.every((f) => f.isEnabled);
          if (allInfrastructureFiltersEnabled) {
            return true;
          }

          // If feature has no infrastructure, check if "Aucune" is enabled
          if (!feature.properties.infrastructure) {
            return visibleInfrastructures.value.includes('aucune');
          }
          // Check if the feature's infrastructure is in the visible list
          return visibleInfrastructures.value.includes(feature.properties.infrastructure);
        })();

        const cycloscoreMatch = (() => {
          // If no cycloscore filters are enabled, show no segments
          if (visibleCycloscores.value.length === 0) {
            return false;
          }

          // If all cycloscore filters are enabled (A, B, C, E, and "Non renseigné"), show all features
          const allFiltersEnabled = cycloscoreFilters.value.every((f) => f.isEnabled);
          if (allFiltersEnabled) {
            return true;
          }

          const featureCycloscore = feature.properties.cycloscore;

          // Check if cycloscore doesn't exist (undefined, null) or is empty
          const hasNoCycloscore =
            featureCycloscore === undefined ||
            featureCycloscore === null ||
            (typeof featureCycloscore === 'string' && featureCycloscore.trim() === '');

          if (hasNoCycloscore) {
            // Only match "Non renseigné" filter if cycloscore is truly missing/empty
            return visibleCycloscores.value.some((score) => score === null || score === undefined);
          }

          // Extract the first letter from the trimmed string (e.g., "E (bandes présentes en 2016)" -> "E")
          const trimmed = typeof featureCycloscore === 'string' ? featureCycloscore.trim() : '';
          if (trimmed.length === 0) {
            // Empty after processing, only match "Non renseigné"
            return visibleCycloscores.value.some((score) => score === null || score === undefined);
          }

          const cycloscoreLetter = trimmed.charAt(0).toUpperCase();

          // Check if the first letter is A, B, C, D, or E
          const isValidLetter = ['A', 'B', 'C', 'D', 'E'].includes(cycloscoreLetter);

          if (isValidLetter) {
            // Check if the feature's cycloscore first letter matches any visible cycloscore
            // This will match if the first letter is A, B, C, D, or E and that filter is enabled
            return visibleCycloscores.value.some((visibleScore) => {
              if (visibleScore === null || visibleScore === undefined) {
                return false; // "Non renseigné" only matches segments without cycloscore
              }
              // Match by first letter (A, B, C, D, E)
              return cycloscoreLetter === visibleScore;
            });
          }

          // If first letter is not A, B, C, D, or E, treat as "Non renseigné"
          return visibleCycloscores.value.some((score) => score === null || score === undefined);
        })();

        return (
          visibleStatuses.value.includes(feature.properties.status) &&
          visibleTypes.value.includes(feature.properties.type) &&
          visibleQualities.value.includes(feature.properties.quality) &&
          infrastructureMatch &&
          cycloscoreMatch
        );
      }

      return true;
    });
  });

  function computeDistance(selectedFeatures: Collections['voiesCyclablesGeojson']['features']) {
    if (!selectedFeatures || selectedFeatures.length === 0) {
      return 0;
    }

    const allUniqFeatures = getAllUniqLineStrings([{ features: selectedFeatures }]);
    return getDistance({ features: allUniqFeatures });
  }

  const totalDistance = computed(() => computeDistance(allFeatures.value));
  const filteredDistance = computed(() => computeDistance(filteredFeatures.value));

  const filters: FiltersState = {
    statusFilters,
    typeFilters,
    qualityFilters,
    infrastructureFilters,
    cycloscoreFilters,
    lineFilters,
    dateRange,
    minDate,
    maxDate,
    dateSteps,
  };

  const actions: FilterActions = {
    toggleStatusFilter(index: number) {
      statusFilters.value[index].isEnabled = !statusFilters.value[index].isEnabled;
    },
    toggleTypeFilter(index: number) {
      typeFilters.value[index].isEnabled = !typeFilters.value[index].isEnabled;
    },
    toggleQualityFilter(index: number) {
      qualityFilters.value[index].isEnabled = !qualityFilters.value[index].isEnabled;
    },
    toggleInfrastructureFilter(index: number) {
      infrastructureFilters.value[index].isEnabled = !infrastructureFilters.value[index].isEnabled;
    },
    toggleCycloscoreFilter(index: number) {
      cycloscoreFilters.value[index].isEnabled = !cycloscoreFilters.value[index].isEnabled;
    },
    toggleLineFilter(index: number) {
      lineFilters.value[index].isEnabled = !lineFilters.value[index].isEnabled;
    },
    setDateRange(newDateRange: [number, number]) {
      dateRange.value = newDateRange;
    },
  };

  return {
    filters,
    actions,
    filteredFeatures,
    totalDistance,
    filteredDistance,
  };
}

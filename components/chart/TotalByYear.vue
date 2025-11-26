<template>
  <div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true },
});

const years = [...new Set(props.data.counts.map((item: Count) => new Date(item.month).getFullYear()))].sort();
const countsValues = years.map((year) => {
  return props.data.counts
    .filter((item: Count) => new Date(item.month).getFullYear() === year)
    .reduce((acc: number, item: Count) => acc + item.count, 0);
});
const max = Math.max(...countsValues);

//Estimation pour l'année en cours
const currentYear = new Date().getFullYear();
const currentYearData = countsValues[years.length - 1];
const currentMonth = new Date().getMonth() + 1;
const estimatedTotalCurrentYear = Math.round(currentYearData * (12 / currentMonth));

const chartOptions = {
  chart: { type: 'column' },
  title: { text: props.title },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { categories: years },
  yAxis: { min: 0, title: { text: 'Passages' } },
  plotOptions: {
    column: {
      stacking: 'normal', // Empiler les colonnes
      pointPadding: 0.2,
      borderWidth: 0,
    },
    series: {
      dataLabels: {
        enabled: true,
      },
    },
  },
  series: [
    {
      name: 'Estimation',
      data: years.map((year, index) => {
        if (year === currentYear) {
          return {
            y: estimatedTotalCurrentYear - countsValues[index], // Ajoute uniquement la différence pour l'empilement
            borderColor: '#152B68',
            borderWidth: '2',
            color: 'rgba(0,0,0,0)',
            dataLabels: { enabled: true, color: '#152B68', verticalAlign: 'top', format: '{point.customTotal:,.0f}' },
            customTotal: estimatedTotalCurrentYear,
            dashStyle: 'ShortDot',
          };
        }
        return { y: null };
      }),
      tooltip: {
        pointFormat: 'Estimation totale : <strong>{point.customTotal:,.0f}</strong>',
      },
    },
    {
      name: 'Passages',
      data: countsValues.map((y, index) => {
        const color = y === max ? '#C84271' : '#152B68';
        return {
          y,
          color,
          dataLabels: {
            color,
            verticalAlign: 'top',
            y: index == countsValues.length - 1 ? 0 : -20,
          },
        };
      }),
    },
  ],
  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
          },
          yAxis: { title: { text: undefined } },
        },
      },
    ],
  },
};
</script>

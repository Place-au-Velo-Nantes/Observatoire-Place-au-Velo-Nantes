<template>
  <div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
//Composant pour avoir un graphique du nombre de passage par an, total de l'ensemble des compteurs. Mise en avant de l'année passé la plus évelée. Estimation du total pour l'année en cours.
import type { Count } from '~/types';
import type { Collections } from '@nuxt/content';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true }
});

type YearData = {
  totalCount: number;
  countersWithData: Set<number>;
};

const yearMap = new Map<number, YearData>();

//Récupération des données (années ayant des données, total passages par an, compteurs ayant des données par an)
props.data.forEach((compteur: Collections['compteurs']) => {
  compteur.counts.forEach((item: { month: string; veloCount: number }) => {
    const year = new Date(item.month).getFullYear();

    if (!yearMap.has(year)) {
      yearMap.set(year, { totalCount: 0, countersWithData: new Set() });
    }

    //Données pour cette année
    const yearData = yearMap.get(year)!;

    yearData.totalCount += item.veloCount;

    yearData.countersWithData.add(compteur.idPdc);
  });
});

//Années uniques triées
const years = Array.from(yearMap.keys()).sort();

//Passages totaux pour chaque année
const countsValues = years.map(year => yearMap.get(year)!.totalCount);

//Nombre de compteurs avec des données pour chaque année
const countOfCountersWithDataPerYear = years.map(year => yearMap.get(year)!.countersWithData.size);

//Nombre de passages maximum pour mettre en avant cette année-là
const max = Math.max(...countsValues);

const maxAvg = Math.max(
  ...countsValues.map((count, index) => Math.round(count / countOfCountersWithDataPerYear[index]))
);

//Estimation pour l'année en cours
const currentYear = new Date().getFullYear();
const currentYearData = countsValues[years.length - 1];
const currentMonth = new Date().getMonth() + 1;
const estimatedTotalCurrentYear = Math.round(currentYearData * (12 / currentMonth));

const chartOptions = {
  chart: { type: 'column' },
  title: { text: props.title },
  credits: { enabled: true, text: 'Source des données', href: '#sources' },
  legend: { enabled: true },
  xAxis: { categories: years },
  yAxis: { min: 0, title: { text: 'Passages' } },
  plotOptions: {
    column: {
      stacking: 'normal', // Empiler les colonnes
      pointPadding: 0.2,
      borderWidth: 0
    },
    series: {
      dataLabels: {
        enabled: true
      }
    }
  },
  series: [
    {
      name: 'Estimation passages',
      data: years.map((year, index) => {
        if (year === currentYear) {
          return {
            y: estimatedTotalCurrentYear - countsValues[index], // Ajoute uniquement la différence pour l'empilement
            borderColor: '#1b5aa2',
            borderWidth: '2',
            color: 'rgba(0,0,0,0)',
            dataLabels: { enabled: true, color: '#1b5aa2', verticalAlign: 'top', format: '{point.customTotal:,.0f}' },
            customTotal: estimatedTotalCurrentYear,
            dashStyle: 'ShortDot'
          };
        }
        return { y: null };
      }),
      tooltip: {
        pointFormat: 'Estimation totale : <strong>{point.customTotal:,.0f}</strong>'
      },
      stack: 'total',
      color: '#1b5aa2',
      visible: false
    },
    {
      name: 'Passages',
      data: countsValues.map((y, index) => {
        const color = y === max ? '#C84271' : '#1b5aa2';
        return {
          y,
          color,
          dataLabels: {
            color,
            verticalAlign: 'top',
            y: index == countsValues.length - 1 ? 0 : -20
          },
          countersCount: countOfCountersWithDataPerYear[index]
        };
      }),
      tooltip: {
        pointFormat: 'Passages : <strong>{point.y:,.0f}</strong><br/>Sur {point.countersCount} compteurs'
      },
      stack: 'total',
      color: '#1b5aa2',
      visible: false
    },
    {
      name: 'Estimation passages moyens',
      data: years.map((year, index) => {
        if (year === currentYear) {
          return {
            y: Math.round((estimatedTotalCurrentYear - countsValues[index]) / countOfCountersWithDataPerYear[index]), // Ajoute uniquement la différence pour l'empilement
            borderColor: '#152B68',
            borderWidth: '2',
            color: 'rgba(0,0,0,0)',
            dataLabels: { enabled: true, color: '#152B68', verticalAlign: 'top', format: '{point.customTotal:,.0f}' },
            customTotal: Math.round(estimatedTotalCurrentYear / countOfCountersWithDataPerYear[index]),
            dashStyle: 'ShortDot'
          };
        }
        return { y: null };
      }),
      tooltip: {
        pointFormat: "Estimation en fin d'année : <strong>{point.customTotal:,.0f}</strong>"
      },
      stack: 'avg',
      color: '#152B68'
    },
    {
      name: 'Passages moyens par compteurs',
      data: countsValues.map((counts, index) => {
        const y = Math.round(counts / countOfCountersWithDataPerYear[index]);
        const color = y === maxAvg ? '#C84271' : '#152B68';
        return {
          y,
          color,
          dataLabels: {
            verticalAlign: 'top',
            y: index == countsValues.length - 1 ? 0 : -20,
            color
          },
          countersCount: countOfCountersWithDataPerYear[index]
        };
      }),
      tooltip: {
        pointFormat:
          'Passages moyens sur <strong>{point.countersCount}</strong> compteurs : <strong>{point.y:,.0f}</strong>'
      },
      stack: 'avg',
      color: '#152B68'
    }
  ],
  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          },
          yAxis: { title: { text: undefined } }
        }
      }
    ]
  }
};
</script>

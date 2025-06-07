import { writeFileSync } from 'node:fs';

const fixType = type => {
  const validTypes = [
    'bidirectionnelle',
    'bilaterale',
    'voie-bus',
    'voie-bus-elargie',
    'velorue',
    'voie-verte',
    'bandes-cyclables',
    'zone-de-rencontre',
    'inconnu',
    'aucun'
  ];

  if (validTypes.includes(type)) {
    return type;
  } else if (type === 'bande cyclable') {
    return 'bandes-cyclables';
  } else if (type === 'voie bus') {
    return 'voie-bus';
  } else if (type === 'monodirectionnelle') {
    return 'bandes-cyclables';
  } else if (type === 'voie verte') {
    return 'voie-verte';
  } else if (type === 'chaussidou') {
    return 'bandes-cyclables';
  } else if (type) {
    console.error(`Invalid type '${type}'`);
  }

  return 'inconnu';
};

const fixStatus = status => {
  const validStatus = ['done', 'wip', 'planned', 'tested', 'postponed', 'unknown', 'variante', 'variante-postponed'];
  if (validStatus.includes(status)) {
    return status;
  } else if (status === 'réalisé' || status === 'terminé') {
    return 'done';
  } else if (status === 'en cours') {
    return 'wip';
  } else if (status === 'à venir') {
    return 'planned';
  } else if (status === 'reporté') {
    return 'postponed';
  } else if (status) {
    console.error(`Invalid status '${status}'`);
  }
  return 'unknown';
};

export const processAndSaveFeatures = voies => {
  const fixedVoies = {};

  voies.forEach(voie => {
    const line = Number(voie._path.slice(-1));
    if (!fixedVoies[line]) {
      fixedVoies[line] = {
        type: 'FeatureCollection',
        features: []
      };
    }

    const fixedFeatures = voie.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        id: '_ajouter-id-',
        line,
        name: feature.properties.nom,
        status: fixStatus(feature.properties.status),
        doneAt: '08/07/2005',
        type: fixType(feature.properties.type),
        quality: 'satisfactory'
      }
    }));

    fixedVoies[line].features.push(...fixedFeatures);
  });

  // Save each line's features to a separate file
  Object.entries(fixedVoies).forEach(([line, featureCollection]) => {
    const fileName = `content/voies-cyclables/ligne-${line}_fixed.json`;
    const fileContent = JSON.stringify(featureCollection, null, 2);
    writeFileSync(fileName, fileContent);
    console.log(`Saved fixed features for line ${line} to ${fileName}`);
  });

  return Object.values(fixedVoies).flatMap(collection => collection.features);
};

interface VoieProperties {
  nom?: string;
  status?: string;
  type?: string;
  year?: number | string;
}

interface VoieFeature {
  type: string;
  properties: VoieProperties;
  geometry: {
    coordinates: number[][];
    type: string;
  };
}

interface VoieData {
  _path?: string;
  features: VoieFeature[];
}

export const useVoiesCyclables = () => {
  const fixType = (type: string): string => {
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

  const fixStatus = (status: string): string => {
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

  const getFixedVoiesCyclables = async () => {
    const { data: voies } = await useAsyncData('voies-cyclables', () => {
      return queryContent('voies-cyclables').where({ _type: 'json' }).find();
    });

    if (!voies.value) {
      return [];
    }

    const features = (voies.value as unknown as VoieData[])
      .map((voie: VoieData) => {
        // get last character of path to determine line number
        const line = voie._path ? Number(voie._path.slice(-1)) : 0;
        return voie.features.map((feature: VoieFeature) => {
          const properties = {
            id: '_ajouter-id-',
            line,
            name: feature.properties.nom || '',
            status: fixStatus(feature.properties.status || ''),
            doneAt: '08/07/2005',
            type: fixType(feature.properties.type || ''),
            quality: 'satisfactory'
          };
          return { ...feature, properties };
        });
      })
      .flat();

    return features;
  };

  return {
    getFixedVoiesCyclables,
    fixType,
    fixStatus
  };
};

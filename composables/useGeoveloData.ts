import type { LineStringFeature } from '~/types';

export const useGeoveloData = async () => {
  return await useAsyncData('geovelo-hors-gvv', async () => {
    // Only run on server
    if (!process.server) {
      return [];
    }

    try {
      // Read the file from the content directory on the server
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.join(
        process.cwd(),
        'content',
        'voies-cyclables-brut',
        'export geovelo 01-12-25 amg cyclable sur NM.geojson',
      );

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const response = JSON.parse(fileContent) as {
        type: 'FeatureCollection';
        features: Array<{
          type: 'Feature';
          properties: Record<string, any>;
          geometry: {
            type: 'MultiLineString';
            coordinates: [number, number][][];
          };
        }>;
      };

      if (!response || !response.features) {
        return [];
      }

      // Transform GeoVelo features to the expected format
      const transformedFeatures: LineStringFeature[] = [];

      for (const feature of response.features) {
        // Convert MultiLineString to LineString features
        if (feature.geometry.type === 'MultiLineString') {
          for (const coordinates of feature.geometry.coordinates) {
            // Map GeoVelo properties to expected format
            const ame = feature.properties.ame_d || feature.properties.ame_g || 'AUCUN';
            const statut = feature.properties.statut_d || feature.properties.statut_g || 'EN SERVICE';

            // Map amenagement type
            let type: LineStringFeature['properties']['type'] = 'inconnu';
            if (ame.includes('PISTE CYCLABLE')) {
              type = 'voie-verte';
            } else if (ame.includes('BANDE CYCLABLE')) {
              type = 'bandes-cyclables';
            } else if (ame.includes('VOIE VERTE')) {
              type = 'voie-verte';
            } else if (ame.includes('CHAUSSEE A VOIE CENTRALE BANALISEE')) {
              type = 'chaucidou';
            } else if (ame.includes('AMENAGEMENT MIXTE')) {
              type = 'voie-verte';
            }

            // Map status
            let status: LineStringFeature['properties']['status'] = 'done';
            if (statut !== 'EN SERVICE') {
              status = 'unknown';
            }

            // Generate a name from properties
            const name = feature.properties.nom_officiel
              ? `Voie cyclable - ${feature.properties.nom_officiel}`
              : `Voie cyclable - ${feature.properties.id_local || 'Sans nom'}`;

            transformedFeatures.push({
              type: 'Feature',
              properties: {
                line: 'X', // Hors GVV
                name,
                status,
                type,
                quality: 'not-rated-yet',
              },
              geometry: {
                type: 'LineString',
                coordinates: coordinates as [number, number][],
              },
            });
          }
        }
      }

      return transformedFeatures;
    } catch (error) {
      console.error('Error loading GeoVelo data:', error);
      return [];
    }
  });
};


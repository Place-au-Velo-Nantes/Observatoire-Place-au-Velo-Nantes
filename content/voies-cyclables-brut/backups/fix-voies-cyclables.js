#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// infrastructure
/*
- magistrale
- structurante
- secondaire
- maillage
- liaisons
*/

// quality
/*
TSV / 1 2 1 3 2 1 --> score sur 20
*/

// Fix functions extracted from the composable
const fixType = type => {
  const validTypes = [
    'bidirectionnelle',
    'bilaterale',
    'voie-bus',
    'voie-bus-elargie',
    'velorue',
    'voie-verte',
    'bandes-cyclables',
    'chaucidou',
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
    // } else if (type === 'chaucidou') {
    //   return 'bandes-cyclables';
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

const processVoiesFiles = () => {
  const brutDir = 'content/voies-cyclables-brut';
  const outputDir = 'content/voies-cyclables';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all JSON files from brut directory
  const files = fs.readdirSync(brutDir).filter(file => file.endsWith('.json'));

  console.log(`Found ${files.length} files to process...`);

  files.forEach(filename => {
    const inputPath = path.join(brutDir, filename);
    const outputPath = path.join(outputDir, filename);

    console.log(`Processing ${filename}...`);

    try {
      // Read the raw JSON file
      const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

      // Extract line number from filename (e.g., 'ligne-1.json' -> 1)
      const line = parseInt(filename.match(/ligne-(\d+)\.json/)?.[1] || '0');

      // Process each feature
      const processedFeatures = rawData.features.map((feature, index) => {
        const properties = {
          id: `${feature.properties.nom?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unnamed'}-${index}`,
          line,
          name: feature.properties.nom || '',
          status: fixStatus(feature.properties.status || ''),
          doneAt: '08/07/2005',
          type: fixType(feature.properties.type || ''),
          quality: 'satisfactory'
        };

        return { ...feature, properties };
      });

      // Create the processed data structure
      const processedData = {
        ...rawData,
        features: processedFeatures
      };

      // Write the processed file
      fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
      console.log(`✓ Saved ${filename} with ${processedFeatures.length} features`);
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
    }
  });

  console.log('Processing complete!');
};

// Run the script
processVoiesFiles();

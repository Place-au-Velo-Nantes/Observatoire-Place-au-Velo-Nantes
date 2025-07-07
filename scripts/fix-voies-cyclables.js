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
  } else if (type === 'bande cyclable' || type === 'bande cylable') {
    return 'bandes-cyclables';
  } else if (type === 'voie bus') {
    return 'voie-bus';
  } else if (type === 'chaussidou') {
    return 'chaucidou';
  } else if (type === 'monodirectionnelle' || type === 'monodirectionnellea') {
    return 'bandes-cyclables';
  } else if (type === 'vélorue') {
    return 'velorue';
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
  const files = fs.readdirSync(brutDir).filter(file => file.endsWith('.geojson'));

  console.log(`Found ${files.length} files to process...`);

  const lines = {};

  files.forEach(filename => {
    const inputPath = path.join(brutDir, filename);
    console.log(`Processing ${filename}...`);

    try {
      // Read the raw JSON file
      const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

      // Process each feature
      rawData.features.map((feature, index) => {
        let line_letters = feature.properties.line;

        if (!line_letters) {
          line_letters = '0';
          return;
        }

        const is_multiple_lines = line_letters.split(',').length > 1;

        line_letters.split(',').forEach(line_letter => {
          if (line_letter === '?') {
            line_letter = 'X';
          }
          if (!lines[line_letter]) {
            lines[line_letter] = [];
          }

          let name = feature.properties.nom ? feature.properties.nom : line_letter + `#${index}`;

          let properties = {
            line: line_letter,
            name,
            status: fixStatus(feature.properties.status || ''),
            doneAt: '01/01/2000',
            type: fixType(feature.properties.type || ''),
            quality: feature.properties.quality || 'not-rated-yet',
            infrastructure: feature.properties.infrastrcuture || '',
            link: feature.properties.link || ''
          };

          if (is_multiple_lines) {
            properties.id = feature.properties.nom
              ? feature.properties.nom.toLowerCase().replace(/[^a-z0-9]/g, '-')
              : 'sans-titre#' + index;
          }

          const line_feature = JSON.parse(JSON.stringify(feature));
          line_feature.properties = properties;

          lines[line_letter].push(line_feature);
        });
      });

      Object.keys(lines).forEach(line_letter => {
        const outputPath = path.join(outputDir, `ligne-${line_letter}.json`);
        const processedData = {
          type: 'FeatureCollection',
          features: lines[line_letter]
        };

        fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
        console.log(`✓ Saved ${outputPath} with ${lines[line_letter].length} features`);
      });
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
    }
  });

  console.log('Processing complete!');
};

// Run the script
processVoiesFiles();

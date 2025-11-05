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
  } else if (type === 'piste bidir') {
    return 'bidirectionnelle';
  } else if (type === 'chaussidou' || type === 'chaussidou et bandes cyclables') {
    return 'chaucidou';
  } else if (type === 'monodirectionnelle' || type === 'monodirectionnellea') {
    return 'bandes-cyclables';
  } else if (type === 'vélorue') {
    return 'velorue';
  } else if (type === 'zone de rencontre') {
    return 'zone-de-rencontre';
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

const fixQuality = quality => {
  if (quality === 'satisfaisant') return 'satisfactory';
  else if (quality === 'non-satisfaisant') return 'unsatisfactory';
  return 'not-rated-yet';
};

const fixDoneDate = doneAt => {
  if (!doneAt) return '01/01/2000';
  console.log(doneAt);
  if (!/^\d{4}$/.test(doneAt)) {
    console.error(`Invalid year '${doneAt}', expected a 4-digit year like 2025`);
    process.exit(1);
  }
  return `${doneAt}`;
};

// Function to add dangers to appropriate lines
const addDangersToLines = () => {
  try {
    // Read the dangers file
    const dangersPath = path.join(__dirname, '../content/voies-cyclables-brut/dangers.geojson');
    const dangersData = JSON.parse(fs.readFileSync(dangersPath, 'utf8'));

    console.log(`Found ${dangersData.features.length} danger points`);

    // Track which lines need to be updated
    const linesToUpdate = {};

    // Process each danger point
    let assignedCount = 0;
    let defaultToXCount = 0;

    for (let i = 0; i < dangersData.features.length; i++) {
      const danger = dangersData.features[i];

      // Use the line field from the danger, or default to 'X' if empty
      let targetLine = danger.properties.line;
      if (!targetLine || targetLine.trim() === '') {
        targetLine = 'X';
        defaultToXCount++;
        console.log(`Danger ${i + 1}: No line specified, adding to line X`);
      } else {
        assignedCount++;
        console.log(`Danger ${i + 1}: Using specified line ${targetLine}`);
      }

      // Create a new feature with proper properties
      const dangerFeature = {
        type: 'Feature',
        geometry: danger.geometry,
        properties: {
          type: 'danger',
          name: danger.properties.name || `Danger ${i + 1}`,
          description: danger.properties.description || '',
          danger: danger.properties.danger || '',
          info_barometre: danger.properties.info_barometre || 'oui'
        }
      };

      // Add to the appropriate line
      if (!linesToUpdate[targetLine]) {
        linesToUpdate[targetLine] = [];
      }
      linesToUpdate[targetLine].push(dangerFeature);
    }

    // Update each line file
    for (const [lineId, features] of Object.entries(linesToUpdate)) {
      const linePath = path.join(__dirname, `../content/voies-cyclables/ligne-${lineId}.json`);

      let lineData;
      if (fs.existsSync(linePath)) {
        lineData = JSON.parse(fs.readFileSync(linePath, 'utf8'));
        // Remove existing danger features to prevent duplicates
        lineData.features = lineData.features.filter(feature => feature.properties.type !== 'danger');
      } else {
        lineData = {
          type: 'FeatureCollection',
          features: []
        };
      }

      // Add the danger features to this line
      lineData.features.push(...features);

      // Write the updated line file
      fs.writeFileSync(linePath, JSON.stringify(lineData, null, 2));
      console.log(
        `✓ Updated ligne-${lineId}.json with ${features.length} danger features (total: ${lineData.features.length})`
      );
    }

    console.log('\n=== DANGERS SUMMARY ===');
    console.log(`Total danger points: ${dangersData.features.length}`);
    console.log(`Assigned to specified lines: ${assignedCount}`);
    console.log(`Defaulted to line X: ${defaultToXCount}`);

    // Show statistics by line
    console.log('\n=== DANGERS BY LINE ===');
    Object.entries(linesToUpdate)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([line, features]) => {
        console.log(`Line ${line}: ${features.length} dangers`);
      });
  } catch (error) {
    console.error('Error adding dangers to lines:', error);
  }
};

const processVoiesFiles = () => {
  const brutDir = 'content/voies-cyclables-brut';
  const outputDir = 'content/voies-cyclables';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all JSON files from brut directory, excluding dangers.geojson
  const files = fs.readdirSync(brutDir).filter(file => file.endsWith('.geojson') && file !== 'dangers.geojson');

  console.log(`Found ${files.length} files to process...`);

  const lines = {};
  // Track counters for auto-generated names per line to ensure uniqueness
  const nameCounters = {};

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
          line_letters = 'X';
          console.warn(`Warning: Feature at index ${index} in ${filename} has no line property. Assigned to line 'X'.`);
        }

        const is_multiple_lines = line_letters.split(',').length > 1;

        line_letters.split(',').forEach(line_letter => {
          if (line_letter === '?' || line_letter === 'M' || line_letter === 'S') {
            line_letter = 'X';
          }
          if (!lines[line_letter]) {
            lines[line_letter] = [];
          }
          if (!nameCounters[line_letter]) {
            nameCounters[line_letter] = 0;
          }

          // Get existing names for this line to check for duplicates
          const existingNames = new Set(lines[line_letter].map(f => f.properties?.name));

          // Generate unique name if feature doesn't have one
          let name = feature.properties.name;
          if (!name || name.trim() === '') {
            // Use counter to ensure uniqueness across all files
            // Keep incrementing until we find a unique name
            do {
              nameCounters[line_letter]++;
              name = line_letter + `#${nameCounters[line_letter]}`;
            } while (existingNames.has(name));
          } else {
            // Check if name already exists for this line to avoid duplicates
            if (existingNames.has(name)) {
              // If duplicate, append counter to make it unique
              // Keep incrementing until we find a unique name
              const baseName = name;
              do {
                nameCounters[line_letter]++;
                name = baseName + `-${nameCounters[line_letter]}`;
              } while (existingNames.has(name));
            }
          }

          let properties = {
            line: line_letter,
            name,
            status: fixStatus(feature.properties.status || ''),
            doneAt: fixDoneDate(feature.properties.year),
            type: fixType(feature.properties.type || ''),
            quality: fixQuality(feature.properties.quality),
            infrastructure: feature.properties.infrastructure || '',
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

// Main execution function
const main = () => {
  console.log('=== PROCESSING VOIES CYCLABLES ===');
  processVoiesFiles();

  console.log('\n=== ADDING DANGERS TO LINES ===');
  addDangersToLines();

  console.log('\n=== ALL PROCESSING COMPLETE ===');
};

// Run the script
main();

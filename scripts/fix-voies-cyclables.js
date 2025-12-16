#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// infrastructure
/*
- magistrale
- structurante
- secondaire
- maillage
- aucune
*/

// quality
/*
TSV / 1 2 1 3 2 1 --> score sur 20
*/

// Fix functions extracted from the composable
const fixType = (type) => {
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
    'aucun',
  ];

  if (validTypes.includes(type)) {
    return type;
  } else if (type === 'bande cyclable' || type === 'bande cylable' || type === 'piste ou bande cyclable') {
    return 'bandes-cyclables';
  } else if (type === 'voie bus' || type === 'voie busway' || type === 'voie bus ou piste') {
    return 'voie-bus';
  } else if (type === 'piste cyclable' || type === 'piste') {
    return 'bilaterale';
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
  } else if (type === 'chemin rural' || type === 'route partagée') {
    return 'aucun';
  } else if (type) {
    console.error(`Invalid type '${type}'`);
  }

  return 'inconnu';
};

const fixStatus = (status) => {
  const validStatus = ['done', 'wip', 'planned', 'tested', 'postponed', 'unknown', 'variante', 'variante-postponed'];

  const lowercaseStatus = status.toLowerCase();
  if (validStatus.includes(lowercaseStatus)) {
    return status;
  } else if (lowercaseStatus === 'réalisé' || lowercaseStatus === 'terminé' || lowercaseStatus === 'Terminé') {
    return 'done';
  } else if (lowercaseStatus === 'en cours' || lowercaseStatus === 'en travaux') {
    return 'wip';
  } else if (lowercaseStatus === 'à venir') {
    return 'planned';
  } else if (lowercaseStatus === 'reporté') {
    return 'postponed';
  } else if (['à définir', 'a définir', 'aucun'].includes(lowercaseStatus)) {
    return 'unknown';
  } else if (lowercaseStatus) {
    console.error(`Invalid status '${lowercaseStatus}'`);
  }
  return 'unknown';
};

const fixQuality = (quality) => {
  if (quality === 'satisfaisant') return 'satisfactory';
  else if (quality === 'non satisfaisant' || quality === 'non satisafaisant') return 'unsatisfactory';
  else if (quality !== null && quality !== '') {
    console.error(`Invalid quality '${quality}'`);
    process.exit(1);
  }
  return 'not-rated-yet';
};

const fixDoneDate = (doneAt) => {
  if (!doneAt) return '01/01/2000';
  if (!/^\d{4}$/.test(doneAt)) {
    console.error(`Invalid year '${doneAt}', expected a 4-digit year like 2025`);
    process.exit(1);
  }
  return `01/01/${doneAt}`;
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

      // Get lines from danger properties, or default to 'X' if empty
      let targetLines = danger.properties.line;
      if (!targetLines || targetLines.trim() === '') {
        targetLines = 'X';
        defaultToXCount++;
      } else {
        assignedCount++;
      }

      // Create a new feature with proper properties (excluding line property)
      const dangerFeature = {
        type: 'Feature',
        geometry: danger.geometry,
        properties: {
          type: 'danger',
          name: danger.properties.name || `Danger ${i + 1}`,
          description: danger.properties.description || '',
          danger: danger.properties.danger || '',
          info_barometre: danger.properties.info_barometre || 'oui',
        },
      };

      // Split by comma and add to all specified lines
      const lines = targetLines.split(',').map((line) => line.trim());
      lines.forEach((lineId) => {
        // Normalize line IDs (handle special cases)
        if (lineId === '?' || lineId === 'M' || lineId === 'S') {
          lineId = 'X';
        }

        // Remove quotes and extra spaces
        lineId = lineId.replace(/['"]/g, '').trim();

        // Split complex IDs like E/G into separate lines [E, G]
        if (lineId.includes('/')) {
          const splitLines = lineId.split('/');
          splitLines.forEach((splitLine) => {
            const cleanLine = splitLine.trim();
            if (!linesToUpdate[cleanLine]) {
              linesToUpdate[cleanLine] = [];
            }
            linesToUpdate[cleanLine].push(dangerFeature);
          });
          return; // Continue to next iteration of the outer loop
        }

        if (!linesToUpdate[lineId]) {
          linesToUpdate[lineId] = [];
        }
        linesToUpdate[lineId].push(dangerFeature);
      });
    }

    // Update each line file
    for (const [lineId, features] of Object.entries(linesToUpdate)) {
      const linePath = path.join(__dirname, `../content/voies-cyclables/ligne-${lineId}.json`);

      let lineData;
      if (fs.existsSync(linePath)) {
        lineData = JSON.parse(fs.readFileSync(linePath, 'utf8'));
        // Remove existing danger features to prevent duplicates
        lineData.features = lineData.features.filter((feature) => feature.properties.type !== 'danger');
      } else {
        lineData = {
          type: 'FeatureCollection',
          features: [],
        };
      }

      // Add the danger features to this line
      lineData.features.push(...features);

      // Write the updated line file
      fs.writeFileSync(linePath, JSON.stringify(lineData, null, 2));
      console.log(
        `✓ Updated ligne-${lineId}.json with ${features.length} danger features (total: ${lineData.features.length})`,
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

  // Read all JSON files from brut directory, excluding dangers.geojson and gvv-missing-info.geojson
  const files = fs
    .readdirSync(brutDir)
    .filter((file) => file.endsWith('.geojson') && file !== 'dangers.geojson' && file !== 'gvv-missing-info.geojson');

  console.log(`Found ${files.length} files to process...`);

  const lines = {};
  // Track counters for auto-generated names per line to ensure uniqueness
  const nameCounters = {};

  files.forEach((filename) => {
    const inputPath = path.join(brutDir, filename);
    console.log(`Processing ${filename}...`);

    try {
      // Read the raw JSON file
      const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

      if (filename === 'gvv.geojson') {
        const missingInfoPath = path.join(brutDir, 'gvv-missing-info.geojson');
        if (fs.existsSync(missingInfoPath)) {
          console.log('Merging gvv-missing-info.geojson into gvv.geojson...');
          const missingInfoData = JSON.parse(fs.readFileSync(missingInfoPath, 'utf8'));

          // Create set of names from missing info (ignoring empty names)
          const missingInfoNames = new Set(
            missingInfoData.features.map((f) => f.properties.name).filter((name) => name && name.trim() !== ''),
          );

          // Filter out features from gvv that exist in missing info
          const originalCount = rawData.features.length;
          rawData.features = rawData.features.filter((f) => {
            const name = f.properties.name;
            return !name || name.trim() === '' || !missingInfoNames.has(name);
          });

          console.log(
            `Removed ${originalCount - rawData.features.length} features from gvv.geojson that are present in missing info.`,
          );

          // Add all features from missing info
          rawData.features.push(...missingInfoData.features);
          console.log(`Added ${missingInfoData.features.length} features from missing info.`);
        }
      }

      // Process each feature
      rawData.features.map((feature, index) => {
        let line_letters = feature.properties.line;

        if (!line_letters) {
          line_letters = 'X';
          // console.warn(`Warning: Feature at index ${index} in ${filename} has no line property. Assigned to line 'X'.`);
        }

        const is_multiple_lines = line_letters.split(',').length > 1;

        line_letters.split(',').forEach((line_letter) => {
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
          const existingNames = new Set(lines[line_letter].map((f) => f.properties?.name));

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

          let infrastructure = '';
          if (filename === 'magistral.geojson') {
            infrastructure = 'magistrale';
          } else if (filename === 'structurante.geojson') {
            infrastructure = 'structurante';
          } else {
            infrastructure = feature.properties.infrastructure || 'aucune';
          }

          const doneAt = fixDoneDate(feature.properties.year);
          let status = fixStatus(feature.properties.status || '');

          if (feature.properties.year && status === 'unknown') {
            status = 'done';
          }

          let properties = {
            line: line_letter,
            name,
            status,
            doneAt,
            type: fixType(feature.properties.type || ''),
            quality: fixQuality(feature.properties.quality),
            infrastructure,
            link: feature.properties.link || '',
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

      Object.keys(lines).forEach((line_letter) => {
        const outputPath = path.join(outputDir, `ligne-${line_letter}.json`);
        const processedData = {
          type: 'FeatureCollection',
          features: lines[line_letter],
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

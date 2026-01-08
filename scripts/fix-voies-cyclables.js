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
const fixType = (type, context, invalidValues) => {
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
    'aire-pietonne',
    'inconnu',
    'aucun',
  ];

  if (!type) {
    return 'inconnu';
  }

  const originalType = type;
  const lowerType = type.toLowerCase();
  if (validTypes.includes(lowerType)) {
    return lowerType;
  } else if (
    lowerType === 'bande cyclable' ||
    lowerType === 'bande cylable' ||
    lowerType === 'piste ou bande cyclable'
  ) {
    return 'bandes-cyclables';
  } else if (lowerType === 'voie bus' || lowerType === 'voie busway' || lowerType === 'voie bus ou piste') {
    return 'voie-bus';
  } else if (['piste cyclable', 'piste', 'monodirectionnelle', 'monodirectionnellea'].includes(lowerType)) {
    return 'bilaterale';
  } else if (lowerType === 'piste bidir') {
    return 'bidirectionnelle';
  } else if (lowerType === 'chaussidou' || lowerType === 'chaussidou et bandes cyclables') {
    return 'chaucidou';
  } else if (lowerType === 'vélorue') {
    return 'velorue';
  } else if (lowerType === 'zone de rencontre') {
    return 'zone-de-rencontre';
  } else if (lowerType === 'aire piétonne' || lowerType === 'aire pietonne' || lowerType === 'aire-pietonne') {
    return 'aire-pietonne';
  } else if (lowerType === 'voie verte') {
    return 'voie-verte';
  } else if (lowerType === 'chemin rural' || lowerType === 'route partagée') {
    return 'aucun';
  } else {
    if (invalidValues && context) {
      invalidValues.push({
        name: context.name,
        line: context.line,
        field: 'type',
        value: originalType,
      });
    }
  }

  return 'inconnu';
};

const fixStatus = (status, context, invalidValues) => {
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
    if (invalidValues && context) {
      invalidValues.push({
        name: context.name,
        line: context.line,
        field: 'status',
        value: status,
      });
    }
  }
  return 'unknown';
};

const fixQuality = (quality, context, invalidValues) => {
  if (quality === 'satisfaisant') return 'satisfactory';
  else if (quality === 'non satisfaisant' || quality === 'non satisafaisant') return 'unsatisfactory';
  else if (quality !== null && quality !== '' && quality !== undefined) {
    if (invalidValues && context) {
      invalidValues.push({
        name: context.name,
        line: context.line,
        field: 'quality',
        value: quality,
      });
    }
  }
  return 'not-rated-yet';
};

const fixDoneDate = (doneAt, context, invalidValues) => {
  if (!doneAt) return '01/01/2000';
  if (!/^\d{4}$/.test(doneAt)) {
    if (invalidValues && context) {
      invalidValues.push({
        name: context.name,
        line: context.line,
        field: 'doneAt',
        value: doneAt,
      });
    }
    return '01/01/2000'; // Default value instead of exiting
  }
  return `01/01/${doneAt}`;
};

const fixInfrastructure = (infrastructure, context, invalidValues) => {
  const validInfrastructures = ['magistrale', 'structurante', 'secondaire', 'maillage', 'aucune'];

  if (validInfrastructures.includes(infrastructure)) {
    return infrastructure;
  } else if (infrastructure && infrastructure.trim() !== '') {
    if (invalidValues && context) {
      invalidValues.push({
        name: context.name,
        line: context.line,
        field: 'infrastructure',
        value: infrastructure,
      });
    }
  }

  return 'aucune';
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
        // Remove quotes and extra spaces
        lineId = lineId.replace(/['"]/g, '').trim().toUpperCase();

        // Normalize line IDs (handle special cases)
        if (lineId === '?' || lineId === 'M' || lineId === 'S') {
          lineId = 'X';
        }

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
    .filter((file) => file.endsWith('.geojson') && file !== 'dangers.geojson' && file !== 'gvv-missing-info.geojson')
    .sort();

  console.log(`Found ${files.length} files to process...`);

  const lines = {};
  // Track counters for auto-generated names per line to ensure uniqueness
  const nameCounters = {};
  // Track invalid values for reporting
  const invalidValues = [];

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
          line_letter = line_letter.trim().toUpperCase();

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

          // Create context for tracking invalid values
          const context = { name, line: line_letter };

          let infrastructure = '';
          if (filename === 'magistral.geojson') {
            infrastructure = 'magistrale';
          } else if (filename === 'structurante.geojson') {
            infrastructure = 'structurante';
          } else {
            infrastructure = fixInfrastructure(feature.properties.infrastructure || 'aucune', context, invalidValues);
          }

          const doneAt = fixDoneDate(feature.properties.year, context, invalidValues);
          let status = fixStatus(feature.properties.status || '', context, invalidValues);

          if (feature.properties.year && status === 'unknown') {
            status = 'done';
          }

          let properties = {
            line: line_letter,
            name,
            status,
            doneAt,
            type: fixType(feature.properties.type || '', context, invalidValues),
            quality: fixQuality(feature.properties.quality, context, invalidValues),
            infrastructure,
            link: feature.properties.link || '',
          };

          // Add cycloscore if present (from "cycloscore(optionnel)" field)
          // Keep the full cycloscore value as-is (filters will extract first letter for matching)
          const cycloscore = feature.properties['cycloscore(optionnel)'];
          if (cycloscore && cycloscore.trim() !== '') {
            properties.cycloscore = cycloscore;
          } else {
            properties.cycloscore = '';
          }

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

  return invalidValues;
};

// Function to output invalid values
const outputInvalidValues = (invalidValues) => {
  if (invalidValues.length === 0) {
    console.log('\n✓ No invalid values found!');
    return;
  }

  console.log('\n=== INVALID VALUES FOUND ===');
  console.log(`Total: ${invalidValues.length} invalid value(s)\n`);

  // Output to terminal in markdown format
  console.log('```');
  invalidValues.forEach((item) => {
    console.log(`- **${item.name}** (ligne ${item.line}): \`${item.field}\` = \`${item.value}\``);
  });
  console.log('```');

  // Output to markdown file
  const markdownPath = path.join(__dirname, '../invalid-values-report.md');
  let markdown = `# Invalid Values Report\n\n`;
  // markdown += \`Generated: \${new Date().toISOString()}\n\n\`; // Commented out to avoid noise in git history
  markdown += `Total: ${invalidValues.length} invalid value(s)\n\n`;
  markdown += `## Issues\n\n`;
  invalidValues.forEach((item) => {
    markdown += `- **${item.name}** (ligne ${item.line}): \`${item.field}\` = \`${item.value}\`\n`;
  });

  fs.writeFileSync(markdownPath, markdown);
  console.log(`\n✓ Invalid values report saved to: ${markdownPath}`);
};

// Main execution function
const main = () => {
  // Remove invalid-values-report.md if it exists
  const markdownPath = path.join(__dirname, '../invalid-values-report.md');
  if (fs.existsSync(markdownPath)) {
    fs.unlinkSync(markdownPath);
    console.log('Removed existing invalid-values-report.md');
  }

  console.log('=== PROCESSING VOIES CYCLABLES ===');
  const invalidValues = processVoiesFiles();

  console.log('\n=== ADDING DANGERS TO LINES ===');
  addDangersToLines();

  // Output invalid values
  outputInvalidValues(invalidValues);

  console.log('\n=== ALL PROCESSING COMPLETE ===');
};

// Run the script
main();

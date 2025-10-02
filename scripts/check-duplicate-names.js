#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkDuplicateNames() {
  console.log('=== CHECKING FOR DUPLICATE NAMES IN VOIES CYCLABLES ===\n');

  const allLineStrings = [];
  const duplicates = [];

  // Read all line files
  const voiesDir = 'content/voies-cyclables';
  const files = fs.readdirSync(voiesDir).filter(file => file.endsWith('.json'));

  console.log(`Found ${files.length} line files to check...\n`);

  files.forEach(file => {
    const filePath = path.join(voiesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const geojson = JSON.parse(content);

      if (geojson.type === 'FeatureCollection') {
        for (const feature of geojson.features) {
          if (feature.geometry.type === 'LineString') {
            allLineStrings.push({
              ...feature,
              sourceFile: file
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing file: ${filePath}`);
      console.error(error.message);
    }
  });

  console.log(`Total LineString features found: ${allLineStrings.length}\n`);

  // Check for duplicates using name-line combination (same as data health check)
  const nameLineCount = allLineStrings.reduce((count, lineString) => {
    const name = lineString.properties.name;
    const line = lineString.properties.line;
    const key = `${name}-${line}`;

    if (!count[key]) {
      count[key] = [];
    }
    count[key].push({
      name,
      line,
      sourceFile: lineString.sourceFile,
      type: lineString.properties.type
    });

    return count;
  }, {});

  // Find duplicates
  for (const key in nameLineCount) {
    if (nameLineCount[key].length > 1) {
      duplicates.push({
        nameLine: key,
        count: nameLineCount[key].length,
        occurrences: nameLineCount[key]
      });
    }
  }

  // Report results
  if (duplicates.length === 0) {
    console.log('✅ No duplicate names found!');
    console.log('All name-line combinations are unique.');
  } else {
    console.log(`❌ Found ${duplicates.length} duplicate name-line combinations:\n`);

    duplicates.forEach((duplicate, index) => {
      console.log(`${index + 1}. "${duplicate.nameLine}" (${duplicate.count} occurrences):`);
      duplicate.occurrences.forEach((occurrence, i) => {
        console.log(`   ${i + 1}. File: ${occurrence.sourceFile}, Type: ${occurrence.type}`);
      });
      console.log('');
    });
  }

  // Additional check: Check for exact name duplicates across different lines
  console.log('\n=== CHECKING FOR NAME DUPLICATES ACROSS DIFFERENT LINES ===\n');

  const nameCount = allLineStrings.reduce((count, lineString) => {
    const name = lineString.properties.name;
    if (!count[name]) {
      count[name] = [];
    }
    count[name].push({
      name,
      line: lineString.properties.line,
      sourceFile: lineString.sourceFile,
      type: lineString.properties.type
    });
    return count;
  }, {});

  const crossLineDuplicates = [];
  for (const name in nameCount) {
    if (nameCount[name].length > 1) {
      const lines = [...new Set(nameCount[name].map(item => item.line))];
      if (lines.length > 1) {
        crossLineDuplicates.push({
          name,
          lines,
          occurrences: nameCount[name]
        });
      }
    }
  }

  if (crossLineDuplicates.length === 0) {
    console.log('✅ No names duplicated across different lines!');
  } else {
    console.log(`⚠️  Found ${crossLineDuplicates.length} names used across different lines:\n`);

    crossLineDuplicates.forEach((duplicate, index) => {
      console.log(`${index + 1}. "${duplicate.name}" used in lines: ${duplicate.lines.join(', ')}`);
      duplicate.occurrences.forEach((occurrence, i) => {
        console.log(`   ${i + 1}. Line ${occurrence.line} in ${occurrence.sourceFile} (${occurrence.type})`);
      });
      console.log('');
    });
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total LineString features: ${allLineStrings.length}`);
  console.log(`Duplicate name-line combinations: ${duplicates.length}`);
  console.log(`Names used across different lines: ${crossLineDuplicates.length}`);

  if (duplicates.length > 0 || crossLineDuplicates.length > 0) {
    console.log('\n❌ Issues found that need attention!');
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed! No duplicate issues found.');
  }
}

// Run the check
checkDuplicateNames();

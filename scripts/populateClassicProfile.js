import mysql from 'mysql2/promise';
import dbConfig from '../dbConfig.js';
import patterns from '../utils/classicPatterns.js';

async function populateClassicProfile() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    for (const pid of Object.keys(patterns)) {
      const pattern = patterns[pid];
      await connection.execute(
        `INSERT INTO ClassicProfilePatterns (
          pid, emotions, goal, judges_others_by, influences_others_by, value_to_organization, overuses, under_pressure, fears, would_increase_effectiveness_through, general_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pid,
          pattern.emotions || null,
          pattern.goal || null,
          pattern.judgesOthersBy || pattern.judges_others_by || null,
          pattern.influencesOthersBy || pattern.influences_others_by || null,
          pattern.valueToOrganization || pattern.value_to_organization || null,
          pattern.overuses || null,
          pattern.underPressure || pattern.under_pressure || null,
          pattern.fears || null,
          pattern.wouldIncreaseEffectivenessThrough || pattern.would_increase_effectiveness_through || null,
          pattern.generalDescription || pattern.general_description || null
        ]
      );
      console.log(`Inserted classic profile pattern: ${pid}`);
    }
    console.log('ClassicProfilePatterns population complete.');
  } catch (err) {
    console.error('Error populating ClassicProfilePatterns:', err.message);
  } finally {
    await connection.end();
  }
}

populateClassicProfile(); 
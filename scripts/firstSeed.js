import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function firstSeed() {
  console.log('🚀 Starting first seed process...\n');

  try {
    // 1. Populate adjectives
    console.log('📝 Step 1: Populating adjectives...');
    await execAsync('node scripts/populateAdjectives.js');
    console.log('✅ Adjectives populated successfully!\n');

    // 2. Populate pattern
    console.log('🔢 Step 2: Populating pattern...');
    await execAsync('node scripts/populatePattern.js');
    console.log('✅ Pattern populated successfully!\n');

    // 3. Populate pattern table
    console.log('📊 Step 3: Populating pattern table...');
    await execAsync('node scripts/populatePatternTable.js');
    console.log('✅ Pattern table populated successfully!\n');

    // 4. Populate classic profile
    console.log('👤 Step 4: Populating classic profile...');
    await execAsync('node scripts/populateClassicProfile.js');
    console.log('✅ Classic profile populated successfully!\n');

    console.log('🎉 First seed completed successfully!');
    console.log('📋 All DISC assessment data is now ready.');

  } catch (error) {
    console.error('❌ Error during first seed:', error.message);
    process.exit(1);
  }
}

firstSeed(); 
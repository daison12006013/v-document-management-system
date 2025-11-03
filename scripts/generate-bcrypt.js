const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// User credentials mapping
const users = [
  { email: 'admin@vistra.com', password: 'admin123', name: 'Admin User', id: '00000000-0000-0000-0000-000000000001' },
  { email: 'user@vistra.com', password: 'user123', name: 'Regular User', id: '00000000-0000-0000-0000-000000000002' },
  { email: 'demo@vistra.com', password: 'demo123', name: 'Demo User', id: '00000000-0000-0000-0000-000000000003' }
];

async function generateHashes() {
  console.log('Generating bcrypt hashes...\n');

  const hashedUsers = await Promise.all(
    users.map(async (user) => {
      const hash = await bcrypt.hash(user.password, 10);
      return { ...user, hash };
    })
  );

  // Display generated hashes
  console.log('Generated bcrypt hashes:');
  console.log('='.repeat(80));
  hashedUsers.forEach(user => {
    console.log(`\nEmail: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${user.hash}`);
  });
  console.log('\n' + '='.repeat(80));

  // Read the seed.sql file
  const seedPath = path.join(__dirname, '..', 'database', 'seeds', 'seed.sql');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Find the start and end of the INSERT INTO users block
  const insertStartPattern = /INSERT INTO users \(id, email, name, password, created_at, updated_at\) VALUES/;
  const conflictPattern = /\s*ON CONFLICT \(email\) DO NOTHING;/;

  const insertStartIndex = seedContent.search(insertStartPattern);
  const conflictMatch = seedContent.match(conflictPattern);

  if (insertStartIndex === -1 || !conflictMatch) {
    console.error('❌ Could not find INSERT INTO users statement in seed.sql');
    process.exit(1);
  }

  const conflictIndex = conflictMatch.index;

  // Find the line after INSERT INTO users
  const beforeInsert = seedContent.substring(0, insertStartIndex);
  const afterConflict = seedContent.substring(conflictIndex + conflictMatch[0].length);

  // Build the new INSERT statement
  const values = hashedUsers.map(user =>
    `  ('${user.id}', '${user.email}', '${user.name}', '${user.hash}', NOW(), NOW())`
  ).join(',\n');

  const newInsert = `INSERT INTO users (id, email, name, password, created_at, updated_at) VALUES\n${values}\nON CONFLICT (email) DO NOTHING;`;

  // Reconstruct the file
  seedContent = beforeInsert + newInsert + afterConflict;

  // Write updated content back to file
  fs.writeFileSync(seedPath, seedContent, 'utf8');

  console.log('\n✅ Successfully updated database/seeds/seed.sql with new bcrypt hashes!');

  // Verify the hashes work
  console.log('\nVerifying generated hashes...');
  for (const user of hashedUsers) {
    const isValid = await bcrypt.compare(user.password, user.hash);
    console.log(`${user.email}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
}

generateHashes().catch(console.error);

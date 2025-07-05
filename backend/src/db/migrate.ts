import fs from 'fs';
import path from 'path';
import pool from './connection';

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Drop existing tables to ensure clean migration
    await pool.query(`
      DROP VIEW IF EXISTS recent_games CASCADE;
      DROP VIEW IF EXISTS leaderboard_stats CASCADE;
      DROP TABLE IF EXISTS player_game_results CASCADE;
      DROP TABLE IF EXISTS games CASCADE;
      DROP TABLE IF EXISTS players CASCADE;
    `);
    
    console.log('Dropped existing tables...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('Database migration completed successfully!');
    
    // Add comprehensive dummy data
    await seedDummyData();
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function seedDummyData() {
  try {
    console.log('Seeding comprehensive dummy data...');
    
    // Add diverse players
    const players = [
      { name: 'Rahul Sharma', email: 'rahul@example.com' },
      { name: 'Priya Patel', email: 'priya@example.com' },
      { name: 'Arjun Singh', email: 'arjun@example.com' },
      { name: 'Sneha Gupta', email: 'sneha@example.com' },
      { name: 'Vikash Kumar', email: 'vikash@example.com' },
      { name: 'Anita Verma', email: 'anita@example.com' },
      { name: 'Rohan Mehta', email: 'rohan@example.com' },
      { name: 'Deepika Roy', email: 'deepika@example.com' },
      { name: 'Amit Joshi', email: 'amit@example.com' },
      { name: 'Kavya Nair', email: 'kavya@example.com' }
    ];
    
    const playerIds: number[] = [];
    for (const player of players) {
      const result = await pool.query(
        'INSERT INTO players (name, email) VALUES ($1, $2) RETURNING id',
        [player.name, player.email]
      );
      playerIds.push(result.rows[0].id);
    }
    
    console.log(`Added ${players.length} players...`);
    
    // Generate games over the last 6 months with realistic position-based data
    const gameData = [
      // January 2025 games
      {
        date: '2025-01-15',
        location: 'Community Center',
        results: [
          { player_id: playerIds[0], position: 1 }, // Rahul wins
          { player_id: playerIds[1], position: 2 }, // Priya second
          { player_id: playerIds[2], position: 3 }, // Arjun third
          { player_id: playerIds[3], position: 4 }  // Sneha fourth
        ]
      },
      {
        date: '2025-01-20',
        location: 'Home Game',
        results: [
          { player_id: playerIds[4], position: 1 }, // Vikash wins
          { player_id: playerIds[0], position: 2 }, // Rahul second
          { player_id: playerIds[5], position: 3 }, // Anita third
          { player_id: playerIds[1], position: 4 }, // Priya fourth
          { player_id: playerIds[6], position: 5 }  // Rohan fifth
        ]
      },
      {
        date: '2025-01-25',
        location: 'Club House',
        results: [
          { player_id: playerIds[2], position: 1 }, // Arjun wins
          { player_id: playerIds[7], position: 2 }, // Deepika second
          { player_id: playerIds[4], position: 3 }, // Vikash third
          { player_id: playerIds[8], position: 4 }  // Amit fourth
        ]
      },
      
      // February 2025 games
      {
        date: '2025-02-03',
        location: 'Weekend Hangout',
        results: [
          { player_id: playerIds[1], position: 1 }, // Priya wins
          { player_id: playerIds[9], position: 2 }, // Kavya second
          { player_id: playerIds[0], position: 3 }, // Rahul third
          { player_id: playerIds[3], position: 4 }, // Sneha fourth
          { player_id: playerIds[2], position: 5 }  // Arjun fifth
        ]
      },
      {
        date: '2025-02-10',
        location: 'Home Game',
        results: [
          { player_id: playerIds[5], position: 1 }, // Anita wins
          { player_id: playerIds[6], position: 2 }, // Rohan second
          { player_id: playerIds[7], position: 3 }, // Deepika third
          { player_id: playerIds[8], position: 4 }  // Amit fourth
        ]
      },
      {
        date: '2025-02-17',
        location: 'Community Center',
        results: [
          { player_id: playerIds[0], position: 1 }, // Rahul wins
          { player_id: playerIds[4], position: 2 }, // Vikash second
          { player_id: playerIds[1], position: 3 }, // Priya third
          { player_id: playerIds[9], position: 4 }, // Kavya fourth
          { player_id: playerIds[5], position: 5 }, // Anita fifth
          { player_id: playerIds[2], position: 6 }  // Arjun sixth
        ]
      },
      
      // March 2025 games
      {
        date: '2025-03-05',
        location: 'Office Break Room',
        results: [
          { player_id: playerIds[7], position: 1 }, // Deepika wins
          { player_id: playerIds[8], position: 2 }, // Amit second
          { player_id: playerIds[0], position: 3 }, // Rahul third
          { player_id: playerIds[6], position: 4 }  // Rohan fourth
        ]
      },
      {
        date: '2025-03-12',
        location: 'Club House',
        results: [
          { player_id: playerIds[3], position: 1 }, // Sneha wins
          { player_id: playerIds[9], position: 2 }, // Kavya second
          { player_id: playerIds[4], position: 3 }, // Vikash third
          { player_id: playerIds[1], position: 4 }, // Priya fourth
          { player_id: playerIds[5], position: 5 }  // Anita fifth
        ]
      },
      {
        date: '2025-03-19',
        location: 'Home Game',
        results: [
          { player_id: playerIds[6], position: 1 }, // Rohan wins
          { player_id: playerIds[2], position: 2 }, // Arjun second
          { player_id: playerIds[7], position: 3 }, // Deepika third
          { player_id: playerIds[8], position: 4 }, // Amit fourth
          { player_id: playerIds[0], position: 5 }  // Rahul fifth
        ]
      },
      
      // April 2025 games
      {
        date: '2025-04-02',
        location: 'Weekend Tournament',
        results: [
          { player_id: playerIds[1], position: 1 }, // Priya wins
          { player_id: playerIds[0], position: 2 }, // Rahul second
          { player_id: playerIds[4], position: 3 }, // Vikash third
          { player_id: playerIds[3], position: 4 }, // Sneha fourth
          { player_id: playerIds[9], position: 5 }, // Kavya fifth
          { player_id: playerIds[5], position: 6 }, // Anita sixth
          { player_id: playerIds[2], position: 7 }  // Arjun seventh
        ]
      },
      {
        date: '2025-04-16',
        location: 'Community Center',
        results: [
          { player_id: playerIds[8], position: 1 }, // Amit wins
          { player_id: playerIds[6], position: 2 }, // Rohan second
          { player_id: playerIds[7], position: 3 }, // Deepika third
          { player_id: playerIds[1], position: 4 }  // Priya fourth
        ]
      },
      
      // May 2025 games
      {
        date: '2025-05-07',
        location: 'Home Game',
        results: [
          { player_id: playerIds[4], position: 1 }, // Vikash wins
          { player_id: playerIds[3], position: 2 }, // Sneha second
          { player_id: playerIds[0], position: 3 }, // Rahul third
          { player_id: playerIds[9], position: 4 }, // Kavya fourth
          { player_id: playerIds[8], position: 5 }  // Amit fifth
        ]
      },
      {
        date: '2025-05-21',
        location: 'Club House',
        results: [
          { player_id: playerIds[2], position: 1 }, // Arjun wins
          { player_id: playerIds[5], position: 2 }, // Anita second
          { player_id: playerIds[7], position: 3 }, // Deepika third
          { player_id: playerIds[6], position: 4 }, // Rohan fourth
          { player_id: playerIds[1], position: 5 }, // Priya fifth
          { player_id: playerIds[4], position: 6 }  // Vikash sixth
        ]
      },
      
      // June 2025 games
      {
        date: '2025-06-04',
        location: 'Summer Special',
        results: [
          { player_id: playerIds[9], position: 1 }, // Kavya wins
          { player_id: playerIds[0], position: 2 }, // Rahul second
          { player_id: playerIds[1], position: 3 }, // Priya third
          { player_id: playerIds[2], position: 4 }  // Arjun fourth
        ]
      },
      {
        date: '2025-06-18',
        location: 'Weekend Tournament',
        results: [
          { player_id: playerIds[5], position: 1 }, // Anita wins
          { player_id: playerIds[8], position: 2 }, // Amit second
          { player_id: playerIds[4], position: 3 }, // Vikash third
          { player_id: playerIds[7], position: 4 }, // Deepika fourth
          { player_id: playerIds[6], position: 5 }, // Rohan fifth
          { player_id: playerIds[3], position: 6 }  // Sneha sixth
        ]
      },
      
      // July 2025 games (recent)
      {
        date: '2025-07-01',
        location: 'Holiday Special',
        results: [
          { player_id: playerIds[0], position: 1 }, // Rahul wins
          { player_id: playerIds[1], position: 2 }, // Priya second
          { player_id: playerIds[4], position: 3 }, // Vikash third
          { player_id: playerIds[2], position: 4 }, // Arjun fourth
          { player_id: playerIds[9], position: 5 }, // Kavya fifth
          { player_id: playerIds[8], position: 6 }, // Amit sixth
          { player_id: playerIds[5], position: 7 }, // Anita seventh
          { player_id: playerIds[7], position: 8 }  // Deepika eighth
        ]
      }
    ];
    
    // Insert games and results
    for (const game of gameData) {
      // Insert game
      const gameResult = await pool.query(
        'INSERT INTO games (date, location, game_type) VALUES ($1, $2, $3) RETURNING id',
        [game.date, game.location, '3 Patti']
      );
      
      const gameId = gameResult.rows[0].id;
      
      // Insert results for this game
      for (const result of game.results) {
        await pool.query(
          'INSERT INTO player_game_results (player_id, game_id, position) VALUES ($1, $2, $3)',
          [result.player_id, gameId, result.position]
        );
      }
    }
    
    console.log(`Added ${gameData.length} games with position-based results!`);
    console.log('✅ Dummy data seeding completed successfully!');
    console.log('📊 Database now contains:');
    console.log(`   - ${players.length} players`);
    console.log(`   - ${gameData.length} games`);
    console.log(`   - Position-based rankings (1st, 2nd, 3rd, etc.)`);
    console.log(`   - Multiple months of game history`);
    console.log(`   - Realistic win patterns and performance data`);
    
  } catch (error) {
    console.error('Dummy data seeding failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().catch(console.error);
}

export default migrate; 
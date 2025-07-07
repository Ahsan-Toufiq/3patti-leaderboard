import express, { Request, Response } from 'express';
import pool from '../db/connection';
import { LeaderboardEntry, PlayerAnalytics, ApiResponse } from '../types';

const router = express.Router();

// GET /api/analytics/leaderboard - Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = req.query.sortBy as string || 'ranking_score';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    
    // Validate sort parameters
    const validSortColumns = [
      'ranking_score', 'games_won', 'win_rate', 'total_games', 
      'avg_position', 'best_position', 'name'
    ];
    
    if (!validSortColumns.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort column',
      });
    }
    
    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sort order',
      });
    }
    
    const result = await pool.query(`
      SELECT * FROM leaderboard_stats 
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}, name ASC
      LIMIT $1
    `, [limit]);
    
    // Get the actual total unique games count (not sum of player totals)
    const totalGamesResult = await pool.query('SELECT COUNT(*) as total_unique_games FROM games');
    const totalUniqueGames = parseInt(totalGamesResult.rows[0].total_unique_games);
    
    // Convert numeric fields to proper types (PostgreSQL returns bigint as string)
    const leaderboardData = result.rows.map(row => ({
      ...row,
      total_games: parseInt(row.total_games),
      games_won: parseInt(row.games_won),
      win_rate: parseFloat(row.win_rate),
      avg_position: parseFloat(row.avg_position),
      best_position: parseInt(row.best_position),
      worst_position: parseInt(row.worst_position),
      ranking_score: parseFloat(row.ranking_score)
    }));
    
    const response: ApiResponse<LeaderboardEntry[]> = {
      success: true,
      data: leaderboardData,
      meta: {
        total_unique_games: totalUniqueGames
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

// GET /api/analytics/player/:id - Get player analytics
router.get('/player/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timeframe = req.query.timeframe as string || 'lifetime';
    
    // Build date filter based on timeframe
    let dateFilter = '';
    if (timeframe !== 'lifetime') {
      switch (timeframe) {
        case '7days':
          dateFilter = 'AND g.date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case '30days':
          dateFilter = 'AND g.date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case '90days':
          dateFilter = 'AND g.date >= CURRENT_DATE - INTERVAL \'90 days\'';
          break;
        case '6months':
          dateFilter = 'AND g.date >= CURRENT_DATE - INTERVAL \'6 months\'';
          break;
        case '1year':
          dateFilter = 'AND g.date >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        default:
          dateFilter = '';
      }
    }
    
    // Get player info
    const playerResult = await pool.query(
      'SELECT name FROM players WHERE id = $1',
      [id]
    );
    
    if (playerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }
    
    // Get monthly stats (with timeframe filter)
    const monthlyStatsResult = await pool.query(`
      SELECT 
        TO_CHAR(g.date, 'YYYY-MM') as month,
        COUNT(pgr.id) as games_played,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as games_won,
        ROUND(AVG(pgr.position), 2) as avg_position,
        MIN(pgr.position) as best_position
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1 ${dateFilter}
      GROUP BY TO_CHAR(g.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `, [id]);
    
    // Get position distribution (with timeframe filter)
    const positionDistResult = await pool.query(`
      SELECT 
        position,
        COUNT(*) as count,
        ROUND(COUNT(*)::decimal / (
          SELECT COUNT(*) 
          FROM player_game_results pgr2 
          JOIN games g2 ON pgr2.game_id = g2.id 
          WHERE pgr2.player_id = $1 ${dateFilter}
        ) * 100, 2) as percentage
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1 ${dateFilter}
      GROUP BY position
      ORDER BY position
    `, [id]);
    
    // Get recent performance (last 20 games with timeframe filter)
    const recentPerfResult = await pool.query(`
      SELECT 
        g.date,
        pgr.position,
        pgr.game_id
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1 ${dateFilter}
      ORDER BY g.date DESC, g.id DESC
      LIMIT 20
    `, [id]);
    
    // Get performance trends (with timeframe filter)
    let trendsInterval = '6 months';
    if (timeframe === '7days' || timeframe === '30days') {
      trendsInterval = '30 days';
    } else if (timeframe === '90days') {
      trendsInterval = '90 days';
    } else if (timeframe === '6months') {
      trendsInterval = '6 months';
    } else if (timeframe === '1year') {
      trendsInterval = '12 months';
    }
    
    const performanceTrendsResult = await pool.query(`
      SELECT 
        TO_CHAR(g.date, 'YYYY-MM') as period,
        ROUND(AVG(pgr.position), 2) as avg_position,
        COUNT(pgr.id) as games_count,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as wins_count
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1 ${dateFilter}
        ${timeframe === 'lifetime' ? '' : `AND g.date >= CURRENT_DATE - INTERVAL '${trendsInterval}'`}
      GROUP BY TO_CHAR(g.date, 'YYYY-MM')
      ORDER BY period DESC
    `, [id]);
    
    const analytics: PlayerAnalytics = {
      player_id: parseInt(id),
      player_name: playerResult.rows[0].name,
      monthly_stats: monthlyStatsResult.rows,
      position_distribution: positionDistResult.rows,
      recent_performance: recentPerfResult.rows,
      performance_trends: performanceTrendsResult.rows,
    };
    
    const response: ApiResponse<PlayerAnalytics> = {
      success: true,
      data: analytics,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get player analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player analytics',
    });
  }
});

// GET /api/analytics/overview - Get general analytics overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const timeframe = req.query.timeframe as string || 'lifetime';
    
    // Build date filter based on timeframe
    let dateFilter = '';
    let dateParams: any[] = [];
    
    if (timeframe !== 'lifetime') {
      switch (timeframe) {
        case '7days':
          dateFilter = 'WHERE g.date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case '30days':
          dateFilter = 'WHERE g.date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case '90days':
          dateFilter = 'WHERE g.date >= CURRENT_DATE - INTERVAL \'90 days\'';
          break;
        case '6months':
          dateFilter = 'WHERE g.date >= CURRENT_DATE - INTERVAL \'6 months\'';
          break;
        case '1year':
          dateFilter = 'WHERE g.date >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        default:
          dateFilter = '';
      }
    }
    
    // Get total stats with timeframe filter
    const totalStatsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT g.id) as total_games,
        AVG(pgr.position) as avg_position,
        MIN(g.date) as first_game_date,
        MAX(g.date) as last_game_date
      FROM players p
      LEFT JOIN player_game_results pgr ON p.id = pgr.player_id
      LEFT JOIN games g ON pgr.game_id = g.id
      ${dateFilter}
    `);
    
    // Get games per month (adjust period based on timeframe)
    let monthlyInterval = '12 months';
    if (timeframe === '7days' || timeframe === '30days') {
      monthlyInterval = '30 days';
    } else if (timeframe === '90days') {
      monthlyInterval = '3 months';
    } else if (timeframe === '6months') {
      monthlyInterval = '6 months';
    } else if (timeframe === '1year') {
      monthlyInterval = '12 months';
    } else {
      monthlyInterval = '24 months'; // For lifetime, show more history
    }
    
    const monthlyGamesResult = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as games_count
      FROM games
      ${timeframe === 'lifetime' ? '' : `WHERE date >= CURRENT_DATE - INTERVAL '${monthlyInterval}'`}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
    `);
    
    // Get average players per game
    const avgPlayersResult = await pool.query(`
      SELECT 
        AVG(player_count) as avg_players_per_game
      FROM (
        SELECT COUNT(*) as player_count
        FROM player_game_results
        GROUP BY game_id
      ) as game_counts
    `);
    
    // Get most active players (with timeframe filter)
    const mostActiveResult = await pool.query(`
      SELECT 
        p.name,
        COUNT(pgr.id) as games_played
      FROM players p
      JOIN player_game_results pgr ON p.id = pgr.player_id
      JOIN games g ON pgr.game_id = g.id
      ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY games_played DESC
      LIMIT 5
    `);
    
    // Get top performers by wins and consistency (with timeframe filter)
    const topPerformersResult = await pool.query(`
      SELECT 
        p.name,
        COUNT(pgr.id) as games_played,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as wins,
        ROUND(AVG(pgr.position), 2) as avg_position,
        ROUND((SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END)::decimal / COUNT(pgr.id) * 100), 1) as win_rate
      FROM players p
      JOIN player_game_results pgr ON p.id = pgr.player_id
      JOIN games g ON pgr.game_id = g.id
      ${dateFilter}
      GROUP BY p.id, p.name
      HAVING COUNT(pgr.id) >= 3
      ORDER BY win_rate DESC, wins DESC, avg_position ASC
      LIMIT 5
    `);
    
    const overview = {
      total_stats: totalStatsResult.rows[0],
      monthly_games: monthlyGamesResult.rows,
      avg_players_per_game: parseFloat(avgPlayersResult.rows[0].avg_players_per_game || '0'),
      most_active_players: mostActiveResult.rows,
      top_performers: topPerformersResult.rows,
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: overview,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview',
    });
  }
});

// GET /api/analytics/trends - Get performance trends
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'monthly';
    const limit = parseInt(req.query.limit as string) || 12;
    
    let dateFormat: string;
    let intervalClause: string;
    
    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        intervalClause = `${limit} days`;
        break;
      case 'weekly':
        dateFormat = 'YYYY-"W"WW';
        intervalClause = `${limit} weeks`;
        break;
      case 'monthly':
      default:
        dateFormat = 'YYYY-MM';
        intervalClause = `${limit} months`;
        break;
    }
    
    const trendsResult = await pool.query(`
      SELECT 
        TO_CHAR(g.date, '${dateFormat}') as period,
        COUNT(DISTINCT g.id) as games_count,
        COUNT(pgr.id) as total_results,
        AVG(pgr.position) as avg_position,
        COUNT(DISTINCT pgr.player_id) as unique_players,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as total_wins
      FROM games g
      LEFT JOIN player_game_results pgr ON g.id = pgr.game_id
      WHERE g.date >= CURRENT_DATE - INTERVAL '${intervalClause}'
      GROUP BY TO_CHAR(g.date, '${dateFormat}')
      ORDER BY period DESC
    `);
    
    const response: ApiResponse<any> = {
      success: true,
      data: trendsResult.rows,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
    });
  }
});

// GET /api/analytics/game/:id/scores - Get cumulative scores for players up to this game
router.get('/game/:id/scores', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the game date first
    const gameResult = await pool.query(
      'SELECT date FROM games WHERE id = $1',
      [id]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }
    
    const gameDate = gameResult.rows[0].date;
    
    // Get players who played in this specific game
    const playersInGameResult = await pool.query(`
      SELECT pgr.player_id, p.name as player_name, pgr.position
      FROM player_game_results pgr
      JOIN players p ON pgr.player_id = p.id
      WHERE pgr.game_id = $1
      ORDER BY pgr.position
    `, [id]);
    
    // Calculate cumulative scores for each player up to this game date (inclusive)
    const playerScores = [];
    
    for (const playerInGame of playersInGameResult.rows) {
      const scoreResult = await pool.query(`
        SELECT 
          COUNT(pgr.id) as total_games,
          SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as games_won,
          ROUND(AVG(pgr.position), 2) as avg_position,
          -- Calculate ranking score using same formula as leaderboard
          (
            SUM(CASE WHEN pgr.position = 1 THEN 10 ELSE 0 END) + 
            SUM(CASE WHEN pgr.position = 2 THEN 5 ELSE 0 END) + 
            SUM(CASE WHEN pgr.position = 3 THEN 3 ELSE 0 END) + 
            SUM(CASE WHEN pgr.position = 4 THEN 1 ELSE 0 END) +
            -- Consistency bonus: lower average position gets bonus
            (10 - GREATEST(AVG(pgr.position), 1)) * COUNT(pgr.id) / 10.0
          ) as cumulative_score
        FROM player_game_results pgr
        JOIN games g ON pgr.game_id = g.id
        WHERE pgr.player_id = $1 AND g.date <= $2
      `, [playerInGame.player_id, gameDate]);
      
      const score = scoreResult.rows[0];
      
      playerScores.push({
        player_id: playerInGame.player_id,
        player_name: playerInGame.player_name,
        current_position: playerInGame.position,
        cumulative_score: parseFloat(score.cumulative_score || '0'),
        total_games: parseInt(score.total_games || '0'),
        games_won: parseInt(score.games_won || '0'),
        avg_position: parseFloat(score.avg_position || '0'),
        score_breakdown: {
          first_place_points: await getPositionPoints(playerInGame.player_id, gameDate, 1),
          second_place_points: await getPositionPoints(playerInGame.player_id, gameDate, 2),
          third_place_points: await getPositionPoints(playerInGame.player_id, gameDate, 3),
          fourth_place_points: await getPositionPoints(playerInGame.player_id, gameDate, 4),
          consistency_bonus: parseFloat(score.cumulative_score || '0') - 
            (await getPositionPoints(playerInGame.player_id, gameDate, 1) * 10 +
             await getPositionPoints(playerInGame.player_id, gameDate, 2) * 5 +
             await getPositionPoints(playerInGame.player_id, gameDate, 3) * 3 +
             await getPositionPoints(playerInGame.player_id, gameDate, 4) * 1)
        }
      });
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        game_id: parseInt(id),
        game_date: gameDate,
        player_scores: playerScores.sort((a, b) => b.cumulative_score - a.cumulative_score)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get game scores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game scores',
    });
  }
});

// Helper function to get position count for scoring breakdown
async function getPositionPoints(playerId: number, gameDate: string, position: number): Promise<number> {
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM player_game_results pgr
    JOIN games g ON pgr.game_id = g.id
    WHERE pgr.player_id = $1 AND pgr.position = $2 AND g.date <= $3
  `, [playerId, position, gameDate]);
  
  return parseInt(result.rows[0].count || '0');
}

export default router; 
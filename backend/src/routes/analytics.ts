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
    
    const response: ApiResponse<LeaderboardEntry[]> = {
      success: true,
      data: result.rows,
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
    
    // Get monthly stats
    const monthlyStatsResult = await pool.query(`
      SELECT 
        TO_CHAR(g.date, 'YYYY-MM') as month,
        COUNT(pgr.id) as games_played,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as games_won,
        ROUND(AVG(pgr.position), 2) as avg_position,
        MIN(pgr.position) as best_position
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1
      GROUP BY TO_CHAR(g.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `, [id]);
    
    // Get position distribution
    const positionDistResult = await pool.query(`
      SELECT 
        position,
        COUNT(*) as count,
        ROUND(COUNT(*)::decimal / (SELECT COUNT(*) FROM player_game_results WHERE player_id = $1) * 100, 2) as percentage
      FROM player_game_results
      WHERE player_id = $1
      GROUP BY position
      ORDER BY position
    `, [id]);
    
    // Get recent performance (last 20 games)
    const recentPerfResult = await pool.query(`
      SELECT 
        g.date,
        pgr.position,
        pgr.game_id
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1
      ORDER BY g.date DESC, g.id DESC
      LIMIT 20
    `, [id]);
    
    // Get performance trends (last 6 months by month)
    const performanceTrendsResult = await pool.query(`
      SELECT 
        TO_CHAR(g.date, 'YYYY-MM') as period,
        ROUND(AVG(pgr.position), 2) as avg_position,
        COUNT(pgr.id) as games_count,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as wins_count
      FROM player_game_results pgr
      JOIN games g ON pgr.game_id = g.id
      WHERE pgr.player_id = $1 
        AND g.date >= CURRENT_DATE - INTERVAL '6 months'
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
    // Get total stats
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
    `);
    
    // Get games per month for the last 12 months
    const monthlyGamesResult = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as games_count
      FROM games
      WHERE date >= CURRENT_DATE - INTERVAL '12 months'
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
    
    // Get most active players
    const mostActiveResult = await pool.query(`
      SELECT 
        p.name,
        COUNT(pgr.id) as games_played
      FROM players p
      JOIN player_game_results pgr ON p.id = pgr.player_id
      GROUP BY p.id, p.name
      ORDER BY games_played DESC
      LIMIT 5
    `);
    
    // Get top performers by wins and consistency
    const topPerformersResult = await pool.query(`
      SELECT 
        p.name,
        COUNT(pgr.id) as games_played,
        SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as wins,
        ROUND(AVG(pgr.position), 2) as avg_position,
        ROUND((SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END)::decimal / COUNT(pgr.id) * 100), 1) as win_rate
      FROM players p
      JOIN player_game_results pgr ON p.id = pgr.player_id
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

export default router; 
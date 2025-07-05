import express, { Request, Response } from 'express';
import pool from '../db/connection';
import { Game, CreateGameRequest, GameWithResults, ApiResponse } from '../types';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const gameResultSchema = z.object({
  player_id: z.number().min(1, 'Player ID is required'),
  position: z.number().min(1, 'Position must be 1 or greater'),
});

const createGameSchema = z.object({
  date: z.string().optional(),
  location: z.string().optional(),
  game_type: z.string().optional(),
  notes: z.string().optional(),
  results: z.array(gameResultSchema).min(1, 'At least one result is required'),
});

// GET /api/games - Get all games with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM games');
    const total = parseInt(countResult.rows[0].count);
    
    // Get games with results
    const gamesResult = await pool.query(`
      SELECT * FROM recent_games 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const response = {
      success: true,
      data: gamesResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
    });
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM recent_games WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }
    
    const response: ApiResponse<GameWithResults> = {
      success: true,
      data: result.rows[0],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game',
    });
  }
});

// POST /api/games - Create new game with results
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const validatedData = createGameSchema.parse(req.body);
    
    await client.query('BEGIN');
    
    // Create the game
    const gameResult = await client.query(
      'INSERT INTO games (date, location, game_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        validatedData.date || new Date().toISOString().split('T')[0],
        validatedData.location,
        validatedData.game_type || '3 Patti',
        validatedData.notes,
      ]
    );
    
    const game = gameResult.rows[0];
    
    // Validate positions are unique and sequential
    const positions = validatedData.results.map(r => r.position).sort((a, b) => a - b);
    const uniquePositions = [...new Set(positions)];
    
    if (positions.length !== uniquePositions.length) {
      throw new Error('Positions must be unique');
    }
    
    // Verify positions start from 1 and are sequential
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        throw new Error('Positions must be sequential starting from 1');
      }
    }
    
    // Verify all players exist
    const playerIds = validatedData.results.map(r => r.player_id);
    const playersResult = await client.query(
      'SELECT id FROM players WHERE id = ANY($1)',
      [playerIds]
    );
    
    if (playersResult.rows.length !== playerIds.length) {
      throw new Error('Some players do not exist');
    }
    
    // Create player game results
    for (const result of validatedData.results) {
      await client.query(
        'INSERT INTO player_game_results (player_id, game_id, position) VALUES ($1, $2, $3)',
        [result.player_id, game.id, result.position]
      );
    }
    
    await client.query('COMMIT');
    
    // Fetch the complete game with results
    const completeGameResult = await pool.query(`
      SELECT * FROM recent_games WHERE id = $1
    `, [game.id]);
    
    const response: ApiResponse<GameWithResults> = {
      success: true,
      data: completeGameResult.rows[0],
      message: 'Game created successfully',
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Create game error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create game',
    });
  } finally {
    client.release();
  }
});

// PUT /api/games/:id - Update game
router.put('/:id', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const validatedData = createGameSchema.parse(req.body);
    
    // Check if game exists
    const existingGame = await client.query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );
    
    if (existingGame.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }
    
    await client.query('BEGIN');
    
    // Update the game
    await client.query(
      'UPDATE games SET date = $1, location = $2, game_type = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
      [
        validatedData.date || existingGame.rows[0].date,
        validatedData.location,
        validatedData.game_type || '3 Patti',
        validatedData.notes,
        id,
      ]
    );
    
    // Delete existing results
    await client.query(
      'DELETE FROM player_game_results WHERE game_id = $1',
      [id]
    );
    
    // Validate and create new results
    const positions = validatedData.results.map(r => r.position).sort((a, b) => a - b);
    const uniquePositions = [...new Set(positions)];
    
    if (positions.length !== uniquePositions.length) {
      throw new Error('Positions must be unique');
    }
    
    // Verify positions start from 1 and are sequential
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        throw new Error('Positions must be sequential starting from 1');
      }
    }
    
    // Verify all players exist
    const playerIds = validatedData.results.map(r => r.player_id);
    const playersResult = await client.query(
      'SELECT id FROM players WHERE id = ANY($1)',
      [playerIds]
    );
    
    if (playersResult.rows.length !== playerIds.length) {
      throw new Error('Some players do not exist');
    }
    
    // Create new player game results
    for (const result of validatedData.results) {
      await client.query(
        'INSERT INTO player_game_results (player_id, game_id, position) VALUES ($1, $2, $3)',
        [result.player_id, id, result.position]
      );
    }
    
    await client.query('COMMIT');
    
    // Fetch the updated game with results
    const completeGameResult = await pool.query(`
      SELECT * FROM recent_games WHERE id = $1
    `, [id]);
    
    const response: ApiResponse<GameWithResults> = {
      success: true,
      data: completeGameResult.rows[0],
      message: 'Game updated successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Update game error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update game',
    });
  } finally {
    client.release();
  }
});

// DELETE /api/games/:id - Delete game
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM games WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Game deleted successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete game',
    });
  }
});

export default router; 
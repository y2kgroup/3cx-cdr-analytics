import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Call } from '../models';

export const cdrRoutes = Router();

// Validation schemas
const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).optional()
});

const topAreasSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

/**
 * GET /api/kpis - Get call statistics and KPIs
 */
cdrRoutes.get('/kpis', async (req: Request, res: Response) => {
  try {
    const { from, to } = dateRangeSchema.parse(req.query);
    
    // Default to last 30 days if no dates provided
    const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
    const startDate = from ? new Date(from + 'T00:00:00.000Z') : 
      new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Build query
    const dateQuery = {
      start: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Aggregate statistics
    const stats = await Call.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          incomingCalls: { 
            $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
          },
          outgoingCalls: { 
            $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
          },
          totalDurationSec: { $sum: '$durationSec' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    const result = stats[0] || {
      totalCalls: 0,
      incomingCalls: 0,
      outgoingCalls: 0,
      totalDurationSec: 0,
      totalCost: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/area-codes/top - Get top area codes by call volume
 */
cdrRoutes.get('/area-codes/top', async (req: Request, res: Response) => {
  try {
    const { from, to, limit = 10 } = { ...dateRangeSchema.parse(req.query), ...topAreasSchema.parse(req.query) };
    
    const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
    const startDate = from ? new Date(from + 'T00:00:00.000Z') : 
      new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    const dateQuery = {
      start: { $gte: startDate, $lte: endDate },
      areaCode: { $ne: null }
    };

    const topAreaCodes = await Call.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$areaCode',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          areaCode: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(topAreaCodes);
  } catch (error) {
    console.error('Error fetching top area codes:', error);
    res.status(500).json({ error: 'Failed to fetch top area codes' });
  }
});

/**
 * GET /api/calls - Get paginated call records
 */
cdrRoutes.get('/calls', async (req: Request, res: Response) => {
  try {
    const { from, to } = dateRangeSchema.parse(req.query);
    const { page = 1, size = 50 } = paginationSchema.parse(req.query);
    
    const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
    const startDate = from ? new Date(from + 'T00:00:00.000Z') : 
      new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days default

    const dateQuery = {
      start: { $gte: startDate, $lte: endDate }
    };

    const skip = (page - 1) * size;
    
    const calls = await Call.find(dateQuery)
      .sort({ start: -1 })
      .skip(skip)
      .limit(size)
      .lean();

    const totalCalls = await Call.countDocuments(dateQuery);
    const totalPages = Math.ceil(totalCalls / size);

    res.json({
      calls,
      pagination: {
        page,
        size,
        totalCalls,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

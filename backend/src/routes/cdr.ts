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

    // Run aggregation pipeline
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

    // Convert duration to minutes
    const talkTimeMin = Math.round(result.totalDurationSec / 60);

    res.json({
      totalCalls: result.totalCalls,
      incoming: result.incomingCalls,
      outgoing: result.outgoingCalls,
      talkTimeMin,
      totalCost: result.totalCost
    });

  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

/**
 * GET /api/area-codes/top - Get top area codes by call count
 */
cdrRoutes.get('/area-codes/top', async (req: Request, res: Response) => {
  try {
    const { from, to } = dateRangeSchema.parse(req.query);
    const { limit } = topAreasSchema.parse(req.query);
    
    // Default to last 30 days and top 10
    const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
    const startDate = from ? new Date(from + 'T00:00:00.000Z') : 
      new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    const topLimit = limit || 10;

    const dateQuery = {
      start: {
        $gte: startDate,
        $lte: endDate
      },
      areaCode: { $ne: null } // Only include calls with area codes
    };

    const topAreaCodes = await Call.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$areaCode',
          calls: { $sum: 1 }
        }
      },
      { $sort: { calls: -1 } },
      { $limit: topLimit },
      {
        $project: {
          _id: 0,
          areaCode: '$_id',
          calls: 1
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
    const { page, size } = paginationSchema.parse(req.query);
    
    const currentPage = page || 1;
    const pageSize = Math.min(size || 50, 100); // Max 100 per page
    
    // Default to last 30 days
    const endDate = to ? new Date(to + 'T23:59:59.999Z') : new Date();
    const startDate = from ? new Date(from + 'T00:00:00.000Z') : 
      new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    const dateQuery = {
      start: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const calls = await Call.find(dateQuery)
      .sort({ start: -1 })
      .limit(pageSize)
      .skip((currentPage - 1) * pageSize)
      .lean();

    const totalCalls = await Call.countDocuments(dateQuery);
    const totalPages = Math.ceil(totalCalls / pageSize);

    res.json({
      calls,
      pagination: {
        page: currentPage,
        size: pageSize,
        total: totalCalls,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

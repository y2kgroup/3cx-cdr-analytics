import { Router, Request, Response } from 'express';
import { AppMeta } from '../models';

export const settingsRoutes = Router();

/**
 * GET /api/settings - Get application settings and status
 */
settingsRoutes.get('/settings', async (req: Request, res: Response) => {
  try {
    // Try to get existing metadata or create default
    let meta = await AppMeta.findById('meta');
    
    if (!meta) {
      meta = new AppMeta({
        _id: 'meta',
        version: '1.0.0',
        cdrPort: parseInt(process.env.CDR_PORT || '5432'),
        lastUpdated: new Date()
      });
      await meta.save();
    }

    res.json({
      version: meta.version,
      cdrPort: meta.cdrPort,
      serverIP: process.env.SERVER_IP || 'localhost',
      mongoConnected: true,
      lastUpdated: meta.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      mongoConnected: false 
    });
  }
});

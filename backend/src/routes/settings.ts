import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Call, AppMeta } from '../models';

export const settingsRoutes = Router();

/**
 * GET /api/settings - Get application settings and status
 */
settingsRoutes.get('/settings', async (_req: Request, res: Response) => {
  try {
    // Get app metadata
    let appMeta = await AppMeta.findById('meta');
    
    // Create default metadata if it doesn't exist
    if (!appMeta) {
      appMeta = new AppMeta({
        _id: 'meta',
        version: '0.1.0',
        cdrPort: parseInt(process.env.CDR_PORT || '5432'),
        lastUpdated: new Date()
      });
      await appMeta.save();
    }

    // Get MongoDB connection status
    const mongoConnected = mongoose.connection.readyState === 1;
    
    // Get total call count
    const callCount = await Call.countDocuments();

    // Determine server IP (simplified - in production you might want to use a different approach)
    const serverIp = process.env.SERVER_IP || 'localhost';

    res.json({
      version: appMeta.version,
      cdr: {
        ip: serverIp,
        port: appMeta.cdrPort
      },
      mongo: {
        connected: mongoConnected,
        callCount
      },
      lastUpdated: appMeta.lastUpdated
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/settings - Update application settings (if needed later)
 */
settingsRoutes.post('/settings', async (_req: Request, res: Response) => {
  try {
    // For now, this is read-only, but we can extend it later
    res.status(405).json({ error: 'Settings are read-only in this version' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

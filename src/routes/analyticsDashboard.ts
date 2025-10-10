// src/routes/analyticsDashboard.ts
import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

const analyticsRouter = Router();

// 📊 REALTIME DASHBOARD
analyticsRouter.get('/realtime', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getRealtimeDashboard();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch realtime data' });
  }
});

// 💰 COST ANALYSIS
analyticsRouter.get('/cost-analysis', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getCostAnalysis();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch cost analysis' });
  }
});

// 🌍 REGIONAL PERFORMANCE
analyticsRouter.get('/regional', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getRegionalPerformance();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch regional data' });
  }
});

// 📈 DAILY REPORT
analyticsRouter.get('/daily-report', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.generateDailyReport();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate daily report' });
  }
});

// 🚨 ANOMALY DETECTION
analyticsRouter.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.checkAnomalies();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check anomalies' });
  }
});

export default analyticsRouter;

// src/routes/analyticsDashboard.ts
import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

const analyticsRouter = Router();

// 📊 REALTIME DASHBOARD
analyticsRouter.get('/realtime', async (req: Request, res: Response) => {
  try {
    // Shtoni metodën getRealtimeDashboard në analyticsService ose përdorni ekzistuese
    const data = await analyticsService.generateDailyReport(); // Përdorim metodën ekzistuese
    res.json({ success: true, data });
  } catch (error) {
    console.error('Realtime dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch realtime data' });
  }
});

// 💰 COST ANALYSIS
analyticsRouter.get('/cost-analysis', async (req: Request, res: Response) => {
  try {
    // Metodë e re për cost analysis - mund të shtoni në analyticsService
    const data = await this.getCostAnalysis();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cost analysis' });
  }
});

// 🌍 REGIONAL PERFORMANCE
analyticsRouter.get('/regional', async (req: Request, res: Response) => {
  try {
    // Metodë e re për regional performance - mund të shtoni në analyticsService
    const data = await this.getRegionalPerformance();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Regional performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch regional data' });
  }
});

// 📈 DAILY REPORT
analyticsRouter.get('/daily-report', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.generateDailyReport();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate daily report' });
  }
});

// 🚨 ANOMALY DETECTION
analyticsRouter.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.checkAnomalies(req.query);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ success: false, error: 'Failed to check anomalies' });
  }
});

// Metoda ndihmëse për cost analysis
private async getCostAnalysis(): Promise<any> {
  // Implementimi i thjeshtë - mund të kompleksohet
  return {
    totalCost: 0,
    savings: 0,
    breakdown: {}
  };
}

// Metoda ndihmëse për regional performance
private async getRegionalPerformance(): Promise<any> {
  // Implementimi i thjeshtë - mund të kompleksohet
  return {
    regions: [],
    performance: {}
  };
}

export default analyticsRouter;

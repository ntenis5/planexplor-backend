// src/routes/analyticsDashboard.ts
import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

const analyticsRouter = Router();

// 📊 REALTIME DASHBOARD
analyticsRouter.get('/realtime', async (req: Request, res: Response) => {
  try {
    // Përdorim metodën ekzistuese derisa të shtojmë getRealtimeDashboard
    const data = await analyticsService.generateDailyReport();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Realtime dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch realtime data' });
  }
});

// 💰 COST ANALYSIS
analyticsRouter.get('/cost-analysis', async (req: Request, res: Response) => {
  try {
    // Përdorim funksion lokal derisa të implementohet në shërbim
    const data = await getCostAnalysis();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cost analysis' });
  }
});

// 🌍 REGIONAL PERFORMANCE
analyticsRouter.get('/regional', async (req: Request, res: Response) => {
  try {
    // Përdorim funksion lokal derisa të implementohet në shërbim
    const data = await getRegionalPerformance();
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

// Funksione ndihmëse - jo private por të thjeshta
async function getCostAnalysis(): Promise<any> {
  // Implementimi i thjeshtë - mund të kompleksohet
  return {
    totalCost: 0,
    savings: 0,
    breakdown: {
      geolocation: 0,
      affiliate: 0,
      maps: 0
    }
  };
}

async function getRegionalPerformance(): Promise<any> {
  // Implementimi i thjeshtë - mund të kompleksohet
  return {
    regions: [
      { name: 'Europe', performance: 95 },
      { name: 'North America', performance: 88 },
      { name: 'Asia', performance: 92 }
    ],
    performance: {
      europe: 95,
      north_america: 88,
      asia: 92
    }
  };
}

export default analyticsRouter;

import { Router } from 'express';
import { analyticsService } from '../services/analyticsService.js';
const analyticsRouter = Router();
analyticsRouter.get('/realtime', async (req, res) => {
    try {
        const data = await analyticsService.generateDailyReport();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Realtime dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch realtime data' });
    }
});
analyticsRouter.get('/cost-analysis', async (req, res) => {
    try {
        const data = await fetchCostAnalysisData();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Cost analysis error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cost analysis' });
    }
});
analyticsRouter.get('/regional', async (req, res) => {
    try {
        const data = await fetchRegionalPerformanceData();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Regional performance error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch regional data' });
    }
});
analyticsRouter.get('/daily-report', async (req, res) => {
    try {
        const data = await analyticsService.generateDailyReport();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Daily report error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate daily report' });
    }
});
analyticsRouter.get('/anomalies', async (req, res) => {
    try {
        const data = await analyticsService.checkAnomalies(req.query);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Anomaly detection error:', error);
        res.status(500).json({ success: false, error: 'Failed to check anomalies' });
    }
});
async function fetchCostAnalysisData() {
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
async function fetchRegionalPerformanceData() {
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

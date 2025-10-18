import { analyticsService } from '../services/analyticsService.js';
async function generateAnalyticsReport() {
    console.log('Generating Analytics Report...');
    try {
        const report = await analyticsService.generateDailyReport();
        if (!report) {
            console.log('No report data available.');
            return;
        }
        console.log('=== DAILY PERFORMANCE REPORT ===');
        console.log(`Date: ${report.report_date}`);
        console.log(`Total Requests: ${report.total_requests}`);
        console.log(`Total Users: ${report.total_users}`);
        console.log(`API Cost: €${report.total_api_cost.toFixed(4)}`);
        console.log(`Cache Savings: €${report.total_cache_savings.toFixed(4)}`);
        console.log(`Net Savings: ${report.net_savings_percentage.toFixed(2)}%`);
        console.log('\n=== ENDPOINT PERFORMANCE ===');
        report.endpoint_performance.forEach((endpoint) => {
            console.log(`${endpoint.endpoint}: ${endpoint.requests} req, ${endpoint.hit_rate.toFixed(2)}% hit rate, €${endpoint.cost_savings.toFixed(4)} saved`);
        });
    }
    catch (error) {
        console.error('Report generation failed:', error);
    }
}
generateAnalyticsReport();

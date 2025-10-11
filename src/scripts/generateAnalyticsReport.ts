// src/scripts/generateAnalyticsReport.ts
import { analyticsService } from '../services/analyticsService.js';

/**
 * Interface for the structure of the daily report returned by analyticsService.
 * Assumes the RPC 'generate_daily_performance_report' returns this structure.
 */
interface DailyReport {
  report_date: string;
  total_requests: number;
  total_users: number;
  total_api_cost: number;
  total_cache_savings: number;
  net_savings_percentage: number;
  endpoint_performance: EndpointPerformance[];
}

interface EndpointPerformance {
  endpoint: string;
  requests: number;
  hit_rate: number;
  cost_savings: number;
}

/**
 * Fetches and displays the daily analytics report.
 */
async function generateAnalyticsReport(): Promise<void> {
  console.log('📈 Generating Analytics Report...');
  
  try {
    // Corrected to use the expected DailyReport type for better type safety
    const report: DailyReport | null = await analyticsService.generateDailyReport();
    
    if (!report) {
      console.log('❌ No report data available.');
      return;
    }

    console.log('=== DAILY PERFORMANCE REPORT ===');
    console.log(`Date: ${report.report_date}`);
    console.log(`Total Requests: ${report.total_requests}`);
    console.log(`Total Users: ${report.total_users}`);
    console.log(`API Cost: €${report.total_api_cost.toFixed(4)}`); // Format cost for clarity
    console.log(`Cache Savings: €${report.total_cache_savings.toFixed(4)}`); // Format savings
    console.log(`Net Savings: ${report.net_savings_percentage.toFixed(2)}%`); // Format percentage
    
    console.log('\n=== ENDPOINT PERFORMANCE ===');
    report.endpoint_performance.forEach((endpoint: EndpointPerformance) => {
      console.log(`${endpoint.endpoint}: ${endpoint.requests} req, ${endpoint.hit_rate.toFixed(2)}% hit rate, €${endpoint.cost_savings.toFixed(4)} saved`);
    });
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
  }
}

generateAnalyticsReport();

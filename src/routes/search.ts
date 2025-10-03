import express from 'express';
import { AffiliateService } from '../services/affiliateService';

const router = express.Router();
const affiliateService = new AffiliateService();

router.post('/', async (req, res) => {
  try {
    const {
      category = 'all',
      destination,
      distance = 0,
      budget = 0,
      persons = 0,
      check_in,
      check_out,
      user_location
    } = req.body;

    // Validate required fields
    if (!destination || !user_location) {
      return res.status(400).json({
        error: 'Destination and user location are required'
      });
    }

    const searchParams = {
      category,
      destination,
      distance: Number(distance),
      budget: Number(budget),
      persons: Number(persons),
      check_in,
      check_out,
      user_location
    };

    const results = await affiliateService.search(searchParams);

    res.json({
      results,
      metadata: {
        total_results: results.length,
        category,
        budget_range: budget ? {
          min: budget * 0.8,
          max: budget,
          user_input: budget
        } : null,
        distance_range: distance ? `0-${distance}km` : 'Any distance',
        search_center: user_location
      },
      cache_info: {
        cached: true, // Would be dynamic in real implementation
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Internal server error during search'
    });
  }
});

export default router;

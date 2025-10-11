// src/services/affiliateService.ts
import axios from 'axios';
import { cacheService } from './cacheService.js';
import { supabase } from './supabaseClient.js'; 

interface SearchParams {
  category: 'all' | 'hotel' | 'flight' | 'package';
  destination: string;
  distance: number;
  budget: number;
  persons: number;
  check_in: string;
  check_out: string;
  user_location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface SearchResult {
  id: string;
  type: 'hotel' | 'flight' | 'package';
  title: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  rating?: number;
  affiliate_partner: string;
  affiliate_link: string;
  category: string[];
}

// Search Cache Time To Live (1 hour)
const SEARCH_CACHE_TTL_SECONDS = 3600; 

export class AffiliateService {
  private cacheService = cacheService;

  constructor() {
    // Uses the existing instance from cacheService
  }

  async search(params: SearchParams): Promise<SearchResult[]> {
    const cacheKey = this.generateCacheKey(params);
    
    // Try to get from cache first
    const cachedResults = await this.cacheService.manageCache('get', cacheKey);
    if (cachedResults) {
      // NOTE: Syntax fix - cachedResults from cache is likely a JSON string, 
      // so it needs to be parsed before filtering. Assuming manageCache handles JSON parsing internally 
      // or that the type is correctly inferred as SearchResult[].
      return this.filterResults(cachedResults as SearchResult[], params);
    }

    // If not in cache, get from affiliate partners
    const allResults = await this.fetchFromAllPartners(params);
    
    // Cache the results
    await this.cacheService.manageCache('set', cacheKey, allResults, {
      ttl: SEARCH_CACHE_TTL_SECONDS / 60, // Convert to minutes
      cacheType: 'affiliate'
    });
    
    return this.filterResults(allResults, params);
  }

  // --- Private Functions ---

  private generateCacheKey(params: SearchParams): string {
    // Syntax note: Backticks are preferred for template literals: `...`
    return `affiliate_search_${params.category}_${params.destination}_${params.budget}`;
  }

  private async fetchFromAllPartners(params: SearchParams): Promise<SearchResult[]> {
    const partners = ['booking', 'airbnb', 'expedia', 'tripadvisor'];
    const allResults: SearchResult[] = [];

    for (const partner of partners) {
      try {
        const results = await this.fetchFromPartner(partner, params);
        allResults.push(...results);
      } catch (error) {
        console.error(`Failed to fetch from ${partner}:`, error);
      }
    }

    return allResults;
  }

  private async fetchFromPartner(partner: string, params: SearchParams): Promise<SearchResult[]> {
    // Mock implementation - replace with actual API calls
    switch (partner) {
      case 'booking':
        return this.mockBookingAPI(params);
      case 'airbnb':
        return this.mockAirbnbAPI(params);
      case 'expedia':
        return this.mockExpediaAPI(params);
      case 'tripadvisor':
        return this.mockTripadvisorAPI(params);
      default:
        return [];
    }
  }

  private filterResults(results: SearchResult[], params: SearchParams): SearchResult[] {
    let filtered = results;

    // Filter by category
    if (params.category !== 'all') {
      filtered = filtered.filter(item => item.type === params.category);
    }

    // Filter by budget range (±20% - Adjusted logic: Max price should be <= budget)
    if (params.budget) {
      const minBudget = params.budget * 0.8;
      const maxBudget = params.budget; // Max price is the budget itself
      filtered = filtered.filter(item => 
        item.price >= minBudget && item.price <= maxBudget
      );
    }

    // Filter by distance
    if (params.distance > 0) {
      filtered = filtered.filter(item => 
        item.distance <= params.distance
      );
    }

    // Sort by relevance (distance + rating + price)
    filtered.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, params);
      const scoreB = this.calculateRelevanceScore(b, params);
      return scoreB - scoreA;
    });

    return filtered;
  }

  private calculateRelevanceScore(result: SearchResult, params: SearchParams): number {
    let score = 0;
    
    // Distance score (closer is better)
    if (params.distance > 0) {
      const distanceRatio = 1 - (result.distance / params.distance);
      score += distanceRatio * 40; // 40% weight
    }
    
    // Rating score
    if (result.rating !== undefined) { // Check for undefined instead of falsy 0
      score += (result.rating / 5) * 30; // 30% weight
    }
    
    // Price score (cheaper is better within budget)
    if (params.budget) {
      const priceRatio = 1 - (result.price / params.budget);
      score += Math.max(0, priceRatio) * 30; // 30% weight, max 0 to prevent negative scores for over-budget items
    }
    
    return score;
  }

  // Mock API implementations
  private async mockBookingAPI(params: SearchParams): Promise<SearchResult[]> {
    return [
      {
        id: 'booking_1',
        type: 'hotel',
        title: 'Luxury Hotel Central',
        description: '5-star hotel in city center',
        price: 120,
        original_price: 150,
        image_url: 'https://picsum.photos/400/300?random=1',
        location: { 
          lat: params.user_location.lat + 0.01, 
          lng: params.user_location.lng + 0.01, 
          address: 'City Center' 
        },
        distance: 5,
        rating: 4.5,
        affiliate_partner: 'Booking.com',
        affiliate_link: 'https://booking.com/hotel1',
        category: ['hotel', 'luxury']
      }
    ];
  }

  private async mockAirbnbAPI(params: SearchParams): Promise<SearchResult[]> {
    return [
      {
        id: 'airbnb_1',
        type: 'hotel',
        title: 'Cozy Apartment',
        description: 'Modern apartment with great view',
        price: 80,
        image_url: 'https://picsum.photos/400/300?random=2',
        location: { 
          lat: params.user_location.lat + 0.02, 
          lng: params.user_location.lng + 0.02, 
          address: 'Residential Area' 
        },
        distance: 8,
        rating: 4.2,
        affiliate_partner: 'Airbnb',
        affiliate_link: 'https://airbnb.com/listing1',
        category: ['apartment', 'budget']
      }
    ];
  }

  private async mockExpediaAPI(params: SearchParams): Promise<SearchResult[]> {
    return [
      {
        id: 'expedia_1',
        type: 'flight',
        title: 'Round Trip Flight',
        description: 'Economy class round trip',
        price: 200,
        image_url: 'https://picsum.photos/400/300?random=3',
        location: { 
          lat: params.user_location.lat, 
          lng: params.user_location.lng, 
          address: 'Local Airport' 
        },
        distance: 15,
        rating: 4.0,
        affiliate_partner: 'Expedia',
        affiliate_link: 'https://expedia.com/flight1',
        category: ['flight', 'economy']
      }
    ];
  }

  private async mockTripadvisorAPI(params: SearchParams): Promise<SearchResult[]> {
    return [
      {
        id: 'tripadvisor_1',
        type: 'package',
        title: 'All-Inclusive Vacation',
        description: 'Hotel + Flight + Activities',
        price: 450,
        original_price: 550,
        image_url: 'https://picsum.photos/400/300?random=4',
        location: { 
          lat: params.user_location.lat + 0.05, 
          lng: params.user_location.lng + 0.05, 
          address: 'Beach Resort' 
        },
        distance: 25,
        rating: 4.7,
        affiliate_partner: 'Tripadvisor',
        affiliate_link: 'https://tripadvisor.com/package1',
        category: ['package', 'all-inclusive']
      }
    ];
  }
}

export async function updateAffiliateData(): Promise<void> {
  const affiliateService = new AffiliateService();
  
  // Update cache for popular search combinations
  const popularSearches: SearchParams[] = [
    {
      category: 'all',
      destination: 'Tirana',
      distance: 50,
      budget: 1000,
      persons: 2,
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      user_location: { lat: 41.3275, lng: 19.8187, address: 'Tirana, Albania' }
    }
  ];

  for (const search of popularSearches) {
    try {
      await affiliateService.search(search);
    } catch (error) {
      console.error('Error updating affiliate data:', error);
    }
  }
  }

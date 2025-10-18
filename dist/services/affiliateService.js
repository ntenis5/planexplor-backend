import { cacheService } from './cacheService.js';
const SEARCH_CACHE_TTL_SECONDS = 3600;
export class AffiliateService {
    cacheService = cacheService;
    async search(params) {
        const cacheKey = this.generateCacheKey(params);
        const cachedResults = await this.cacheService.manageCache('get', cacheKey);
        if (cachedResults) {
            return this.filterResults(cachedResults, params);
        }
        const allResults = await this.fetchFromAllPartners(params);
        await this.cacheService.manageCache('set', cacheKey, allResults, {
            ttl: SEARCH_CACHE_TTL_SECONDS / 60,
            cacheType: 'affiliate'
        });
        return this.filterResults(allResults, params);
    }
    generateCacheKey(params) {
        return `affiliate_search_${params.category}_${params.destination}_${params.budget}`;
    }
    async fetchFromAllPartners(params) {
        const partners = ['booking', 'airbnb', 'expedia', 'tripadvisor'];
        const allResults = [];
        for (const partner of partners) {
            try {
                const results = await this.fetchFromPartner(partner, params);
                allResults.push(...results);
            }
            catch (error) {
                console.error(`Failed to fetch from ${partner}:`, error);
            }
        }
        return allResults;
    }
    async fetchFromPartner(partner, params) {
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
    filterResults(results, params) {
        let filtered = results;
        if (params.category !== 'all') {
            filtered = filtered.filter(item => item.type === params.category);
        }
        if (params.budget) {
            const minBudget = params.budget * 0.8;
            const maxBudget = params.budget;
            filtered = filtered.filter(item => item.price >= minBudget && item.price <= maxBudget);
        }
        if (params.distance > 0) {
            filtered = filtered.filter(item => item.distance <= params.distance);
        }
        filtered.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, params);
            const scoreB = this.calculateRelevanceScore(b, params);
            return scoreB - scoreA;
        });
        return filtered;
    }
    calculateRelevanceScore(result, params) {
        let score = 0;
        if (params.distance > 0) {
            const distanceRatio = 1 - (result.distance / params.distance);
            score += distanceRatio * 40;
        }
        if (result.rating !== undefined) {
            score += (result.rating / 5) * 30;
        }
        if (params.budget) {
            const priceRatio = 1 - (result.price / params.budget);
            score += Math.max(0, priceRatio) * 30;
        }
        return score;
    }
    async mockBookingAPI(params) {
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
    async mockAirbnbAPI(params) {
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
    async mockExpediaAPI(params) {
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
    async mockTripadvisorAPI(params) {
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
export async function updateAffiliateData() {
    const affiliateService = new AffiliateService();
    const popularSearches = [
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
        }
        catch (error) {
            console.error('Error updating affiliate data:', error);
        }
    }
}

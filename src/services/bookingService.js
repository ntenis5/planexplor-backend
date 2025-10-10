// src/services/bookingService.js
import { getAffiliateConfig } from '../config/affiliateConfig.js';
import axios from 'axios';

export class BookingService {
  constructor() {
    this.config = getAffiliateConfig().booking;
  }

  async searchHotels(params) {
    try {
      const response = await axios.get(`${this.config.baseUrl}${this.config.endpoints.hotels}`, {
        params: {
          ...params,
          api_key: this.config.apiKey // ✅ API key merret nga environment
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Booking API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch hotels from Booking.com');
    }
  }

  async getHotelAvailability(hotelId, checkIn, checkOut) {
    // Implementimi i ngjashëm
  }
}

export const bookingService = new BookingService();

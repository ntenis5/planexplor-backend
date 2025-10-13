import { getAffiliateConfig } from '../config/affiliateConfig.js';
import axios from 'axios';

interface HotelSearchParams {
  [key: string]: any;
}

interface HotelAvailabilityParams {
  hotelId: string;
  checkIn: string;
  checkOut: string;
}

export class BookingService {
  private config: any;

  constructor() {
    this.config = getAffiliateConfig().booking;
  }

  async searchHotels(params: HotelSearchParams): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}${this.config.endpoints.hotels}`, {
        params: {
          ...params,
          api_key: this.config.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      console.error('Booking API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch hotels from Booking.com');
    }
  }

  async getHotelAvailability(hotelId: string, checkIn: string, checkOut: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}${this.config.endpoints.availability}`, {
        params: {
          hotel_id: hotelId,
          check_in: checkIn,
          check_out: checkOut,
          api_key: this.config.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      console.error('Booking Availability Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch hotel availability');
    }
  }
}

export const bookingService = new BookingService();

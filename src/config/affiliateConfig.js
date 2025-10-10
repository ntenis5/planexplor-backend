// src/config/affiliateConfig.js
export const getAffiliateConfig = () => ({
  booking: {
    baseUrl: process.env.BOOKING_BASE_URL || 'https://distribution-xml.booking.com/2.0',
    apiKey: process.env.BOOKING_COM_API_KEY,
    endpoints: {
      hotels: '/json/hotels',
      availability: '/json/hotelAvailability'
    }
  },
  tripadvisor: {
    baseUrl: process.env.TRIPADVISOR_BASE_URL || 'https://api.tripadvisor.com/api',
    apiKey: process.env.TRIPADVISOR_API_KEY,
    version: '1.0'
  }
});

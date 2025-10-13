export const affiliateConfig = {
  booking: {
    baseUrl: process.env.BOOKING_BASE_URL,
    apiKey: process.env.BOOKING_COM_API_KEY, 
    secret: process.env.BOOKING_API_SECRET
  },
  tripadvisor: {
    baseUrl: process.env.TRIPADVISOR_BASE_URL,
    apiKey: process.env.TRIPADVISOR_API_KEY
  }
};

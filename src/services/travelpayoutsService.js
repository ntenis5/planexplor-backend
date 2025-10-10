// src/services/travelpayoutsService.js
import axios from 'axios';

export class TravelPayoutsService {
  constructor() {
    this.baseUrl = process.env.TRAVELPAYOUTS_BASE_URL;
    this.token = process.env.TRAVELPAYOUTS_API_TOKEN;
    this.marker = process.env.TRAVELPAYOUTS_MARKER;
    this.locale = process.env.TRAVELPAYOUTS_LOCALE || 'en';
    this.currency = process.env.TRAVELPAYOUTS_CURRENCY || 'eur';
  }

  // 🔍 KËRKIM I FLUTURIMEVE
  async searchFlights(params) {
    const {
      origin,
      destination,
      departDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0
    } = params;

    try {
      const response = await axios.get(`${this.baseUrl}/v2/prices/latest`, {
        params: {
          currency: this.currency,
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          beginning_of_period: departDate,
          period_type: 'year',
          limit: 1000,
          show_to_affiliates: true,
          sorting: 'price',
          token: this.token
        },
        timeout: 15000
      });

      return this.formatFlightResults(response.data);
    } catch (error) {
      console.error('TravelPayouts API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch flights data');
    }
  }

  // 📊 FLUTURIME MË TË LIRA
  async getCheapestFlights(origin, destination) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/prices/cheap`, {
        params: {
          currency: this.currency,
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          token: this.token
        }
      });

      return this.formatCheapFlights(response.data);
    } catch (error) {
      console.error('TravelPayouts Cheap Flights Error:', error);
      throw error;
    }
  }

  // 🗺️ SUGJERIME PËR DESTINACIONE
  async getDestinationSuggestions(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/city-directions`, {
        params: {
          currency: this.currency,
          origin: query.toUpperCase(),
          token: this.token
        }
      });

      return this.formatSuggestions(response.data);
    } catch (error) {
      console.error('TravelPayouts Suggestions Error:', error);
      return [];
    }
  }

  // 🏙️ LISTA E AEROPORTEVE
  async getAirports() {
    try {
      const response = await axios.get(`${this.baseUrl}/data/en/airports.json`, {
        params: {
          token: this.token
        }
      });

      return response.data;
    } catch (error) {
      console.error('TravelPayouts Airports Error:', error);
      return [];
    }
  }

  // 🔄 FORMATIMI I REZULTATEVE
  formatFlightResults(data) {
    if (!data.data) return [];

    return data.data.map(flight => ({
      id: flight.id,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.depart_date,
      returnDate: flight.return_date,
      price: flight.value,
      currency: flight.currency,
      airline: flight.airline,
      flightNumber: flight.flight_number,
      duration: flight.duration,
      transfers: flight.transfers,
      deepLink: this.generateDeepLink(flight),
      lastUpdate: new Date().toISOString()
    }));
  }

  formatCheapFlights(data) {
    if (!data.data) return [];

    const flights = [];
    Object.entries(data.data).forEach(([destination, flightData]) => {
      flights.push({
        destination,
        price: flightData.price,
        airline: flightData.airline,
        flightNumber: flightData.flight_number,
        departureDate: flightData.departure_at,
        returnDate: flightData.return_at,
        transfers: flightData.transfers,
        deepLink: this.generateDeepLink(flightData)
      });
    });

    return flights;
  }

  formatSuggestions(data) {
    if (!data.data) return [];

    const suggestions = [];
    Object.entries(data.data).forEach(([destination, info]) => {
      suggestions.push({
        destination,
        price: info.price,
        airline: info.airline,
        departureDate: info.departure_at
      });
    });

    return suggestions.sort((a, b) => a.price - b.price).slice(0, 10);
  }

  // 🔗 GENERO DEEP LINK PËR REZERVIM
  generateDeepLink(flight) {
    const baseUrl = 'https://aviasales.tp.st';
    const params = new URLSearchParams({
      origin: flight.origin,
      destination: flight.destination,
      depart_date: flight.depart_date,
      return_date: flight.return_date,
      adults: flight.adults || 1,
      children: flight.children || 0,
      infants: flight.infants || 0,
      marker: this.marker,
      with_request: true
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

export const travelPayoutsService = new TravelPayoutsService();

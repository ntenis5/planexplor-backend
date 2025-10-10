// src/services/travelpayoutsService.d.ts
declare module '../services/travelpayoutsService.js' {
  export class TravelPayoutsService {
    searchFlights(params: any): Promise<any>;
    getCheapestFlights(origin: string, destination?: string): Promise<any>;
    getDestinationSuggestions(query: string): Promise<any>;
    getAirports(): Promise<any>;
  }
  
  export const travelPayoutsService: TravelPayoutsService;
}

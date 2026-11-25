export type TravelStyle = '맛집' | '자연' | '박물관' | '쇼핑';

export type BudgetLevel = '아끼기' | '보통' | '여유';

export type TimeOfDay = '오전' | '오후' | '저녁';

export interface ItineraryRequest {
  city: string;
  days: number;
  styles: TravelStyle[];
  budget: BudgetLevel;
}

export interface ItinerarySlot {
  timeOfDay: TimeOfDay;
  placeName: string;
  category: string;
  description: string;
  estimatedCost: string;
  tip: string;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  dailyBudget: string;
  slots: ItinerarySlot[];
}

export interface ItineraryResponse {
  city: string;
  daysCount: number;
  styles: TravelStyle[];
  budget: BudgetLevel;
  summary: string;
  totalEstimatedCost: string;
  days: ItineraryDay[];
}

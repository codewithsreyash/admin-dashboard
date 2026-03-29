export type DashboardLocation = {
  lat: number;
  lng: number;
};

export type DashboardTourist = {
  _id?: string;
  blockchainId: string;
  id: string;
  passportHash?: string;
  name: string;
  tripId: string;
  currentLocation: DashboardLocation | null;
  safetyScore: number;
  status: string;
  lastPing: string;
  lat?: number | null;
  lng?: number | null;
};

export type DashboardAlert = {
  _id?: string;
  alertId: string;
  touristId: string;
  tripId: string;
  type: string;
  status: string;
  timestamp: string;
  location: DashboardLocation | null;
  lat?: number | null;
  lng?: number | null;
};

export type DashboardTrip = {
  _id: string;
  tripId: string;
  title: string;
  name?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  touristIds: string[];
  touristCount?: number;
  tourists: DashboardTourist[];
  alerts: DashboardAlert[];
};

export type DashboardTripsResponse = {
  trips: DashboardTrip[];
  error?: string;
};

export type TouristDirectoryResponse = {
  tourists: DashboardTourist[];
  error?: string;
};

export type DashboardLocationUpdateEvent = {
  tripId: string;
  touristId: string;
  tourist: DashboardTourist | null;
  evaluation?: {
    touristId: string;
    tripId: string;
    safetyScore: number;
    isApproaching: boolean;
    isAtRisk: boolean;
  };
  timestamp: string;
};

export type DashboardAlertEvent = {
  tripId: string;
  touristId: string;
  tourist: DashboardTourist | null;
  alert: DashboardAlert;
};

export type DashboardLocation = {
  lat: number;
  lng: number;
};

export type DashboardTourist = {
  blockchainId: string;
  id: string;
  name: string;
  tripId: string;
  currentLocation: DashboardLocation;
  safetyScore: number;
  status: string;
  lastPing: string;
};

export type DashboardAlert = {
  alertId: string;
  touristId: string;
  tripId: string;
  type: string;
  status: string;
  timestamp: string;
  location: DashboardLocation | null;
};

export type DashboardTrip = {
  _id: string;
  tripId: string;
  title: string;
  touristIds: string[];
  tourists: DashboardTourist[];
  alerts: DashboardAlert[];
};

export type DashboardTripsResponse = {
  trips: DashboardTrip[];
  error?: string;
};

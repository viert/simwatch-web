export type Point = {
  lat: number;
  lng: number;
};

export interface MapBounds {
  min: Point;
  max: Point;
}

export interface MapBoundsEx extends MapBounds {
  zoom: number;
}

export type WeatherInfo = {
  callsign?: string;
  raw: string;
  dew_point: number;
  temperature: number;
  wind_direction_deg: number;
  wind_direction_vrb: string;
  wind_gust: number | null;
  wind_speed: number;
  side_wind_to?: number;
  side_wind_lnd?: number;
  ts: string;
};

export type Airport = {
  icao: string;
  iata: string;
  name: string;
  position: Point;
  fir_id: string;
  is_pseudo: boolean;
  controllers: ControllerSet;
  runways: { [key: string]: Runway };
  wx: WeatherInfo | null;
};

export type Controller = {
  cid: number;
  name: string;
  human_readable: string;
  callsign: string;
  freq: number;
  facility: string;
  rating: number;
  server: string;
  visual_range: number;
  atis_code: string;
  text_atis: string;
  logon_time: string;
  last_updated: string;
};

export type ControllerSet = {
  atis: Controller | null;
  delivery: Controller | null;
  ground: Controller | null;
  tower: Controller | null;
  approach: Controller | null;
};

export type AircraftType = {
  name: string;
  description: string;
  wtc: string;
  wtg: string;
  designator: string;
  manufacturer_code: string;
  engine_count: number;
  engine_type: string;
};

export type Pilot = {
  cid: number;
  name: string;
  callsign: string;
  server: string;
  pilotRating: number;
  position: Point;
  altitude: number;
  groundspeed: number;
  transponder: string;
  heading: number;
  qnh_i_hg: number;
  qnh_mb: number;
  logon_time: Date;
  last_updated: Date;
  flight_plan: FlightPlan | null;
  track?: TrackPoint[];
  aircraft_type: AircraftType | null;
};

export type FlightPlan = {
  flight_rules: string;
  aircraft: string;
  departure: string;
  arrival: string;
  alternate: string;
  cruise_tas: string;
  altitude: number;
  deptime: string;
  enroute_time: string;
  fuel_time: string;
  remarks: string;
  route: string;
};

export type Radar = {
  ctrl: Controller;
  firs: FIR[];
};

export type FIR = {
  icao: string;
  name: string;
  prefix: string;
  boundaries: Boundaries;
  controllers: Record<string, Controller>;
};

export type PointList = {
  points: Point[];
};

export type Boundaries = {
  id: string;
  region: string;
  division: string;
  is_oceanic: boolean;
  min: Point;
  max: Point;
  center: Point;
  points: PointList[];
};

export type TrackPoint = {
  lat: number;
  lng: number;
  hdg: number;
  alt: number;
  gs: number;
  ts: number;
};

export type Runway = {
  icao: string;
  ident: string;
  length_ft: number;
  width_ft: number;
  surface: string;
  lighted: boolean;
  closed: boolean;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  heading: number;
  active_to: boolean;
  active_lnd: boolean;
};

export enum RadarToggleType {
  PILOTS,
  ATC,
  WX,
}

export type APIConnectHandler = (args: any) => void;
export type APIConnectEvent =
  | "connect"
  | "close"
  | "set-pilots"
  | "set-airports"
  | "set-firs"
  | "del-pilots"
  | "del-airports"
  | "del-firs"
  | "error";
export type APIConnectState = {
  pilots: Record<string, Pilot>;
  airports: Record<string, Airport>;
  firs: Record<string, FIR>;
};

export type APIConnectServerUpdate = {
  connection_id: string;
  message_type: string;
  object_type: string;
  data: {
    set?: {
      pilots?: Pilot[];
      airports?: Airport[];
      firs?: FIR[];
    };
    delete?: {
      pilots?: Pilot[];
      airports?: Airport[];
      firs?: FIR[];
    };
  };
};

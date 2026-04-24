export type EventType =
  | "airstrike"
  | "missile"
  | "drone"
  | "shelling"
  | "ground"
  | "naval"
  | "casualties"
  | "diplomacy"
  | "cyber"
  | "humanitarian"
  | "other";

export type Confidence = "high" | "medium" | "low";

export interface GeoLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  confidence: Confidence;
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export interface WarEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  receivedAt: string;
  location: GeoLocation;
  eventType: EventType;
  severity: number;
  keywords: string[];
}

export interface StreamMessage {
  type: "init" | "event" | "heartbeat";
  event?: WarEvent;
  events?: WarEvent[];
  ts: number;
}

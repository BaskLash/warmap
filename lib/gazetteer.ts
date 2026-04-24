import type { Confidence, GeoLocation } from "./types";

export type GazScope =
  | "city"
  | "region"
  | "country"
  | "strategic_waterway"
  | "sea"
  | "base";

interface GazEntry {
  name: string;
  aliases?: string[];
  country: string;
  lat: number;
  lng: number;
  scope: GazScope;
}

// Curated gazetteer of places recurring in current conflict reporting.
// Coordinates are approximate city centers or region centroids.
export const GAZETTEER: GazEntry[] = [
  // Ukraine
  { name: "Kyiv", aliases: ["Kiev"], country: "Ukraine", lat: 50.4501, lng: 30.5234, scope: "city" },
  { name: "Kharkiv", aliases: ["Kharkov"], country: "Ukraine", lat: 49.9935, lng: 36.2304, scope: "city" },
  { name: "Odesa", aliases: ["Odessa"], country: "Ukraine", lat: 46.4825, lng: 30.7233, scope: "city" },
  { name: "Lviv", country: "Ukraine", lat: 49.8397, lng: 24.0297, scope: "city" },
  { name: "Dnipro", country: "Ukraine", lat: 48.4647, lng: 35.0462, scope: "city" },
  { name: "Zaporizhzhia", aliases: ["Zaporizhia", "Zaporozhye"], country: "Ukraine", lat: 47.8388, lng: 35.1396, scope: "city" },
  { name: "Mariupol", country: "Ukraine", lat: 47.0971, lng: 37.5434, scope: "city" },
  { name: "Mykolaiv", aliases: ["Nikolaev"], country: "Ukraine", lat: 46.975, lng: 31.995, scope: "city" },
  { name: "Kherson", country: "Ukraine", lat: 46.6354, lng: 32.6169, scope: "city" },
  { name: "Donetsk", country: "Ukraine", lat: 48.0159, lng: 37.8028, scope: "city" },
  { name: "Luhansk", aliases: ["Lugansk"], country: "Ukraine", lat: 48.574, lng: 39.307, scope: "city" },
  { name: "Bakhmut", country: "Ukraine", lat: 48.5945, lng: 37.9995, scope: "city" },
  { name: "Avdiivka", country: "Ukraine", lat: 48.1396, lng: 37.7431, scope: "city" },
  { name: "Kupiansk", aliases: ["Kupyansk"], country: "Ukraine", lat: 49.7105, lng: 37.6158, scope: "city" },
  { name: "Pokrovsk", country: "Ukraine", lat: 48.2811, lng: 37.1769, scope: "city" },
  { name: "Kramatorsk", country: "Ukraine", lat: 48.7383, lng: 37.5844, scope: "city" },
  { name: "Sloviansk", country: "Ukraine", lat: 48.8585, lng: 37.6166, scope: "city" },
  { name: "Sumy", country: "Ukraine", lat: 50.9077, lng: 34.7981, scope: "city" },
  { name: "Chernihiv", country: "Ukraine", lat: 51.4982, lng: 31.2893, scope: "city" },
  { name: "Vinnytsia", country: "Ukraine", lat: 49.2331, lng: 28.4682, scope: "city" },
  { name: "Poltava", country: "Ukraine", lat: 49.5883, lng: 34.5514, scope: "city" },
  { name: "Crimea", country: "Ukraine", lat: 45.3453, lng: 34.4997, scope: "region" },
  { name: "Sevastopol", country: "Ukraine", lat: 44.6167, lng: 33.5254, scope: "city" },
  { name: "Donbas", aliases: ["Donbass"], country: "Ukraine", lat: 48.3, lng: 38.0, scope: "region" },

  // Russia
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, scope: "city" },
  { name: "Belgorod", country: "Russia", lat: 50.5955, lng: 36.5873, scope: "city" },
  { name: "Rostov-on-Don", aliases: ["Rostov on Don"], country: "Russia", lat: 47.2357, lng: 39.7015, scope: "city" },
  { name: "Kursk", country: "Russia", lat: 51.7304, lng: 36.1926, scope: "city" },
  { name: "Bryansk", country: "Russia", lat: 53.2521, lng: 34.3717, scope: "city" },
  { name: "Voronezh", country: "Russia", lat: 51.6754, lng: 39.2088, scope: "city" },
  { name: "St Petersburg", aliases: ["Saint Petersburg", "St. Petersburg"], country: "Russia", lat: 59.9311, lng: 30.3609, scope: "city" },
  { name: "Kazan", country: "Russia", lat: 55.8304, lng: 49.0661, scope: "city" },

  // Belarus / Moldova
  { name: "Minsk", country: "Belarus", lat: 53.9045, lng: 27.5615, scope: "city" },
  { name: "Chisinau", aliases: ["Kishinev"], country: "Moldova", lat: 47.0105, lng: 28.8638, scope: "city" },
  { name: "Tiraspol", country: "Moldova", lat: 46.8402, lng: 29.6433, scope: "city" },
  { name: "Transnistria", country: "Moldova", lat: 46.8, lng: 29.5, scope: "region" },

  // Israel / Palestine
  { name: "Gaza City", aliases: ["Gaza"], country: "Palestine", lat: 31.5017, lng: 34.4668, scope: "city" },
  { name: "Rafah", country: "Palestine", lat: 31.2889, lng: 34.2454, scope: "city" },
  { name: "Khan Younis", aliases: ["Khan Yunis"], country: "Palestine", lat: 31.3462, lng: 34.3027, scope: "city" },
  { name: "Deir al-Balah", aliases: ["Deir el-Balah"], country: "Palestine", lat: 31.4181, lng: 34.3517, scope: "city" },
  { name: "Jabalia", country: "Palestine", lat: 31.5272, lng: 34.4831, scope: "city" },
  { name: "Ramallah", country: "Palestine", lat: 31.9038, lng: 35.2034, scope: "city" },
  { name: "Nablus", country: "Palestine", lat: 32.2211, lng: 35.2544, scope: "city" },
  { name: "Jenin", country: "Palestine", lat: 32.4614, lng: 35.2959, scope: "city" },
  { name: "Hebron", country: "Palestine", lat: 31.5326, lng: 35.0998, scope: "city" },
  { name: "West Bank", country: "Palestine", lat: 31.95, lng: 35.3, scope: "region" },
  { name: "Gaza Strip", country: "Palestine", lat: 31.45, lng: 34.4, scope: "region" },
  { name: "Jerusalem", country: "Israel", lat: 31.7683, lng: 35.2137, scope: "city" },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, scope: "city" },
  { name: "Haifa", country: "Israel", lat: 32.7940, lng: 34.9896, scope: "city" },
  { name: "Ashkelon", country: "Israel", lat: 31.6693, lng: 34.5715, scope: "city" },
  { name: "Sderot", country: "Israel", lat: 31.5244, lng: 34.5953, scope: "city" },
  { name: "Eilat", country: "Israel", lat: 29.5577, lng: 34.9519, scope: "city" },
  { name: "Golan Heights", country: "Israel", lat: 33.0, lng: 35.75, scope: "region" },
  { name: "Sinai Peninsula", aliases: ["Sinai"], country: "Egypt", lat: 29.5, lng: 34.0, scope: "region" },

  // Lebanon
  { name: "Beirut", country: "Lebanon", lat: 33.8938, lng: 35.5018, scope: "city" },
  { name: "Tyre", aliases: ["Sour"], country: "Lebanon", lat: 33.2704, lng: 35.2038, scope: "city" },
  { name: "Sidon", aliases: ["Saida"], country: "Lebanon", lat: 33.5571, lng: 35.3729, scope: "city" },
  { name: "Baalbek", country: "Lebanon", lat: 34.0042, lng: 36.2075, scope: "city" },
  { name: "Nabatieh", country: "Lebanon", lat: 33.3789, lng: 35.4839, scope: "city" },

  // Syria
  { name: "Damascus", country: "Syria", lat: 33.5138, lng: 36.2765, scope: "city" },
  { name: "Aleppo", country: "Syria", lat: 36.2021, lng: 37.1343, scope: "city" },
  { name: "Homs", country: "Syria", lat: 34.7324, lng: 36.7137, scope: "city" },
  { name: "Idlib", country: "Syria", lat: 35.9306, lng: 36.6339, scope: "city" },
  { name: "Latakia", country: "Syria", lat: 35.5317, lng: 35.7911, scope: "city" },
  { name: "Deir ez-Zor", aliases: ["Deir Ezzor"], country: "Syria", lat: 35.3333, lng: 40.15, scope: "city" },
  { name: "Raqqa", country: "Syria", lat: 35.9528, lng: 39.0079, scope: "city" },
  { name: "Hama", country: "Syria", lat: 35.1318, lng: 36.7578, scope: "city" },
  { name: "Al-Tanf", aliases: ["At Tanf", "al-Tanf"], country: "Syria", lat: 33.4978, lng: 38.6083, scope: "base" },

  // Iraq
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661, scope: "city" },
  { name: "Mosul", country: "Iraq", lat: 36.335, lng: 43.1189, scope: "city" },
  { name: "Erbil", aliases: ["Irbil"], country: "Iraq", lat: 36.1911, lng: 44.0094, scope: "city" },
  { name: "Basra", country: "Iraq", lat: 30.5081, lng: 47.7804, scope: "city" },
  { name: "Fallujah", country: "Iraq", lat: 33.3489, lng: 43.7817, scope: "city" },
  { name: "Ain al-Asad", aliases: ["Ain al Asad", "Al Asad Air Base"], country: "Iraq", lat: 33.7853, lng: 42.4411, scope: "base" },
  { name: "Kurdistan", aliases: ["Iraqi Kurdistan", "Kurdish region"], country: "Iraq", lat: 36.2, lng: 44.0, scope: "region" },

  // Iran
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890, scope: "city" },
  { name: "Isfahan", country: "Iran", lat: 32.6546, lng: 51.6680, scope: "city" },
  { name: "Natanz", country: "Iran", lat: 33.5074, lng: 51.9156, scope: "base" },
  { name: "Fordow", aliases: ["Fordo"], country: "Iran", lat: 34.8853, lng: 50.9939, scope: "base" },
  { name: "Bushehr", country: "Iran", lat: 28.9684, lng: 50.8385, scope: "city" },
  { name: "Bandar Abbas", country: "Iran", lat: 27.1865, lng: 56.2808, scope: "city" },

  // Yemen
  { name: "Sanaa", aliases: ["Sana'a"], country: "Yemen", lat: 15.3694, lng: 44.1910, scope: "city" },
  { name: "Aden", country: "Yemen", lat: 12.7855, lng: 45.0187, scope: "city" },
  { name: "Hodeidah", aliases: ["Hudaydah", "Al Hudaydah"], country: "Yemen", lat: 14.7978, lng: 42.9545, scope: "city" },
  { name: "Taiz", country: "Yemen", lat: 13.5795, lng: 44.0209, scope: "city" },
  { name: "Marib", country: "Yemen", lat: 15.4696, lng: 45.3263, scope: "city" },
  { name: "Socotra", country: "Yemen", lat: 12.4634, lng: 53.8236, scope: "region" },

  // Saudi Arabia / Gulf
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, scope: "city" },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925, scope: "city" },
  { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773, scope: "city" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, scope: "city" },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.5310, scope: "city" },

  // Turkey
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, scope: "city" },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597, scope: "city" },
  { name: "Gaziantep", country: "Turkey", lat: 37.0662, lng: 37.3833, scope: "city" },
  { name: "Incirlik", aliases: ["Incirlik Air Base"], country: "Turkey", lat: 37.0017, lng: 35.4259, scope: "base" },

  // Egypt
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, scope: "city" },

  // Sudan
  { name: "Khartoum", country: "Sudan", lat: 15.5007, lng: 32.5599, scope: "city" },
  { name: "Omdurman", country: "Sudan", lat: 15.6440, lng: 32.4771, scope: "city" },
  { name: "Port Sudan", country: "Sudan", lat: 19.6158, lng: 37.2164, scope: "city" },
  { name: "El Fasher", aliases: ["Al Fashir"], country: "Sudan", lat: 13.6283, lng: 25.3500, scope: "city" },
  { name: "Nyala", country: "Sudan", lat: 12.0500, lng: 24.8833, scope: "city" },
  { name: "Darfur", country: "Sudan", lat: 13.0, lng: 24.5, scope: "region" },

  // Horn of Africa
  { name: "Mogadishu", country: "Somalia", lat: 2.0469, lng: 45.3182, scope: "city" },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7469, scope: "city" },
  { name: "Tigray", country: "Ethiopia", lat: 13.5, lng: 39.0, scope: "region" },
  { name: "Mekelle", country: "Ethiopia", lat: 13.4967, lng: 39.4697, scope: "city" },
  { name: "Asmara", country: "Eritrea", lat: 15.3229, lng: 38.9251, scope: "city" },

  // Sahel
  { name: "Bamako", country: "Mali", lat: 12.6392, lng: -8.0029, scope: "city" },
  { name: "Gao", country: "Mali", lat: 16.2667, lng: -0.0500, scope: "city" },
  { name: "Ouagadougou", country: "Burkina Faso", lat: 12.3714, lng: -1.5197, scope: "city" },
  { name: "Niamey", country: "Niger", lat: 13.5117, lng: 2.1251, scope: "city" },
  { name: "Nouakchott", country: "Mauritania", lat: 18.0735, lng: -15.9582, scope: "city" },
  { name: "Sahel", country: "Africa", lat: 14.0, lng: 0.0, scope: "region" },

  // Nigeria / Lake Chad
  { name: "Abuja", country: "Nigeria", lat: 9.0579, lng: 7.4951, scope: "city" },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, scope: "city" },
  { name: "Maiduguri", country: "Nigeria", lat: 11.8311, lng: 13.1510, scope: "city" },
  { name: "N'Djamena", country: "Chad", lat: 12.1348, lng: 15.0557, scope: "city" },

  // DRC / Great Lakes
  { name: "Kinshasa", country: "DRC", lat: -4.4419, lng: 15.2663, scope: "city" },
  { name: "Goma", country: "DRC", lat: -1.6771, lng: 29.2218, scope: "city" },
  { name: "Bukavu", country: "DRC", lat: -2.5079, lng: 28.8603, scope: "city" },
  { name: "Kigali", country: "Rwanda", lat: -1.9441, lng: 30.0619, scope: "city" },
  { name: "Bujumbura", country: "Burundi", lat: -3.3614, lng: 29.3599, scope: "city" },

  // Myanmar
  { name: "Naypyidaw", aliases: ["Nay Pyi Taw"], country: "Myanmar", lat: 19.7633, lng: 96.0785, scope: "city" },
  { name: "Yangon", aliases: ["Rangoon"], country: "Myanmar", lat: 16.8409, lng: 96.1735, scope: "city" },
  { name: "Mandalay", country: "Myanmar", lat: 21.9588, lng: 96.0891, scope: "city" },
  { name: "Rakhine", country: "Myanmar", lat: 20.0, lng: 93.5, scope: "region" },

  // Pakistan / Afghanistan
  { name: "Kabul", country: "Afghanistan", lat: 34.5553, lng: 69.2075, scope: "city" },
  { name: "Kandahar", country: "Afghanistan", lat: 31.6100, lng: 65.7100, scope: "city" },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479, scope: "city" },
  { name: "Peshawar", country: "Pakistan", lat: 34.0151, lng: 71.5249, scope: "city" },
  { name: "Quetta", country: "Pakistan", lat: 30.1798, lng: 66.9750, scope: "city" },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011, scope: "city" },
  { name: "Balochistan", aliases: ["Baluchistan"], country: "Pakistan", lat: 28.5, lng: 65.5, scope: "region" },

  // Kashmir
  { name: "Srinagar", country: "India", lat: 34.0837, lng: 74.7973, scope: "city" },
  { name: "Kashmir", country: "India", lat: 34.0, lng: 76.0, scope: "region" },
  { name: "Line of Control", aliases: ["LoC"], country: "India", lat: 34.2, lng: 74.5, scope: "region" },

  // Korea peninsula
  { name: "Pyongyang", country: "North Korea", lat: 39.0392, lng: 125.7625, scope: "city" },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, scope: "city" },
  { name: "DMZ", aliases: ["Korean DMZ", "demilitarized zone"], country: "Korea", lat: 38.3167, lng: 127.2, scope: "region" },

  // Taiwan / South China Sea
  { name: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654, scope: "city" },
  { name: "Kaohsiung", country: "Taiwan", lat: 22.6273, lng: 120.3014, scope: "city" },

  // Venezuela / Guyana / Haiti / Mexico
  { name: "Caracas", country: "Venezuela", lat: 10.4806, lng: -66.9036, scope: "city" },
  { name: "Georgetown", country: "Guyana", lat: 6.8013, lng: -58.1551, scope: "city" },
  { name: "Essequibo", country: "Guyana", lat: 6.5, lng: -59.0, scope: "region" },
  { name: "Port-au-Prince", country: "Haiti", lat: 18.5944, lng: -72.3074, scope: "city" },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, scope: "city" },

  // Caucasus
  { name: "Yerevan", country: "Armenia", lat: 40.1792, lng: 44.4991, scope: "city" },
  { name: "Baku", country: "Azerbaijan", lat: 40.4093, lng: 49.8671, scope: "city" },
  { name: "Nagorno-Karabakh", aliases: ["Artsakh"], country: "Azerbaijan", lat: 39.85, lng: 46.75, scope: "region" },
  { name: "Tbilisi", country: "Georgia", lat: 41.7151, lng: 44.8271, scope: "city" },
  { name: "South Ossetia", country: "Georgia", lat: 42.3, lng: 44.0, scope: "region" },
  { name: "Abkhazia", country: "Georgia", lat: 43.0, lng: 41.0, scope: "region" },

  // ── Strategic waterways (critical for shipping, maritime incidents) ──
  { name: "Strait of Hormuz", aliases: ["Hormuz Strait", "Hormuz"], country: "International waters", lat: 26.5667, lng: 56.25, scope: "strategic_waterway" },
  { name: "Bab el-Mandeb", aliases: ["Bab-el-Mandeb", "Bab al-Mandab", "Bab-al-Mandab"], country: "International waters", lat: 12.5833, lng: 43.3333, scope: "strategic_waterway" },
  { name: "Suez Canal", country: "Egypt", lat: 30.5852, lng: 32.2654, scope: "strategic_waterway" },
  { name: "Bosphorus", aliases: ["Bosporus", "Bosphorus Strait"], country: "Turkey", lat: 41.1183, lng: 29.0686, scope: "strategic_waterway" },
  { name: "Dardanelles", aliases: ["Strait of the Dardanelles"], country: "Turkey", lat: 40.2167, lng: 26.4, scope: "strategic_waterway" },
  { name: "Taiwan Strait", country: "International waters", lat: 24.5, lng: 119.5, scope: "strategic_waterway" },
  { name: "Strait of Malacca", aliases: ["Malacca Strait"], country: "International waters", lat: 2.5, lng: 101.5, scope: "strategic_waterway" },
  { name: "Strait of Gibraltar", country: "International waters", lat: 35.9667, lng: -5.6, scope: "strategic_waterway" },
  { name: "Kerch Strait", country: "International waters", lat: 45.3, lng: 36.5, scope: "strategic_waterway" },
  { name: "English Channel", country: "International waters", lat: 50.2, lng: 0.5, scope: "strategic_waterway" },

  // ── Seas, gulfs, ocean regions ──
  { name: "Red Sea", country: "International waters", lat: 20.0, lng: 38.0, scope: "sea" },
  { name: "Black Sea", country: "International waters", lat: 43.0, lng: 34.0, scope: "sea" },
  { name: "South China Sea", country: "International waters", lat: 15.0, lng: 115.0, scope: "sea" },
  { name: "East China Sea", country: "International waters", lat: 29.0, lng: 125.0, scope: "sea" },
  { name: "Mediterranean Sea", aliases: ["Mediterranean", "Eastern Mediterranean"], country: "International waters", lat: 35.0, lng: 18.0, scope: "sea" },
  { name: "Persian Gulf", aliases: ["Arabian Gulf"], country: "International waters", lat: 26.5, lng: 52.0, scope: "sea" },
  { name: "Gulf of Oman", country: "International waters", lat: 25.0, lng: 58.0, scope: "sea" },
  { name: "Gulf of Aden", country: "International waters", lat: 13.0, lng: 48.0, scope: "sea" },
  { name: "Arabian Sea", country: "International waters", lat: 14.0, lng: 65.0, scope: "sea" },
  { name: "Sea of Azov", country: "International waters", lat: 46.0, lng: 36.5, scope: "sea" },
  { name: "Baltic Sea", country: "International waters", lat: 58.0, lng: 20.0, scope: "sea" },
  { name: "Gulf of Guinea", country: "International waters", lat: 2.0, lng: 5.0, scope: "sea" },
  { name: "Horn of Africa", country: "Africa", lat: 8.0, lng: 48.0, scope: "region" },

  // Country-level fallbacks
  { name: "Ukraine", country: "Ukraine", lat: 49.0, lng: 31.0, scope: "country" },
  { name: "Russia", country: "Russia", lat: 61.5240, lng: 105.3188, scope: "country" },
  { name: "Israel", country: "Israel", lat: 31.0461, lng: 34.8516, scope: "country" },
  { name: "Palestine", country: "Palestine", lat: 31.9522, lng: 35.2332, scope: "country" },
  { name: "Lebanon", country: "Lebanon", lat: 33.8547, lng: 35.8623, scope: "country" },
  { name: "Syria", country: "Syria", lat: 34.8021, lng: 38.9968, scope: "country" },
  { name: "Iraq", country: "Iraq", lat: 33.2232, lng: 43.6793, scope: "country" },
  { name: "Iran", country: "Iran", lat: 32.4279, lng: 53.6880, scope: "country" },
  { name: "Yemen", country: "Yemen", lat: 15.5527, lng: 48.5164, scope: "country" },
  { name: "Egypt", country: "Egypt", lat: 26.8206, lng: 30.8025, scope: "country" },
  { name: "Sudan", country: "Sudan", lat: 12.8628, lng: 30.2176, scope: "country" },
  { name: "Somalia", country: "Somalia", lat: 5.1521, lng: 46.1996, scope: "country" },
  { name: "Ethiopia", country: "Ethiopia", lat: 9.1450, lng: 40.4897, scope: "country" },
  { name: "Mali", country: "Mali", lat: 17.5707, lng: -3.9962, scope: "country" },
  { name: "Burkina Faso", country: "Burkina Faso", lat: 12.2383, lng: -1.5616, scope: "country" },
  { name: "Niger", country: "Niger", lat: 17.6078, lng: 8.0817, scope: "country" },
  { name: "Nigeria", country: "Nigeria", lat: 9.0820, lng: 8.6753, scope: "country" },
  { name: "DRC", aliases: ["Congo", "Democratic Republic of the Congo"], country: "DRC", lat: -4.0383, lng: 21.7587, scope: "country" },
  { name: "Myanmar", aliases: ["Burma"], country: "Myanmar", lat: 21.9162, lng: 95.9560, scope: "country" },
  { name: "Afghanistan", country: "Afghanistan", lat: 33.9391, lng: 67.7100, scope: "country" },
  { name: "Pakistan", country: "Pakistan", lat: 30.3753, lng: 69.3451, scope: "country" },
  { name: "Taiwan", country: "Taiwan", lat: 23.6978, lng: 120.9605, scope: "country" },
  { name: "North Korea", country: "North Korea", lat: 40.3399, lng: 127.5101, scope: "country" },
  { name: "Haiti", country: "Haiti", lat: 18.9712, lng: -72.2852, scope: "country" },
  { name: "Venezuela", country: "Venezuela", lat: 6.4238, lng: -66.5897, scope: "country" },
  { name: "Armenia", country: "Armenia", lat: 40.0691, lng: 45.0382, scope: "country" },
  { name: "Azerbaijan", country: "Azerbaijan", lat: 40.1431, lng: 47.5769, scope: "country" },
  { name: "Turkey", country: "Turkey", lat: 39.0, lng: 35.0, scope: "country" },
];

const SCOPE_CONFIDENCE: Record<GazScope, Confidence> = {
  city: "high",
  base: "high",
  strategic_waterway: "high",
  region: "medium",
  sea: "medium",
  country: "low",
};

const SCOPE_WEIGHT: Record<GazScope, number> = {
  city: 3.0,
  base: 3.0,
  strategic_waterway: 2.8,
  region: 2.0,
  sea: 1.8,
  country: 1.0,
};

// Pre-built name index for fast O(1) lookup by normalized name / alias.
const nameIndex: Map<string, GazEntry> = (() => {
  const m = new Map<string, GazEntry>();
  for (const entry of GAZETTEER) {
    const names = [entry.name, ...(entry.aliases ?? [])];
    for (const n of names) {
      const key = normalizeName(n);
      // prefer more specific scope if a name collides
      const existing = m.get(key);
      if (!existing || SCOPE_WEIGHT[entry.scope] > SCOPE_WEIGHT[existing.scope]) {
        m.set(key, entry);
      }
    }
  }
  return m;
})();

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function lookupByName(name: string): GeoLocation | null {
  if (!name) return null;
  const key = normalizeName(name);
  if (!key) return null;

  // Exact hit
  const direct = nameIndex.get(key);
  if (direct) return toGeoLocation(direct);

  // Try stripping common leading words ("the ", "strait of ", "gulf of ")
  const variants = new Set<string>();
  variants.add(key.replace(/^the /, ""));
  variants.add(key.replace(/^strait of /, ""));
  variants.add(key.replace(/^gulf of /, ""));
  variants.add(key.replace(/^sea of /, ""));
  for (const v of variants) {
    const hit = nameIndex.get(v);
    if (hit) return toGeoLocation(hit);
  }

  // Substring match — last resort, pick most specific
  let best: GazEntry | null = null;
  for (const entry of GAZETTEER) {
    const names = [entry.name, ...(entry.aliases ?? [])];
    for (const n of names) {
      const nk = normalizeName(n);
      if (!nk) continue;
      if (key.includes(nk) || nk.includes(key)) {
        if (!best || SCOPE_WEIGHT[entry.scope] > SCOPE_WEIGHT[best.scope]) {
          best = entry;
        }
      }
    }
  }
  return best ? toGeoLocation(best) : null;
}

export function lookupCountry(country: string): GeoLocation | null {
  if (!country) return null;
  const key = normalizeName(country);
  for (const entry of GAZETTEER) {
    if (entry.scope !== "country") continue;
    if (normalizeName(entry.name) === key) return toGeoLocation(entry);
    if (entry.aliases?.some((a) => normalizeName(a) === key)) {
      return toGeoLocation(entry);
    }
  }
  return null;
}

function toGeoLocation(entry: GazEntry): GeoLocation {
  return {
    name: entry.name,
    country: entry.country,
    lat: entry.lat,
    lng: entry.lng,
    confidence: SCOPE_CONFIDENCE[entry.scope],
  };
}

interface Match {
  entry: GazEntry;
  score: number;
  position: number;
}

const tokenize = (s: string): string =>
  " " + s.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ") + " ";

// Full-text scan over title + summary. Kept as a fallback path for the
// no-API-key mode. The LLM+geocoder pipeline uses `lookupByName` instead.
export function findLocation(title: string, summary: string = ""): GeoLocation | null {
  const titleHay = tokenize(title);
  const summaryHay = tokenize(summary);
  const matches: Match[] = [];

  for (const entry of GAZETTEER) {
    const names = [entry.name, ...(entry.aliases ?? [])];
    const scopeWeight = SCOPE_WEIGHT[entry.scope];

    let hit: { position: number; source: "title" | "summary" } | null = null;
    for (const n of names) {
      const needle = ` ${n.toLowerCase()} `;
      const titleIdx = titleHay.indexOf(needle);
      if (titleIdx !== -1) {
        hit = { position: titleIdx, source: "title" };
        break;
      }
      const summaryIdx = summaryHay.indexOf(needle);
      if (summaryIdx !== -1) {
        hit = { position: summaryIdx, source: "summary" };
      }
    }
    if (!hit) continue;

    const titleBonus = hit.source === "title" ? 4 : 0;
    const positionBonus =
      hit.source === "title"
        ? Math.max(0, 1 - hit.position / Math.max(titleHay.length, 1))
        : Math.max(0, 0.5 - hit.position / Math.max(summaryHay.length * 2, 1));

    matches.push({
      entry,
      score: scopeWeight + titleBonus + positionBonus,
      position: hit.position + (hit.source === "title" ? 0 : 10_000),
    });
  }

  if (matches.length === 0) return null;

  matches.sort((a, b) => b.score - a.score || a.position - b.position);
  return toGeoLocation(matches[0].entry);
}

export interface Source {
  id: string;
  name: string;
  url: string;
  category: "world" | "conflict" | "defense";
}

export const SOURCES: Source[] = [
  {
    id: "bbc-world",
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
  },
  {
    id: "reuters-world",
    name: "Reuters World",
    url: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best",
    category: "world",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "world",
  },
  {
    id: "guardian-world",
    name: "The Guardian — World",
    url: "https://www.theguardian.com/world/rss",
    category: "world",
  },
  {
    id: "guardian-ukraine",
    name: "The Guardian — Ukraine",
    url: "https://www.theguardian.com/world/ukraine/rss",
    category: "conflict",
  },
  {
    id: "guardian-israel",
    name: "The Guardian — Israel",
    url: "https://www.theguardian.com/world/israel/rss",
    category: "conflict",
  },
  {
    id: "kyiv-independent",
    name: "Kyiv Independent",
    url: "https://kyivindependent.com/rss/",
    category: "conflict",
  },
  {
    id: "dw-world",
    name: "Deutsche Welle",
    url: "https://rss.dw.com/rdf/rss-en-world",
    category: "world",
  },
  {
    id: "france24",
    name: "France 24",
    url: "https://www.france24.com/en/rss",
    category: "world",
  },
  {
    id: "npr-world",
    name: "NPR World",
    url: "https://feeds.npr.org/1004/rss.xml",
    category: "world",
  },
];

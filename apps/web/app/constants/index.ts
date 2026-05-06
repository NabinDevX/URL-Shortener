const useCases = [
  {
    icon: "🔐",
    title: "Hide Confidential URLs",
    description: "Keep your actual destination URLs private and secure",
    example: {
      before: "https://example.com/secret/token?key=abc123&user=john",
      after: "urltinier.app/prod25",
    },
  },
  {
    icon: "💼",
    title: "Protect Affiliate Links",
    description: "Hide commission links from competitors and scrapers",
    example: {
      before: "https://example.com/affiliate?id=12345&ref=partner",
      after: "urltinier.app/deal",
    },
  },
  {
    icon: "📊",
    title: "Secure Tracking Links",
    description: "Hide analytics parameters while keeping full tracking",
    example: {
      before:
        "https://analytics.example.com/?utm_source=twitter&utm_medium=social&utm_campaign=summer",
      after: "urltinier.app/offer",
    },
  },
  {
    icon: "🎯",
    title: "Professional Branding",
    description: "Create clean, branded links for business communications",
    example: {
      before:
        "https://example.com/calendar/meeting?id=abc123&auth=token123&private=true",
      after: "urltinier.app/meeting",
    },
  },
];

const problems = [
  {
    icon: "👁️",
    title: "Exposed Secrets",
    desc: "URLs reveal authentication tokens, API keys, and internal paths",
  },
  {
    icon: "🕵️",
    title: "Competitor Tracking",
    desc: "Affiliate links and campaign parameters visible to everyone",
  },
  {
    icon: "🎣",
    title: "Link Scrapers",
    desc: "Bots harvest and exploit your tracking parameters and destinations",
  },
  {
    icon: "😬",
    title: "Unprofessional Look",
    desc: "Long, messy URLs damage credibility in professional communications",
  },
];

const benefits = [
  {
    icon: "🔒",
    title: "Complete Privacy",
    desc: "Original URLs are never exposed publicly",
  },
  {
    icon: "🛡️",
    title: "Security First",
    desc: "Protect against link scraping and exploitation",
  },
  {
    icon: "💎",
    title: "Professional Image",
    desc: "Clean links build trust and credibility",
  },
  {
    icon: "📈",
    title: "Track Everything",
    desc: "Full analytics without revealing parameters",
  },
  {
    icon: "🎨",
    title: "Custom Branding",
    desc: "Create memorable branded short links",
  },
  {
    icon: "⚡",
    title: "Instant Creation",
    desc: "Generate secure links in seconds",
  },
];

export { useCases, problems, benefits };

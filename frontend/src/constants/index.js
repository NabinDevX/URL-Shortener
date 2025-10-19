const useCases = [
  {
    icon: "🔐",
    title: "Hide Confidential URLs",
    description: "Keep your actual destination URLs private and secure",
    example: {
      before:
        "https://company-internal.com/secret-product-launch-2025/confidential-docs?auth=admin123&key=xyz789",
      after: "urltinier.app/prod25",
    },
  },
  {
    icon: "💼",
    title: "Protect Affiliate Links",
    description: "Hide commission links from competitors and scrapers",
    example: {
      before:
        "https://amazon.com/dp/B08N5WRWNW?tag=youraffid-20&ref=commission-link-secret",
      after: "urltinier.app/deal",
    },
  },
  {
    icon: "📊",
    title: "Secure Tracking Links",
    description: "Hide analytics parameters while keeping full tracking",
    example: {
      before:
        "https://landing-page.com/offer?utm_source=email&utm_campaign=vip&customer_id=12345",
      after: "urltinier.app/offer",
    },
  },
  {
    icon: "🎯",
    title: "Professional Branding",
    description: "Create clean, branded links for business communications",
    example: {
      before: "https://zoom.us/j/1234567890?pwd=abcdefghijklmnop&from=addon",
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

export { useCases, problems };

export const PRIVACY_HERO = {
  badge: "Legal",
  headline: "Privacy Policy",
  subtext: "How we collect, use, and protect your data.",
};

export type LegalSection = {
  id: string;
  title: string;
  body: string;
  callout?: string;
};

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: `When you create an account, we collect your name, email address, and profile information provided through our authentication service (Clerk). When you create events, we store event details such as title, date, location, and description.\n\nFor guests who RSVP, we collect the information the event organizer requests — typically name, email, and any custom questions set by the organizer. Guests do not need to create an Duhuze RSVP account to respond.`,
    callout:
      "We only collect information that is necessary to provide and improve the service.",
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    body: `We use your information to:\n\n• Provide, maintain, and improve the Duhuze RSVP platform\n• Send transactional emails (invitations, RSVP confirmations, reminders)\n• Communicate with you about your account or events\n• Analyze usage patterns to improve the product\n\nWe do not sell, rent, or trade your personal information to third parties for marketing purposes.`,
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    body: `We share your data only with service providers that help us operate the platform:\n\n• Clerk — authentication and user management\n• Neon — database hosting (PostgreSQL)\n• Resend — transactional email delivery\n• Hostinger — application hosting\n\nEach provider is bound by their own privacy policies and data processing agreements. We do not share guest data with anyone other than the event organizer who invited them.`,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    body: `We retain your account data for as long as your account is active. Event and guest data is retained for as long as the organizer's account exists. If you delete your account, we remove your personal data within 30 days, except where required by law.\n\nGuest RSVP data is associated with the event organizer's account. Guests can request removal of their data by contacting the event organizer or by emailing us directly.`,
  },
  {
    id: "cookies-and-tracking",
    title: "Cookies and Tracking",
    body: `We use essential cookies for authentication and session management. We do not use advertising cookies or third-party trackers.\n\nOur analytics are minimal and focused on aggregate usage patterns — we do not build individual user profiles for advertising.`,
    callout:
      "We use only essential cookies. No advertising trackers, ever.",
  },
  {
    id: "security",
    title: "Security",
    body: `We take reasonable measures to protect your data, including:\n\n• Encrypted connections (HTTPS/TLS) for all data in transit\n• Encrypted database storage at rest\n• Session tokens with automatic expiration\n• Role-based access controls for administrative functions\n\nNo system is perfectly secure. If you discover a vulnerability, please contact us at operations@izyodigital.com.`,
  },
  {
    id: "your-rights",
    title: "Your Rights",
    body: `You have the right to:\n\n• Access the personal data we hold about you\n• Correct inaccurate data\n• Request deletion of your data\n• Export your event and guest data\n• Withdraw consent for optional communications\n\nTo exercise any of these rights, contact us at operations@izyodigital.com.`,
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    body: `We may update this policy from time to time. When we make significant changes, we'll notify you by email or through a notice on the platform. Continued use of Duhuze RSVP after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "Contact",
    body: `If you have questions about this privacy policy or our data practices, contact us at:\n\n• Email: operations@izyodigital.com\n• General inquiries: info@rsvp-duhuze.com`,
  },
];

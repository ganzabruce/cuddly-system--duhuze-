import type { LegalSection } from "./privacy-content";

export const TERMS_HERO = {
  badge: "Legal",
  headline: "Terms of Service",
  subtext: "The rules and guidelines for using Duhuze RSVP.",
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: `By accessing or using Duhuze RSVP ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.\n\nThese terms apply to all users, including event organizers, guests, and visitors.`,
  },
  {
    id: "account-responsibilities",
    title: "Account Responsibilities",
    body: `You are responsible for maintaining the security of your account and for all activity that occurs under it. You must:\n\n• Provide accurate information when creating your account\n• Keep your login credentials secure\n• Notify us immediately of any unauthorized access\n• Not share your account with others\n\nWe reserve the right to suspend or terminate accounts that violate these terms.`,
    callout:
      "You are responsible for all activity under your account.",
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    body: `You agree not to use Duhuze RSVP to:\n\n• Violate any applicable laws or regulations\n• Send spam, phishing, or unsolicited communications\n• Upload malicious code, viruses, or harmful content\n• Impersonate another person or entity\n• Collect personal information from guests for purposes unrelated to your event\n• Interfere with or disrupt the Service\n\nWe may remove content or suspend accounts that violate these guidelines.`,
  },
  {
    id: "event-organizer-obligations",
    title: "Event Organizer Obligations",
    body: `As an event organizer, you are responsible for:\n\n• The accuracy of your event information\n• Obtaining appropriate consent from guests whose information you collect\n• Using guest data only for purposes related to your event\n• Complying with applicable data protection laws in your jurisdiction\n\nDuhuze RSVP provides tools for event management but is not a party to any agreements between organizers and their guests.`,
  },
  {
    id: "guest-data",
    title: "Guest Data",
    body: `Event organizers collect guest information through Duhuze RSVP. As a guest:\n\n• Your information is shared with the event organizer who invited you\n• You can request removal of your data by contacting the organizer or us\n• You do not need to create an Duhuze RSVP account to RSVP\n\nOrganizers are responsible for how they use guest data outside of the Duhuze RSVP platform.`,
  },
  {
    id: "payments-and-billing",
    title: "Payments and Billing",
    body: `Paid plans are billed in advance on a monthly or annual basis in RWF. Prices are subject to change with 30 days' notice.\n\n• You can upgrade or downgrade your plan at any time\n• Upgrades take effect after successful payment\n• Downgrades and cancellations take effect at the end of the current billing period\n• We do not offer automated refunds at this time\n• Free plans have no time limit but are subject to usage limits`,
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: `Duhuze RSVP and its original content, features, and functionality are owned by Duhuze RSVP and are protected by copyright and other intellectual property laws.\n\nYou retain ownership of any content you upload to the Service (event details, images, guest lists). By uploading content, you grant us a license to store, display, and transmit it as necessary to provide the Service.`,
  },
  {
    id: "service-availability",
    title: "Service Availability",
    body: `We strive to keep Duhuze RSVP available at all times but do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or circumstances beyond our control.\n\nWe are not liable for any loss or damage resulting from service interruptions.`,
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    body: `To the maximum extent permitted by law, Duhuze RSVP shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.\n\nOur total liability for any claim arising from these terms shall not exceed the amount you paid us in the 12 months preceding the claim.`,
    callout:
      "Our liability is limited to the fees you have paid in the preceding 12 months.",
  },
  {
    id: "termination",
    title: "Termination",
    body: `You can delete your account at any time. We may terminate or suspend your account if you violate these terms.\n\nUpon termination, your right to use the Service ceases immediately. We will retain your data for 30 days after account deletion, after which it is permanently removed.`,
  },
  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    body: `We may update these terms from time to time. When we make material changes, we will notify you by email or through a notice on the platform.\n\nContinued use of Duhuze RSVP after changes constitutes acceptance of the updated terms. If you disagree with the changes, you should stop using the Service.`,
  },
  {
    id: "contact",
    title: "Contact",
    body: `For questions about these terms, contact us at:\n\n• Email: operations@izyodigital.com\n• General inquiries: info@rsvp-duhuze.com`,
  },
];

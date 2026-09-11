import {
  EnvelopeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { InstagramIcon, TikTokIcon, FacebookIcon, LinkedInIcon } from "@/public";
import contactContent from "@/components/marketing/contact-content.json";

const socialIcons = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
} as const;

function isSocialIcon(icon: string): icon is keyof typeof socialIcons {
  return icon in socialIcons;
}

export function ContactInfo() {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
      {/* Email */}
      <a
        href={`mailto:${contactContent.email}`}
        className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <EnvelopeIcon className="h-4 w-4 text-primary/70 transition-colors group-hover:text-primary" />
        <span>{contactContent.email}</span>
      </a>

      <span className="hidden h-3.5 w-px bg-border sm:block" aria-hidden />

      {contactContent.socials.map((social) => {
        if (!isSocialIcon(social.icon)) {
          return null;
        }

        const Icon = socialIcons[social.icon];

        return (
          <a
            key={social.platform}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
            <span>{social.platform}</span>
          </a>
        );
      })}

      <span className="hidden h-3.5 w-px bg-border sm:block" aria-hidden />

      {/* Timezone */}
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <ClockIcon className="h-4 w-4 text-primary/70" />
        <span>{contactContent.timezone}</span>
      </div>
    </div>
  );
}

import Image from "next/image";

type GoogleIconProps = {
  className?: string;
};

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <Image
      src="/logos/google.svg"
      alt="Google"
      width={20}
      height={20}
      unoptimized
      className={className}
    />
  );
}

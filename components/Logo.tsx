import Image from "next/image";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export default function Logo({
  className = "",
  iconClassName = "",
  textClassName = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 ${iconClassName}`.trim()}
      >
        <Image
          src="/logo.png"
          alt="TheSaaSBook logo"
          width={44}
          height={44}
          sizes="44px"
          className="h-full w-full object-cover"
        />
      </span>
      <span
        className={`text-base font-semibold tracking-tight text-slate-950 sm:text-lg ${textClassName}`.trim()}
      >
        TheSaaSBook
      </span>
    </div>
  );
}

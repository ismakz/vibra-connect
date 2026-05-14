export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 40,
  className = "",
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  avatarUrl: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const label = initialsFrom(name, email);
  const src = avatarUrl?.trim();

  if (src) {
    return (
      <span
        className={`relative inline-block overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-violet-500/35 to-cyan-500/25 text-xs font-black uppercase tracking-tight text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] ${className}`}
      style={{ width: size, height: size, fontSize: size > 36 ? 13 : 11 }}
      aria-hidden
    >
      {label}
    </span>
  );
}

function initialsFrom(name: string | null | undefined, email: string | null | undefined) {
  const base = (name?.trim() || email?.trim() || "?").split(/\s+/).filter(Boolean);
  if (base.length >= 2) {
    return `${base[0]![0] ?? ""}${base[1]![0] ?? ""}`.toUpperCase().slice(0, 2);
  }
  const w = base[0] ?? "?";
  return w.slice(0, 2).toUpperCase();
}

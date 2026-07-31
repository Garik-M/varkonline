import { useIsDesktop } from "@/hooks/useBreakpoint";
import Advertisement from "@/components/Advertisement";

interface Props {
  slot?: string;
  className?: string;
}

// Shows a horizontal ad banner only on mobile and tablet.
// On desktop the sidebar ads in HomepageAdLayout handle advertising, so this returns null.
// Also returns null while the breakpoint is still being detected to avoid layout shift.
export default function MobileInlineBanner({
  slot = "INLINE_BANNER",
  className = "py-3",
}: Props) {
  const isDesktop = useIsDesktop();
  if (isDesktop !== false) return null;
  return (
    <div className={className}>
      <Advertisement slot={slot} />
    </div>
  );
}

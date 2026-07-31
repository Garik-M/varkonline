import { useIsDesktop } from "@/hooks/useBreakpoint";
import Advertisement from "@/components/Advertisement";

interface Props {
  children: React.ReactNode;
}

export default function HomepageAdLayout({ children }: Props) {
  const isDesktop = useIsDesktop();

  // On desktop: three-column flex layout — left sidebar | content | right sidebar
  if (isDesktop) {
    return (
      <div className="flex items-start gap-4 px-4">
        <aside className="w-[160px] xl:w-[200px] shrink-0 sticky top-20 self-start pt-6">
          <Advertisement slot="LEFT" />
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
        <aside className="w-[160px] xl:w-[200px] shrink-0 sticky top-20 self-start pt-6">
          <Advertisement slot="RIGHT" />
        </aside>
      </div>
    );
  }

  // Mobile / tablet (or still detecting): no sidebars, just content
  return <>{children}</>;
}

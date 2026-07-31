import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsDesktop } from "@/hooks/useBreakpoint";

interface AdData {
  id: string;
  pages: string[];
  positions: string[];
  destination_url: string;
  open_in_new_tab: boolean;
  image_desktop: string;
  image_tablet: string | null;
  image_mobile: string | null;
}

// Module-level cache — prevents re-fetching the same slot across remounts.
const cache = new Map<string, AdData | null>();

function selectImage(ad: AdData, isMobile: boolean, isDesktop: boolean | undefined, forceMobile: boolean = false): string {
  if (forceMobile) return ad.image_mobile ?? ad.image_desktop;
  if (isMobile) return ad.image_mobile ?? ad.image_desktop;
  if (isDesktop === false) return ad.image_tablet ?? ad.image_desktop; // tablet
  return ad.image_desktop;
}

interface Props {
  slot: string;
  className?: string;
  forceMobile?: boolean;
}

export default function Advertisement({ slot, className, forceMobile = false }: Props) {
  const [ad, setAd] = useState<AdData | null | undefined>(
    cache.has(slot) ? cache.get(slot) : undefined
  );
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Tracks whether an impression has already been fired for this mount.
  const impressionFired = useRef(false);
  const containerRef = useRef<HTMLAnchorElement>(null);

  // Fetch the ad for this slot
  useEffect(() => {
    if (cache.has(slot)) {
      setAd(cache.get(slot) ?? null);
      return;
    }
    let cancelled = false;
    api
      .getPublicAdvertisement(slot)
      .then((data: AdData | null) => {
        if (cancelled) return;
        cache.set(slot, data ?? null);
        setAd(data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        cache.set(slot, null);
        setAd(null);
      });
    return () => { cancelled = true; };
  }, [slot]);

  // Fire one impression when the banner scrolls into view for the first time.
  useEffect(() => {
    if (!ad || impressionFired.current || !containerRef.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !impressionFired.current) {
          impressionFired.current = true;
          observer.disconnect();
          // Fire-and-forget — never blocks rendering
          api.trackAdImpression(ad.id);
        }
      },
      { threshold: 0.5 } // at least half of the banner must be visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad]);

  // Not yet loaded or no ad — render nothing, take no space
  if (ad === undefined || ad === null) return null;

  const src = selectImage(ad, isMobile, isDesktop, forceMobile);
  // All navigation goes through the backend click endpoint which increments the
  // counter and redirects to the stored destination URL — client never supplies
  // the destination URL directly.
  const href = api.getAdClickUrl(ad.id);

  return (
    <a
      ref={containerRef}
      href={href}
      target={ad.open_in_new_tab ? "_blank" : "_self"}
      rel={ad.open_in_new_tab ? "noopener noreferrer" : undefined}
      className={className}
      aria-label="Advertisement"
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-full h-auto rounded-lg block"
      />
    </a>
  );
}

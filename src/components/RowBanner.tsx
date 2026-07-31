import Advertisement from "@/components/Advertisement";

interface Props {
  slot?: string;
  className?: string;
  forceMobile?: boolean;
}

// Shows a horizontal ad banner on all devices (desktop, tablet, mobile)
export default function RowBanner({
  slot = "HOME_MOBILE_ROW",
  className = "py-3",
  forceMobile = false,
}: Props) {
  return (
    <div className={className}>
      <Advertisement slot={slot} forceMobile={forceMobile} />
    </div>
  );
}

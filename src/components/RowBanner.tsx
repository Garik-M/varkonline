import Advertisement from "@/components/Advertisement";

interface Props {
  slot?: string;
  className?: string;
}

// Shows a horizontal ad banner on all devices (desktop, tablet, mobile)
export default function RowBanner({
  slot = "MOBILE_ROW",
  className = "py-3",
}: Props) {
  return (
    <div className={className}>
      <Advertisement slot={slot} />
    </div>
  );
}

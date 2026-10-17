import { useEffect, useRef } from "react";
import { createFinancingSdk, type FinancingSdk } from "./sdk-core";
import type { WidgetConfiguration } from "./types";
export default function PartnerPreview({
  configuration,
}: {
  configuration: WidgetConfiguration;
}) {
  const target = useRef<HTMLDivElement>(null);
  const sdk = useRef<FinancingSdk>();
  useEffect(() => {
    const origin = new URL(
      import.meta.env.VITE_API_URL ||
        "https://varkonlineback-production.up.railway.app/api",
    ).origin;
    sdk.current = createFinancingSdk(origin, false);
    return () => {
      sdk.current?.disconnect();
      sdk.current = undefined;
    };
  }, []);
  useEffect(() => {
    if (target.current) sdk.current?.mount(target.current, configuration);
  }, [configuration]);
  return <div ref={target} data-testid="partner-preview" />;
}

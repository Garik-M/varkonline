import { createContext, useContext, useMemo } from "react";
import { translate, type MessageKey, type WidgetLanguage } from "./messages";
import { money, number } from "./format";

export const WidgetLanguageContext = createContext<WidgetLanguage>("hy");

export function useWidgetText() {
  const language = useContext(WidgetLanguageContext);
  return useMemo(
    () => ({
      language,
      t: (key: MessageKey, values?: Record<string, string | number>) =>
        translate(language, key, values),
      money: (value: number, currency: "AMD" | "USD" = "AMD") =>
        money(value, currency, language),
      number: (value: number) => number(value, language),
    }),
    [language],
  );
}

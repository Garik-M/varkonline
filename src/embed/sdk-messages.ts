export type WidgetLanguage = "hy" | "en" | "ru";
export function widgetLanguage(value?: string | null): WidgetLanguage {
  const base = value?.toLowerCase().split(/[-_]/)[0];
  return base === "en" || base === "ru" ? base : "hy";
}

export const sdkMessages = {
  loading: {
    hy: "Ֆինանսավորման հաշվիչը բեռնվում է…",
    en: "Loading financing calculator…",
    ru: "Загрузка калькулятора…",
  },
  configurationError: {
    hy: "Ֆինանսավորման հաշվիչի տվյալները սխալ են։ Ստուգեք ինտեգրման կարգավորումները։",
    en: "Invalid calculator configuration. Check the integration settings.",
    ru: "Некорректные настройки калькулятора. Проверьте интеграцию.",
  },
  iframeTitle: {
    hy: "Varkonline — բնակարանի ֆինանսավորման հաշվիչ",
    en: "Varkonline — apartment financing calculator",
    ru: "Varkonline — калькулятор финансирования квартиры",
  },
  timeout: {
    hy: "Չհաջողվեց բեռնել հաշվիչը։ Ստուգեք կապը և թույլատրված կայքի հասցեն։",
    en: "Could not load the calculator. Check your connection and approved website address.",
    ru: "Не удалось загрузить калькулятор. Проверьте соединение и разрешённый адрес сайта.",
  },
  unavailableShort: {
    hy: "Հաշվիչը ժամանակավորապես հասանելի չէ։",
    en: "The calculator is temporarily unavailable.",
    ru: "Калькулятор временно недоступен.",
  },
} as const;
export function sdkText(
  language: WidgetLanguage,
  key: keyof typeof sdkMessages,
): string {
  return sdkMessages[key][language];
}

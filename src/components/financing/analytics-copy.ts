export function analyticsCopy(language: "hy" | "en" | "ru") {
  const l = (hy: string, en: string, ru: string) => ({ hy, en, ru })[language];
  return {
    title: l("Վերլուծություն", "Analytics", "Аналитика"),
    subtitle: l(
      "Տեսեք՝ ինչն է հետաքրքրում ձեր կայքի այցելուներին։",
      "Understand what interests visitors on your website.",
      "Узнайте, что интересует посетителей вашего сайта.",
    ),
    today: l("Այսօր", "Today", "Сегодня"),
    week: l("Վերջին 7 օրը", "Last 7 days", "Последние 7 дней"),
    month: l("Վերջին 30 օրը", "Last 30 days", "Последние 30 дней"),
    quarter: l("Վերջին 90 օրը", "Last 90 days", "Последние 90 дней"),
    period: l("Ժամանակահատված", "Analytics period", "Период аналитики"),
    refresh: l("Թարմացնել", "Refresh", "Обновить"),
    updated: l("Թարմացված է", "Updated", "Обновлено"),
    sessions: l(
      "Հաշվիչի սեսիաներ",
      "Calculator sessions",
      "Сессии калькулятора",
    ),
    calculations: l("Հաշվարկներ", "Estimates", "Расчёты"),
    refunds: l(
      "Հետվերադարձը հաշվարկած",
      "Calculated refund",
      "Рассчитали возврат",
    ),
    downloads: l("Excel ներբեռնումներ", "Excel downloads", "Скачивания Excel"),
    refundRate: l(
      "Հետվերադարձի նկատմամբ հետաքրքրություն",
      "Refund interest",
      "Интерес к возврату",
    ),
    refundRateHelp: l(
      "Հետվերադարձը հաշվարկած սեսիաների մասնաբաժինը։",
      "Share of recorded sessions that calculated a refund.",
      "Доля сессий, в которых рассчитали возврат.",
    ),
    activity: l("Օրական ակտիվություն", "Daily activity", "Активность по дням"),
    activityHelp: l(
      "Համեմատեք սեսիաներն ու հաշվարկները ընտրված ժամանակահատվածում։",
      "Compare calculator sessions and estimates over the selected period.",
      "Сравните сессии и расчёты за выбранный период.",
    ),
    ranges: l(
      "Ամենապահանջված գնային միջակայքերը",
      "Most popular price ranges",
      "Популярные ценовые диапазоны",
    ),
    rangeHelp: l(
      "Բնակարանի արժեքը՝ 5 մլն դրամ քայլով։ Վերին սահմանը ներառված չէ․ 25 մլն-ը պատկանում է 25–30 մլն-ին։",
      "Apartment prices in 5m AMD bands. Upper bounds are excluded: 25m belongs to 25–30m.",
      "Стоимость квартир с шагом 5 млн AMD. Верхняя граница не включена: 25 млн относится к 25–30 млн.",
    ),
    range: l("Գնային միջակայք, AMD", "Price range, AMD", "Диапазон цен, AMD"),
    million: l("մլն", "m", "млн"),
    rangeTable: l(
      "Տեսնել բոլոր միջակայքերը",
      "View price range details",
      "Показать диапазоны",
    ),
    otherRanges: l(
      "Մյուս միջակայքերի հաշվարկներ",
      "Estimates in other ranges",
      "Расчёты в других диапазонах",
    ),
    rangeLimit: l(
      "Առավելագույնը՝ 50 ամենապահանջված միջակայքը։",
      "Up to the 50 most popular ranges.",
      "До 50 самых популярных диапазонов.",
    ),
    noRanges: l(
      "Դրամով գնային միջակայքերի տվյալներ դեռ չկան։",
      "No AMD price-range data yet.",
      "Пока нет данных о диапазонах в AMD.",
    ),
    usd: l(
      "USD հաշվարկները դրամի միջակայքերում չեն ներառվում։",
      "USD estimates are excluded from AMD price ranges.",
      "Расчёты в USD не входят в диапазоны AMD.",
    ),
    legacy: l(
      "Հին հաշվարկների համար գնային միջակայք չի պահպանվել։",
      "Older estimates without price context remain unclassified.",
      "Старые расчёты без ценового контекста не классифицированы.",
    ),
    apartments: l(
      "Ամենադիտված բնակարանները",
      "Top apartments",
      "Популярные квартиры",
    ),
    allApartments: l(
      "Տեսնել բոլոր բնակարանները",
      "View all apartments",
      "Показать все квартиры",
    ),
    showLess: l("Ցույց տալ քիչ", "Show less", "Показать меньше"),
    apartment: l("Բնակարանի ID", "Apartment ID", "ID квартиры"),
    date: l("Օր", "Date", "Дата"),
    details: l("Օրական տվյալները", "Daily data", "Данные по дням"),
    actions: l(
      "Գործողություններ և լեզուներ",
      "Actions and languages",
      "Действия и языки",
    ),
    empty: l(
      "Տվյալները կհայտնվեն առաջին այցելություններից հետո։",
      "Your first visits will bring this dashboard to life.",
      "Данные появятся после первых посещений.",
    ),
    emptyHelp: l(
      "Տեղադրեք հաշվիչը ձեր կայքում։ Նախադիտումները չեն հաշվառվում։",
      "Install the widget on your website. Previews are excluded.",
      "Установите виджет на сайте. Предпросмотры не учитываются.",
    ),
    loading: l("Բեռնվում է…", "Loading…", "Загрузка…"),
    error: l(
      "Չհաջողվեց բեռնել վերլուծությունը։ Փորձեք թարմացնել։",
      "Unable to load analytics. Try refreshing.",
      "Не удалось загрузить аналитику. Обновите.",
    ),
    counting: l(
      "Սեսիան անանուն այցելություն է, ոչ եզակի անձ։ Սկզբնական հաջող հաշվարկը և 0.8 վրկ կայունացած փոփոխությունները հաշվվում են առանձին։ Օրերը՝ Երևանի ժամով, ներառյալ այսօր։",
      "Sessions are anonymous calculator visits, not unique people. The initial successful estimate and edits settled for 0.8 seconds count separately. Periods use Yerevan calendar days, including today.",
      "Сессии — анонимные посещения калькулятора, не уникальные люди. Начальный расчёт и изменения, не менявшиеся 0,8 секунды, считаются отдельно. Периоды — календарные дни Еревана, включая сегодня.",
    ),
    privacy: l(
      "Միայն ձեր ինտեգրման տվյալները։ Աշխատավարձերը և ճշգրիտ մուտքագրված գումարները չեն պահպանվում։ Պահպանում՝ 90 օր։ Գաղտնիության կարգավորումները կարող են սահմանափակել հաշվառումը։",
      "Only your integration’s data. Salaries and exact entered amounts are not stored. Retained for 90 days. Privacy settings and blockers can reduce coverage.",
      "Только данные вашей интеграции. Зарплаты и точные введённые суммы не сохраняются. Хранение 90 дней. Настройки приватности и блокировщики могут снижать охват.",
    ),
    names: {
      widget_view: l("Վիջեթի բացում", "Widget loaded", "Загрузка виджета"),
      calculation_completed: l(
        "Հաշվարկ",
        "Estimate completed",
        "Расчёт выполнен",
      ),
      schedule_downloaded: l(
        "Excel ներբեռնում",
        "Excel downloaded",
        "Excel скачан",
      ),
      field_changed: l(
        "Դաշտի փոփոխություն",
        "Field interaction",
        "Изменение поля",
      ),
      refund_calculated: l(
        "Հետվերադարձի հաշվարկ",
        "Refund calculated",
        "Расчёт возврата",
      ),
      schedule_opened: l(
        "Գրաֆիկի բացում",
        "Schedule opened",
        "Открытие графика",
      ),
      schedule_closed: l(
        "Գրաֆիկի փակում",
        "Schedule closed",
        "Закрытие графика",
      ),
      schedule_page: l(
        "Գրաֆիկի դիտում",
        "Schedule navigation",
        "Просмотр графика",
      ),
      language_changed: l(
        "Լեզվի փոփոխություն",
        "Language changed",
        "Смена языка",
      ),
      repayment_changed: l(
        "Մարման տարբերակի փոփոխություն",
        "Repayment changed",
        "Смена погашения",
      ),
      co_borrower_toggled: l(
        "Համավարկառուի ընտրություն",
        "Co-borrower toggled",
        "Выбор созаёмщика",
      ),
      refund_details_opened: l(
        "Հետվերադարձի մանրամասներ",
        "Refund notes opened",
        "Условия возврата",
      ),
      down_payment: l("Կանխավճար", "Down payment", "Первоначальный взнос"),
      duration: l("Ժամկետ", "Term", "Срок"),
      interest_rate: l("Տոկոսադրույք", "Interest rate", "Ставка"),
      net_salary: l("Աշխատավարձի դաշտ", "Salary field", "Поле зарплаты"),
      co_net_salary: l(
        "Համավարկառուի աշխատավարձի դաշտ",
        "Co-borrower salary field",
        "Поле зарплаты созаёмщика",
      ),
    } as Record<string, string>,
  };
}

export type PartnerLanguage = "hy" | "en" | "ru";
const en = {
  title: "Financing partner workspace",
  subtitle:
    "Manage your calculator and get the integration code for your website.",
  signOut: "Sign out",
  loading: "Loading workspace…",
  signIn: "Sign in",
  activateTitle: "Activate your partner account",
  email: "Email",
  password: "Password",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  passwordMismatch: "Passwords do not match.",
  passwordHint:
    "Use at least 12 characters (up to 72 UTF-8 bytes). Keep this password private.",
  existingPassword:
    "This email already has an account. Enter its current password to link your approved company.",
  activate: "Activate account",
  working: "Please wait…",
  accessHelp:
    "Use the private invitation supplied by Varkonline after approval. For a replacement invitation or account recovery, contact",
  apply: "Apply to become a financing partner",
  invalidInvite:
    "If your invitation was replaced or already used, sign in below or ask Varkonline for a new invitation.",
  company: "Company",
  settings: "Calculator settings",
  refundTitle: "Income-tax refund",
  refundEnable: "Show income-tax refund calculator for mortgages",
  refundHelp:
    "Visitors enter take-home salary to see the estimated refund immediately. Dates are handled automatically. Property and borrower eligibility are not checked. No legal questionnaire or document registry is required.",
  refundDisabled:
    "Income-tax refund tools are hidden. Enable them in Calculator settings and save to include them in your preview and website.",
  explicitTerms:
    "Review and save your financing defaults and visitor controls. Apartment prices and explicit overrides come from your website.",
  approvedWebsite: "Approved website",
  paused:
    "This integration has been paused by Varkonline. Contact us to reactivate it.",
  financingType: "Financing type",
  mortgage: "Mortgage",
  installment: "Interest-free developer installments",
  currency: "Currency",
  rate: "Annual nominal interest rate, %",
  optional: "optional",
  automaticRate: "Use the apartment-price rule",
  rateHelp:
    "Leave blank to use the configured price rule. A default is required when no rule applies to the selected currency. Website-specific rates can override it.",
  down: "Down payment, %",
  duration: "Duration, months",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  accent: "Accent colour",
  widgetLanguage: "Widget language",
  save: "Save settings",
  create: "Save and create integration",
  saved: "Settings saved. The code and preview use the saved configuration.",
  integration: "SDK integration code",
  instructions:
    "Enter a sample apartment price to generate code. Add the script once to your website layout and put the widget div in the shared apartment template. Replace APARTMENT_ID and the price with actual values for each apartment. The documentation explains optional rate, down payment and duration overrides.",
  samplePrice: "Sample apartment price",
  sampleApartmentId: "Sample apartment ID (optional)",
  sampleApartmentHelp:
    "Use your website’s stable apartment ID. Each apartment page supplies its own price and financing terms.",
  enterSample: "Enter a valid whole-unit apartment price to generate code.",
  copy: "Copy SDK code",
  copied: "Copied",
  copyManually:
    "Clipboard is unavailable. Select and copy the displayed code manually.",
  preview: "Open live preview",
  documentation: "Integration documentation",
  estimates:
    "Calculations are estimates, not bank offers. AMD and USD use whole units. Refunds depend on the supplied answers and stated assumptions.",
  changePassword: "Change password",
  currentPassword: "Current password",
  passwordChanged:
    "Password changed. Other partner sessions have been signed out.",
  invalidInput:
    "Check the entered values. Financing terms must be within the approved limits; passwords must contain at least 12 characters and at most 72 UTF-8 bytes.",
  networkError: "The service is unavailable. Please try again shortly.",
  invalidCredentials:
    "The email or password is incorrect, or your partner access is not active.",
  invitationUnavailable:
    "This invitation is invalid, replaced or already used. Sign in or ask Varkonline for a new invitation.",
  existingAccountPassword:
    "This email already has an account. Enter its current password to connect your approved company.",
  revisionConflict:
    "Your settings changed in another session. Reload the page before saving again.",
  websiteReview:
    "Ask Varkonline to confirm an HTTPS company website before activating your calculator.",
  companyUnavailable:
    "This company is no longer available for your account. Sign in again or contact Varkonline.",
  rateLimited: "Too many attempts. Please wait and try again later.",
};
export const messages: Record<PartnerLanguage, typeof en> = {
  en,
  hy: {
    title: "Ֆինանսավորման գործընկերոջ աշխատասենյակ",
    subtitle: "Կառավարեք ձեր հաշվիչը և ստացեք կայքում տեղադրման կոդը։",
    signOut: "Դուրս գալ",
    loading: "Աշխատասենյակը բեռնվում է…",
    signIn: "Մուտք գործել",
    activateTitle: "Ակտիվացրեք գործընկերոջ հաշիվը",
    email: "Էլ․ փոստ",
    password: "Գաղտնաբառ",
    newPassword: "Նոր գաղտնաբառ",
    confirmPassword: "Կրկնել գաղտնաբառը",
    passwordMismatch: "Գաղտնաբառերը չեն համընկնում։",
    passwordHint:
      "Օգտագործեք առնվազն 12 նիշ՝ առավելագույնը 72 UTF-8 բայթ։ Գաղտնաբառը պահեք գաղտնի։",
    existingPassword:
      "Այս էլ․ փոստով հաշիվ արդեն կա։ Հաստատված ընկերությունը կապելու համար մուտքագրեք գործող գաղտնաբառը։",
    activate: "Ակտիվացնել հաշիվը",
    working: "Խնդրում ենք սպասել…",
    accessHelp:
      "Օգտագործեք հաստատումից հետո Varkonline-ի տրամադրած անձնական հրավերը։ Հրավերի փոխարինման կամ հաշվի վերականգնման համար գրեք՝",
    apply: "Դիմել որպես ֆինանսավորման գործընկեր",
    invalidInvite:
      "Եթե հրավերը փոխարինվել է կամ արդեն օգտագործվել է, մուտք գործեք կամ Varkonline-ից նոր հրավեր խնդրեք։",
    company: "Ընկերություն",
    settings: "Հաշվիչի կարգավորումներ",
    refundTitle: "Եկամտահարկի հետվերադարձ",
    refundEnable: "Ցուցադրել հիփոթեքի եկամտահարկի հետվերադարձի հաշվիչը",
    refundHelp:
      "Այցելուն մուտքագրում է մաքուր աշխատավարձը և անմիջապես տեսնում գնահատված հետվերադարձը։ Ամսաթվերը որոշվում են ավտոմատ։ Գույքի և վարկառուի իրավունքը չի ստուգվում։ Իրավական հարցաշար կամ փաստաթղթերի գրանցամատյան պետք չէ։",
    refundDisabled:
      "Եկամտահարկի հետվերադարձի գործիքները թաքցված են։ Միացրեք դրանք հաշվիչի կարգավորումներում և պահպանեք՝ նախադիտման ու ձեր կայքի մեջ ցուցադրելու համար։",
    explicitTerms:
      "Ստուգեք և պահպանեք ֆինանսավորման պայմաններն ու այցելուի կառավարումները։ Բնակարանի գինը և բացահայտ փոփոխությունները փոխանցվում են ձեր կայքից։",
    approvedWebsite: "Հաստատված կայք",
    paused:
      "Varkonline-ը կասեցրել է այս ինտեգրումը։ Վերաակտիվացնելու համար կապ հաստատեք մեզ հետ։",
    financingType: "Ֆինանսավորման տեսակ",
    mortgage: "Հիփոթեք",
    installment: "Կառուցապատողի անտոկոս ապառիկ",
    currency: "Արժույթ",
    rate: "Տարեկան անվանական տոկոսադրույք, %",
    optional: "ըստ ցանկության",
    automaticRate: "Ըստ բնակարանի գնի կանոնի",
    rateHelp:
      "Դատարկ թողնելու դեպքում կիրառվում է գնի կանոնը։ Եթե ընտրված արժույթի համար կանոն չկա, լրացրեք տոկոսադրույքը։ Կայքի ուղարկած տոկոսադրույքը կարող է փոխարինել այն։",
    down: "Կանխավճար, %",
    duration: "Ժամկետ, ամիս",
    theme: "Թեմա",
    light: "Բաց",
    dark: "Մուգ",
    accent: "Հիմնական գույն",
    widgetLanguage: "Հաշվիչի լեզու",
    save: "Պահպանել կարգավորումները",
    create: "Պահպանել և ստեղծել ինտեգրում",
    saved:
      "Կարգավորումները պահպանվել են։ Կոդն ու նախադիտումն օգտագործում են պահպանված տվյալները։",
    integration: "SDK-ի ինտեգրման կոդ",
    instructions:
      "Կոդը ստանալու համար մուտքագրեք բնակարանի օրինակային գին։ Սկրիպտը կայքի ձևանմուշում ավելացրեք մեկ անգամ, իսկ հաշվիչի div-ը՝ բնակարանի ընդհանուր ձևանմուշում։ APARTMENT_ID-ն ու գինը փոխարինեք յուրաքանչյուր բնակարանի իրական արժեքներով։ Փաստաթղթում նկարագրված է առանձին տոկոսադրույք, կանխավճար և ժամկետ փոխանցելը։",
    samplePrice: "Բնակարանի օրինակային գին",
    sampleApartmentId: "Բնակարանի օրինակային ID (ըստ ցանկության)",
    sampleApartmentHelp:
      "Օգտագործեք ձեր կայքի բնակարանի կայուն ID-ն։ Յուրաքանչյուր էջ տրամադրում է իր գինը և ֆինանսավորման պայմանները։",
    enterSample:
      "Կոդը ստանալու համար մուտքագրեք բնակարանի վավեր ամբողջ թվով գին։",
    copy: "Պատճենել SDK-ի կոդը",
    copied: "Պատճենված է",
    copyManually:
      "Պատճենումը հասանելի չէ։ Ընտրեք և ձեռքով պատճենեք ցուցադրված կոդը։",
    preview: "Բացել կենդանի նախադիտումը",
    documentation: "Ինտեգրման փաստաթուղթ",
    estimates:
      "Հաշվարկները գնահատականներ են, ոչ թե բանկի առաջարկներ։ AMD-ն և USD-ն ամբողջ միավորներով են։ Հետվերադարձը կախված է պատասխաններից և նշված ենթադրություններից։",
    changePassword: "Փոխել գաղտնաբառը",
    currentPassword: "Գործող գաղտնաբառ",
    passwordChanged:
      "Գաղտնաբառը փոխվել է։ Այլ գործընկերային մուտքերը դադարեցվել են։",
    invalidInput:
      "Ստուգեք մուտքագրված արժեքները։ Պայմանները պետք է լինեն հաստատված սահմաններում, իսկ գաղտնաբառը՝ առնվազն 12 նիշ և առավելագույնը 72 UTF-8 բայթ։",
    networkError:
      "Ծառայությունը հասանելի չէ։ Խնդրում ենք քիչ անց կրկին փորձել։",
    invalidCredentials:
      "Էլ․ փոստը կամ գաղտնաբառը սխալ է, կամ գործընկերոջ հասանելիությունը ակտիվ չէ։",
    invitationUnavailable:
      "Այս հրավերն անվավեր է, փոխարինվել է կամ արդեն օգտագործվել է։ Մուտք գործեք կամ Varkonline-ից նոր հրավեր խնդրեք։",
    existingAccountPassword:
      "Այս էլ․ փոստով հաշիվ արդեն կա։ Մուտքագրեք դրա գործող գաղտնաբառը։",
    revisionConflict:
      "Կարգավորումները փոխվել են այլ մուտքից։ Թարմացրեք էջը՝ նախքան կրկին պահպանելը։",
    websiteReview: "Խնդրեք Varkonline-ին հաստատել ընկերության HTTPS կայքը։",
    companyUnavailable:
      "Այս ընկերությունն այլևս հասանելի չէ ձեր հաշվին։ Կրկին մուտք գործեք կամ կապ հաստատեք Varkonline-ի հետ։",
    rateLimited: "Փորձերը չափազանց շատ են։ Սպասեք և ավելի ուշ կրկին փորձեք։",
  },
  ru: {
    title: "Кабинет финансового партнёра",
    subtitle:
      "Управляйте калькулятором и получите код интеграции для вашего сайта.",
    signOut: "Выйти",
    loading: "Загрузка кабинета…",
    signIn: "Войти",
    activateTitle: "Активируйте аккаунт партнёра",
    email: "Электронная почта",
    password: "Пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Повторите пароль",
    passwordMismatch: "Пароли не совпадают.",
    passwordHint:
      "Используйте не менее 12 символов (до 72 байт UTF-8). Храните пароль в секрете.",
    existingPassword:
      "Аккаунт с этой почтой уже существует. Введите его текущий пароль для подключения одобренной компании.",
    activate: "Активировать аккаунт",
    working: "Подождите…",
    accessHelp:
      "Используйте личное приглашение от Varkonline после одобрения. Для нового приглашения или восстановления доступа напишите:",
    apply: "Стать финансовым партнёром",
    invalidInvite:
      "Если приглашение заменено или уже использовано, войдите ниже или запросите новое приглашение у Varkonline.",
    company: "Компания",
    settings: "Настройки калькулятора",
    refundTitle: "Возврат подоходного налога",
    refundEnable:
      "Показывать калькулятор возврата подоходного налога по ипотеке",
    refundHelp:
      "Посетитель вводит зарплату на руки и сразу видит оценку возврата. Даты определяются автоматически. Условия по объекту и заёмщику не проверяются. Юридическая анкета и реестр документов не нужны.",
    refundDisabled:
      "Инструменты возврата налога скрыты. Включите их в настройках калькулятора и сохраните для отображения в предпросмотре и на сайте.",
    explicitTerms:
      "Проверьте и сохраните условия и настройки для посетителей. Цены квартир и явные переопределения поступают с вашего сайта.",
    approvedWebsite: "Одобренный сайт",
    paused:
      "Varkonline приостановил эту интеграцию. Свяжитесь с нами для её активации.",
    financingType: "Тип финансирования",
    mortgage: "Ипотека",
    installment: "Беспроцентная рассрочка застройщика",
    currency: "Валюта",
    rate: "Годовая номинальная ставка, %",
    optional: "необязательно",
    automaticRate: "По правилу стоимости квартиры",
    rateHelp:
      "Оставьте пустым для правила по стоимости. Если для выбранной валюты правила нет, укажите ставку. Ставка с сайта может её переопределить.",
    down: "Первоначальный взнос, %",
    duration: "Срок, месяцев",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    accent: "Основной цвет",
    widgetLanguage: "Язык калькулятора",
    save: "Сохранить настройки",
    create: "Сохранить и создать интеграцию",
    saved:
      "Настройки сохранены. Код и предпросмотр используют сохранённые данные.",
    integration: "Код интеграции SDK",
    instructions:
      "Введите пример цены квартиры для получения кода. Добавьте скрипт один раз в макет сайта, а div калькулятора — в общий шаблон квартиры. Замените APARTMENT_ID и цену реальными значениями каждой квартиры. Документация описывает передачу отдельных ставки, взноса и срока.",
    samplePrice: "Пример цены квартиры",
    sampleApartmentId: "Пример ID квартиры (необязательно)",
    sampleApartmentHelp:
      "Используйте постоянный ID квартиры с вашего сайта. Каждая страница передаёт свою цену и условия финансирования.",
    enterSample: "Введите допустимую целую цену квартиры, чтобы получить код.",
    copy: "Скопировать код SDK",
    copied: "Скопировано",
    copyManually: "Буфер обмена недоступен. Выделите и скопируйте код вручную.",
    preview: "Открыть предпросмотр",
    documentation: "Документация интеграции",
    estimates:
      "Расчёты оценочные и не являются предложением банка. AMD и USD — в целых единицах. Возврат зависит от ответов и указанных допущений.",
    changePassword: "Изменить пароль",
    currentPassword: "Текущий пароль",
    passwordChanged: "Пароль изменён. Другие сеансы партнёра завершены.",
    invalidInput:
      "Проверьте значения. Условия должны соответствовать одобренным ограничениям; пароль — не менее 12 символов и не более 72 байт UTF-8.",
    networkError: "Сервис недоступен. Повторите попытку немного позже.",
    invalidCredentials:
      "Неверная почта или пароль, либо доступ партнёра не активен.",
    invitationUnavailable:
      "Приглашение недействительно, заменено или уже использовано. Войдите или запросите новое у Varkonline.",
    existingAccountPassword:
      "Аккаунт с этой почтой уже существует. Введите его текущий пароль.",
    revisionConflict:
      "Настройки изменены в другом сеансе. Обновите страницу перед сохранением.",
    websiteReview:
      "Попросите Varkonline подтвердить HTTPS-сайт компании перед активацией калькулятора.",
    companyUnavailable:
      "Эта компания больше недоступна вашему аккаунту. Войдите повторно или свяжитесь с Varkonline.",
    rateLimited: "Слишком много попыток. Подождите и повторите позже.",
  },
};

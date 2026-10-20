import { sdkMessages } from "./sdk-messages";
import type { WidgetLanguage } from "./sdk-messages";
export { widgetLanguage } from "./sdk-messages";
export type { WidgetLanguage } from "./sdk-messages";
export const widgetMessages = {
  refundFeatureBadge: {
    hy: "Ձեր հնարավոր խնայողությունը",
    en: "Your potential savings",
    ru: "Ваша возможная экономия",
  },
  salaryPrivateShort: {
    hy: "Աշխատավարձը չի պահպանվում կամ փոխանցվում։",
    en: "Your salary is never stored or sent.",
    ru: "Зарплата не сохраняется и не передаётся.",
  },
  netSalary: {
    hy: "Ամսական մաքուր աշխատավարձը, ֏",
    en: "Monthly take-home salary, AMD",
    ru: "Зарплата на руки в месяц, AMD",
  },
  coNetSalary: {
    hy: "Համավարկառուի մաքուր աշխատավարձը, ֏",
    en: "Co-borrower take-home salary, AMD",
    ru: "Зарплата созаёмщика на руки, AMD",
  },
  netSalaryHelp: {
    hy: "Հարկերից հետո ստացվող գումարը։",
    en: "Your salary after deductions.",
    ru: "Сумма после удержаний.",
  },
  refundPrompt: {
    hy: "Տեսեք՝ որքան կարող եք հետ ստանալ։ Մուտքագրեք մաքուր աշխատավարձը։",
    en: "See how much you could get back. Enter your take-home salary.",
    ru: "Узнайте, сколько можно вернуть. Введите зарплату на руки.",
  },
  estimatedTax: {
    hy: "Գնահատված ամսական եկամտային հարկ՝",
    en: "Estimated monthly income tax:",
    ru: "Расчётный подоходный налог в месяц:",
  },
  netPayrollAssumptions: {
    hy: "Մաքուր աշխատավարձից գնահատվում է 2026թ․ ստանդարտ մեկ գործատուի աշխատավարձը՝ 20% եկամտային հարկով, պարտադիր կուտակային, դրոշմանիշային և կիրառելի առողջության ապահովագրավճարներով։ Արտոնությունները, այլ պահումները և ապահովագրության անցումային կարգավիճակը չեն որոշվում։ Անորոշ դեպքերում ընտրվում է ավելի ցածր հարկով տարբերակը։ Ենթադրվում են կայուն եկամուտ, ամբողջությամբ վճարված հարկ, առանց սուբսիդիաների և այլ հարկային հետվերադարձների։",
    en: "Net salary is estimated using the 2026 standard single-employer model: 20% income tax, mandatory pension, stamp duty and applicable health insurance. Exemptions, other deductions and transitional insurance status cannot be inferred. Ambiguous salaries use the lower-tax match. Assumes stable income, fully paid tax, no interest subsidy or other tax refunds.",
    ru: "Используется стандартная модель 2026 года для одного работодателя: подоходный налог 20%, пенсионные, гербовый сбор и применимое медстрахование. Льготы, другие удержания и переходный страховой статус не определяются. При неоднозначности выбирается меньший налог. Доход постоянный, налог уплачен полностью, субсидий процентов и других возвратов нет.",
  },
  projectionDates: {
    hy: "Հաշվարկային տրամադրում՝ {loan}, առաջին վճարում՝ {first}։",
    en: "Assumed disbursement: {loan}; first payment: {first}.",
    ru: "Расчётная выдача: {loan}; первый платёж: {first}.",
  },
  refundAllocationShort: {
    hy: "Հետվերադարձը եռամսյակային է․ այստեղ ցույց է տրված ամսին բաժին ընկնող գնահատականը։",
    en: "Refunds are quarterly; this is the estimated allocation to this month.",
    ru: "Возврат производится поквартально; здесь показана расчётная доля месяца.",
  },
  refundAllocationNote: {
    hy: "Հետվերադարձը չի գերազանցում վճարված իրավասու տոկոսները, հասանելի եկամտային հարկը և եռամսյակային սահմանաչափը։ Ամսական բաժանումը ցուցադրական է և ճշգրիտ համընկնում է եռամսյակային ընդհանուրին։ Մայր գումարը չի վերադարձվում, բանկի պարտավորությունը չի նվազում։",
    en: "Refunds are limited by eligible interest, available salary tax and the quarterly cap. Monthly allocations are illustrative and reconcile exactly to each quarter. Principal is not refunded; the bank obligation stays unchanged.",
    ru: "Возврат ограничен допустимыми процентами, доступным подоходным налогом и квартальным лимитом. Месячные доли условны и точно сходятся с квартальным итогом. Основной долг не возмещается; обязательство перед банком не меняется.",
  },
  durationYears: { hy: "Ժամկետ, տարի", en: "Term, years", ru: "Срок, лет" },
  years: { hy: "տարի", en: "years", ru: "лет" },
  downBounds: {
    hy: "Կանխավճարը պետք է լինի {min}–{max}։",
    en: "Down payment must be {min}–{max}.",
    ru: "Первоначальный взнос: от {min} до {max}.",
  },
  downPercentHelp: {
    hy: "Բնակարանի արժեքի {percent}%",
    en: "{percent}% of the apartment price",
    ru: "{percent}% стоимости квартиры",
  },
  termBounds: {
    hy: "Ժամկետը պետք է լինի {min}–{max}։",
    en: "Term must be {min}–{max}.",
    ru: "Срок: от {min} до {max}.",
  },
  rateBounds: {
    hy: "Տոկոսադրույքը պետք է լինի {min}%–{max}%։",
    en: "Interest rate must be {min}%–{max}%.",
    ru: "Ставка: от {min}% до {max}%.",
  },
  repaymentMethod: {
    hy: "Մարման տարբերակ",
    en: "Repayment method",
    ru: "Способ погашения",
  },
  annuity: {
    hy: "Հավասար բանկային վճարումներ",
    en: "Equal bank payments (annuity)",
    ru: "Равные платежи банку (аннуитет)",
  },
  equalPrincipal: {
    hy: "Նվազող բանկային վճարումներ",
    en: "Declining bank payments",
    ru: "Убывающие платежи банку",
  },
  selectedMonthCost: {
    hy: "Ձեր ծախսը՝ {month}-րդ ամսում",
    en: "Your cost in month {month}",
    ru: "Ваши расходы в месяце {month}",
  },
  allocatedRefund: {
    hy: "Հետվերադարձի բաժինը",
    en: "Refund allocation",
    ru: "Доля возврата",
  },
  costAfterRefund: {
    hy: "Ծախսը՝ հետվերադարձով",
    en: "Cost after refund",
    ru: "Расходы с возвратом",
  },
  refundTimeline: {
    hy: "Ինչպես է փոխվում հետվերադարձը",
    en: "How the refund changes over time",
    ru: "Как меняется возврат со временем",
  },
  chooseMonth: {
    hy: "Ընտրեք հաշվարկի ամիսը",
    en: "Choose a projection month",
    ru: "Выберите месяц расчёта",
  },
  monthNumber: { hy: "Ամիս {month}", en: "Month {month}", ru: "Месяц {month}" },
  financialScenarioNotice: {
    hy: "Գնահատական՝ հետվերադարձի իրավունք ունենալու դեպքում։ Իրավունքը չի ստուգվում։ Բանկի վճարումները չեն փոխվում։",
    en: "Illustration if eligible for a refund. Eligibility is not checked. Bank payments stay unchanged.",
    ru: "Иллюстрация при наличии права на возврат. Право не проверяется. Платежи банку не меняются.",
  },
  financialScenarioAssumptions: {
    hy: "Հաշվել՝ ենթադրելով հետվերադարձի իրավունք, կայուն գրանցված աշխատավարձ, ամբողջությամբ վճարված եկամտային հարկ, առանց տոկոսների սուբսիդավորման և այլ հարկային հետվերադարձների։",
    en: "Calculate assuming refund eligibility, constant registered salary, fully paid income tax, no interest subsidy and no other tax-refund claims.",
    ru: "Рассчитать при условии права на возврат, постоянной официальной зарплаты, полностью уплаченного налога, без субсидии процентов и других заявлений на возврат налога.",
  },
  totalWithRefund: {
    hy: "Ամբողջ ժամկետի ծախսը՝ հետվերադարձով",
    en: "Full-term cost with the refund",
    ru: "Расходы за весь срок с учётом возврата",
  },
  totalBankPayment: {
    hy: "Բանկին վճարվող ամբողջ գումարը",
    en: "Total payments to the bank",
    ru: "Всего платежей банку",
  },
  totalInstallments: {
    hy: "Ապառիկի ամբողջ գումարը",
    en: "Total installment payments",
    ru: "Всего платежей по рассрочке",
  },
  bankTotalHelp: {
    hy: "Առանց կանխավճարի։",
    en: "Excludes the down payment.",
    ru: "Без первоначального взноса.",
  },
  netTotalHelp: {
    hy: "Գնահատական՝ առանց կանխավճարի։",
    en: "Estimated cost, excluding the down payment.",
    ru: "Оценка расходов без первоначального взноса.",
  },
  scenarioIntro: {
    hy: "Պատասխանեք փաստացի կամ նախատեսվող գնման համար։ Եթե չգիտեք, թողեք «Չգիտեմ»։",
    en: "Answer for your actual or planned purchase. Leave uncertain answers as Unknown.",
    ru: "Ответьте для фактической или планируемой покупки. Если не уверены, выберите «Не знаю».",
  },
  valuationZone: {
    hy: "Կադաստրային գնահատման գոտի",
    en: "Official valuation zone",
    ru: "Официальная зона оценки",
  },
  otherZones: { hy: "Այլ գոտիներ", en: "Other zones", ru: "Другие зоны" },
  scenarioAssumptions: {
    hy: "Գնահատման համար ընդունում եմ՝ գրանցված եկամուտը չի փոխվի, վարկը ՀՀ ռեզիդենտ ֆինանսական կազմակերպությունից է՝ բնակարանի համար, իսկ սեփականության, անձը հաստատող և անհրաժեշտ այլ փաստաթղթերը կբավարարեն պահանջներին (սեփական տան կառուցման դեպքում՝ նաև շինթույլտվությունը)։",
    en: "For this estimate, assume constant registered income, an Armenian resident financial lender, housing use, and that property registration, identity and required documents will meet the conditions (including a valid permit for self-build).",
    ru: "Для оценки принимаю постоянный официальный доход, кредит на жильё у финансовой организации — резидента Армении и выполнение требований к регистрации собственности, удостоверению личности и документам (включая разрешение при строительстве своего дома).",
  },
  plannedOwnerHelp: {
    hy: "Նախատեսվող գնման համար պատասխանեք՝ կդառնա՞ք սեփականատեր։ Սա փաստաթղթի ստուգում չէ։",
    en: "For a planned purchase, answer whether you will become an owner. This does not verify ownership.",
    ru: "При планируемой покупке укажите, станете ли вы собственником. Это не подтверждает право собственности.",
  },
  conditionalEstimate: {
    hy: "Պայմանական հետվերադարձի գնահատական",
    en: "Conditional refund estimate",
    ru: "Условная оценка возврата",
  },
  conditionalNotice: {
    hy: "Հաշվարկը հիմնված է ձեր պատասխանների և ենթադրությունների վրա։ Իրավունքը հաստատված չէ․ այն ստուգում է ՊԵԿ-ը։",
    en: "Based on your answers and the stated assumptions. Entitlement has not been verified; SRC makes the final decision.",
    ru: "На основе ваших ответов и указанных допущений. Право на возврат не подтверждено; окончательное решение принимает КГД.",
  },
  declaredDate: {
    hy: "Փաստացի կամ նախատեսվող տրամադրման ամսաթիվը․ ազդում է կիրառվող կանոնների վրա։",
    en: "Actual or planned loan disbursement date; determines the applicable rules.",
    ru: "Фактическая или планируемая дата выдачи кредита; определяет применимые правила.",
  },
  propertyConditions: {
    hy: "Գույքի մասին",
    en: "About the property",
    ru: "О недвижимости",
  },
  purchaseSource: {
    hy: "Գնման տարբերակ",
    en: "Purchase type",
    ru: "Вариант приобретения",
  },
  fromDeveloper: {
    hy: "Բնակարան՝ անմիջապես կառուցապատողից",
    en: "Apartment directly from a developer",
    ru: "Квартира напрямую у застройщика",
  },
  developerHouse: {
    hy: "Առանձնատուն՝ անմիջապես կառուցապատողից",
    en: "House directly from a developer",
    ru: "Дом напрямую у застройщика",
  },
  fromState: {
    hy: "Բնակարան՝ պետությունից կամ համայնքից",
    en: "Apartment from the state or community",
    ru: "Квартира у государства или общины",
  },
  selfBuild: {
    hy: "Սեփական տան կառուցում",
    en: "Building your own house",
    ru: "Строительство собственного дома",
  },
  secondaryMarket: {
    hy: "Երկրորդային շուկա",
    en: "Secondary market",
    ru: "Вторичный рынок",
  },
  assignment: {
    hy: "Իրավունքի փոխանցում ֆիզիկական անձից",
    en: "Assignment from an individual",
    ru: "Уступка права физическим лицом",
  },
  constructionRight: {
    hy: "Կառուցվող գույքի գնման իրավունք",
    en: "Right to purchase property under construction",
    ru: "Право покупки строящейся недвижимости",
  },
  propertyRegion: {
    hy: "Գույքի մարզը / քաղաքը",
    en: "Property region / city",
    ru: "Регион / город недвижимости",
  },
  oldPermit: {
    hy: "Շինթույլտվության որոշումը մինչև 2022 թվականն է՞",
    en: "Was the construction permit decision issued before 2022?",
    ru: "Решение о разрешении на строительство принято до 2022 года?",
  },
  permitDate: {
    hy: "Շինթույլտվության որոշման ամսաթիվ",
    en: "Construction permit decision date",
    ru: "Дата решения о разрешении на строительство",
  },
  borderSettlement: {
    hy: "Կառավարության հաստատած ցանկի սահմանամերձ բնակավայր է՞",
    en: "Is it a border settlement on the government exception list?",
    ru: "Это приграничный населённый пункт из утверждённого правительством списка исключений?",
  },
  contractAMD: {
    hy: "Գույքի պայմանագրային գինը՝ ՀՀ դրամով",
    en: "Contractual property price in AMD",
    ru: "Договорная стоимость недвижимости в драмах",
  },
  yerevan: { hy: "Երևան", en: "Yerevan", ru: "Ереван" },
  aragatsotn: { hy: "Արագածոտն", en: "Aragatsotn", ru: "Арагацотн" },
  ararat: { hy: "Արարատ", en: "Ararat", ru: "Арарат" },
  armavir: { hy: "Արմավիր", en: "Armavir", ru: "Армавир" },
  kotayk: { hy: "Կոտայք", en: "Kotayk", ru: "Котайк" },
  shirak: { hy: "Շիրակ", en: "Shirak", ru: "Ширак" },
  lori: { hy: "Լոռի", en: "Lori", ru: "Лори" },
  tavush: { hy: "Տավուշ", en: "Tavush", ru: "Тавуш" },
  gegharkunik: { hy: "Գեղարքունիք", en: "Gegharkunik", ru: "Гегаркуник" },
  syunik: { hy: "Սյունիք", en: "Syunik", ru: "Сюник" },
  vayots_dzor: { hy: "Վայոց ձոր", en: "Vayots Dzor", ru: "Вайоц Дзор" },
  outside_armenia: {
    hy: "Հայաստանից դուրս",
    en: "Outside Armenia",
    ru: "За пределами Армении",
  },
  monthlyBreakdown: {
    hy: "Ձեր ամսական ծախսը՝ հետվերադարձով",
    en: "Your monthly cost with the refund",
    ru: "Ваши расходы в месяц с учётом возврата",
  },
  averageRefund: {
    hy: "Միջին ամսական հետվերադարձ",
    en: "Average monthly refund",
    ru: "Средний возврат в месяц",
  },
  monthlyNetCost: {
    hy: "Միջին ամսական ծախս",
    en: "Average monthly cost",
    ru: "Средние расходы в месяц",
  },
  monthlyRoundingNote: {
    hy: "Վերջին վճարումն ու կլորացումը ազդում են միջինի վրա։",
    en: "The final payment and rounding affect the average.",
    ru: "Последний платёж и округление влияют на среднее значение.",
  },
  monthlyRefundNote: {
    hy: "Միջին ամսական գնահատական է։ Հետվերադարձը՝ եռամսյակային, բանկի վճարը չի փոխվում։",
    en: "Estimated monthly average. Refunds are quarterly; the bank payment stays unchanged.",
    ru: "Среднее за месяц — оценка. Возврат поквартальный; платёж банку не меняется.",
  },
  gross: {
    hy: "Գրանցված ամսական համախառն աշխատավարձ, ֏",
    en: "Registered gross monthly salary, ֏",
    ru: "Официальная зарплата в месяц до вычетов, ֏",
  },
  grossHelp: {
    hy: "Աշխատավարձը՝ մինչև հարկերի և այլ պահումների նվազեցումը։",
    en: "Salary before tax and other deductions.",
    ru: "Зарплата до налогов и других удержаний.",
  },
  grossExample: {
    hy: "Օրինակ՝ 500000",
    en: "Example: 500000",
    ru: "Например: 500000",
  },
  withheld: {
    hy: "Փաստացի պահված եկամտային հարկ, ֏",
    en: "Actual income tax withheld, ֏",
    ru: "Фактически удержанный подоходный налог, ֏",
  },
  withheldHelp: {
    hy: "Ըստ ցանկության․ հատուկ հարկային ռեժիմի դեպքում լրացրեք",
    en: "Optional; enter for a special tax regime.",
    ru: "Необязательно; укажите при особом налоговом режиме.",
  },
  withheldPlaceholder: {
    hy: "Դատարկ՝ օրենքի ստանդարտ դրույք",
    en: "Leave blank for the standard tax rate",
    ru: "Пусто — стандартная ставка налога",
  },
  unknown: {
    hy: "Չգիտեմ / չի ստուգվել",
    en: "Unknown / not checked",
    ru: "Не знаю / не проверено",
  },
  yes: {
    hy: "Այո",
    en: "Yes",
    ru: "Да",
  },
  no: {
    hy: "Ոչ",
    en: "No",
    ru: "Нет",
  },
  employee: {
    hy: "Աշխատանքային պայմանագրով աշխատո՞ւմ եք",
    en: "Are you employed under an employment contract?",
    ru: "Вы работаете по трудовому договору?",
  },
  owner: {
    hy: "Գույքի սեփականատե՞ր կամ համասեփականատեր եք",
    en: "Are you an owner or co-owner of the property?",
    ru: "Вы собственник или совладелец недвижимости?",
  },
  ownerHelp: {
    hy: "Եթե գնումը դեռ նախատեսվում է կամ գրանցված է կառուցվող գույքը գնելու իրավունք, ընտրեք «Չգիտեմ / չի ստուգվել»․ այդ դեպքը պահանջում է առանձին ստուգում։",
    en: "For a planned purchase or a registered right to buy property under construction, choose “Unknown / not checked”; a separate review is needed.",
    ru: "Если покупка планируется или зарегистрировано право покупки строящейся недвижимости, выберите «Не знаю / не проверено»: нужна отдельная проверка.",
  },
  identity: {
    hy: "Պահանջվող անձը հաստատող / կացության փաստաթուղթ ունե՞ք",
    en: "Do you have the required identity / residence document?",
    ru: "Есть ли необходимый документ, удостоверяющий личность / право проживания?",
  },
  prior: {
    hy: "Նախկինում օգտվե՞լ եք այս հետվերադարձից",
    en: "Have you used this refund before?",
    ru: "Вы ранее получали этот возврат?",
  },
  priorSame: {
    hy: "Միայն այս հիփոթեքի համար",
    en: "Only for this mortgage",
    ru: "Только по этой ипотеке",
  },
  priorOther: {
    hy: "Մեկ այլ՝ 2018-ից հետո հիփոթեքի համար",
    en: "For another mortgage issued after 2018",
    ru: "По другой ипотеке, выданной после 2018 года",
  },
  priorLegacy: {
    hy: "Միայն մինչև 2018թ․ հիփոթեքի համար",
    en: "Only for a mortgage issued before 2018",
    ru: "Только по ипотеке, выданной до 2018 года",
  },
  tuition: {
    hy: "Նույն եռամսյակում ուսման վճարի հարկային հետվերադարձ կա՞",
    en: "Do you claim a tuition tax refund in the same quarter?",
    ru: "Есть ли возврат налога за обучение в том же квартале?",
  },
  allocation: {
    hy: "Այլ պահանջների համար օգտագործված ամսական հարկ, ֏",
    en: "Monthly tax allocated to other claims, ֏",
    ru: "Налог в месяц, использованный по другим требованиям, ֏",
  },
  zeroPlaceholder: {
    hy: "Չկա՝ մուտքագրեք 0",
    en: "Enter 0 if none",
    ru: "Если нет, введите 0",
  },
  settlement: {
    hy: "Գործատուի եկամտային հարկի վճարում",
    en: "Employer's income tax payment",
    ru: "Уплата подоходного налога работодателем",
  },
  projectedSettlement: {
    hy: "Կանխատեսում՝ ենթադրում եմ ամբողջական վճարում",
    en: "Forecast: I assume full payment",
    ru: "Прогноз: предполагаю полную уплату",
  },
  unpaidSettlement: {
    hy: "Չի վճարվել ամբողջությամբ",
    en: "Not paid in full",
    ru: "Уплачен не полностью",
  },
  documentsChecked: {
    hy: "Աշխատանքի, սեփականության, անձնական փաստաթղթերի և նախկին օգտվելու իմ պատասխանները ստուգել եմ փաստաթղթերով։",
    en: "I checked my employment, ownership, identity and prior-benefit answers against documents.",
    ru: "Я сверил(а) ответы о работе, собственности, личных документах и прошлых возвратах с документами.",
  },
  financialError: {
    hy: "Ստուգեք ամսաթվերը, աշխատավարձը և պահված հարկը։ Առաջին վճարումը պետք է լինի վարկի տրամադրման կամ հաջորդ ամսում, պահված հարկը՝ աշխատավարձից ոչ մեծ, այլ պահանջների հարկը՝ ընտրված հարկից ոչ մեծ։",
    en: "Check dates, salary and withheld tax. The first payment must fall in the loan's origination month or the next month. Withheld tax cannot exceed salary, and other allocations cannot exceed the selected tax.",
    ru: "Проверьте даты, зарплату и удержанный налог. Первый платёж должен быть в месяце выдачи кредита или следующем. Налог не может превышать зарплату, а другие требования — выбранный налог.",
  },
  inputError: {
    hy: "Ստուգեք մուտքագրված տվյալները։",
    en: "Check your entries.",
    ru: "Проверьте введённые данные.",
  },
  historicalTaxError: {
    hy: "Ընտրված ժամանակահատվածի համար մուտքագրեք փաստացի պահված եկամտային հարկը․ ստանդարտ դրույքը հաստատված չէ։",
    en: "Enter the actual tax withheld for this period; its standard rate is not confirmed.",
    ru: "Укажите фактически удержанный налог за этот период: стандартная ставка не подтверждена.",
  },
  propertyError: {
    hy: "Գույքի և վարկի տվյալները նախ պետք է ստուգվեն։",
    en: "Property and loan details must be reviewed first.",
    ru: "Сначала нужно проверить данные недвижимости и кредита.",
  },
  assumptionsError: {
    hy: "Հաստատեք կանխատեսման ենթադրությունները։ Սուբսիդավորված կամ փոփոխվող աշխատավարձով դեպքը պահանջում է անհատական հաշվարկ։",
    en: "Confirm the forecast assumptions. Subsidized interest or varying salary requires an individual calculation.",
    ru: "Подтвердите допущения прогноза. При субсидировании процентов или изменении зарплаты нужен индивидуальный расчёт.",
  },
  ineligible: {
    hy: "Հետվերադարձը կիրառելի չէ ըստ տրամադրված տվյալների",
    en: "Refund unavailable based on the supplied information",
    ru: "По предоставленным данным возврат неприменим",
  },
  verification: {
    hy: "Անհրաժեշտ է տվյալների լրացուցիչ ստուգում",
    en: "Further verification is required",
    ru: "Нужна дополнительная проверка",
  },
  bankPaymentPrefix: {
    hy: "Բանկի ամսական վճարը՝",
    en: "Monthly bank payment:",
    ru: "Ежемесячный платёж банку:",
  },
  period: {
    hy: "։",
    en: ".",
    ru: ".",
  },
  propertyUnreviewed: {
    hy: "Վարկի և գույքի փաստաթղթերը դեռ չեն ստուգվել։",
    en: "Loan and property documents have not been reviewed yet.",
    ru: "Документы кредита и недвижимости ещё не проверены.",
  },
  unresolvedNotice: {
    hy: "Հետվերադարձի գումար չի ենթադրվում։ Դիմեք կառուցապատողին կամ ՊԵԿ-ին փաստաթղթերի ստուգման համար։ Արդյունավետ ամսական ծախս՝",
    en: "No refund amount is assumed. Ask the developer or Armenia's State Revenue Committee to review the documents. Effective monthly cost:",
    ru: "Сумма возврата не предполагается. Обратитесь к застройщику или в КГД Армении для проверки документов. Эффективные расходы в месяц:",
  },
  unresolved: {
    hy: "Չորոշված",
    en: "Not determined",
    ru: "Не определено",
  },
  salaryOnlyNotice: {
    hy: "։ Այստեղ կարող եք առանձին գնահատել ձեր եկամտային հարկը։",
    en: ". You can estimate salary income tax separately here.",
    ru: ". Здесь можно отдельно оценить подоходный налог с зарплаты.",
  },
  refundTitle: {
    hy: "Եկամտահարկի հետվերադարձ",
    en: "Income tax refund",
    ru: "Возврат подоходного налога",
  },
  refundEyebrow: {
    hy: "ԵԿԱՄՏԱՀԱՐԿԻ ՀԵՏՎԵՐԱԴԱՐՁ",
    en: "INCOME TAX REFUND",
    ru: "ВОЗВРАТ ПОДОХОДНОГО НАЛОГА",
  },
  refundHeading: {
    hy: "Գնահատեք հետվերադարձի հնարավորությունը",
    en: "Estimate your potential refund",
    ru: "Оцените возможный возврат",
  },
  privacy: {
    hy: "Աշխատավարձը չի պահպանվում և չի փոխանցվում գործընկերոջը։ Հետվերադարձը կատարվում է առանձին՝ եռամսյակային կարգով, ՊԵԿ-ի հաստատման դեպքում։",
    en: "Salary stays in this calculator. Refunds are paid separately each quarter, subject to SRC approval.",
    ru: "Зарплата остаётся в калькуляторе. Возврат выплачивается отдельно поквартально при одобрении КГД.",
  },
  usdWarning: {
    hy: "USD հիփոթեքի համար անհրաժեշտ են բանկի տրամադրած դրամային վճարներն ու տոկոսները յուրաքանչյուր ամսվա համար։ Այստեղ փոխարժեք չի ենթադրվում․ հետվերադարձի գումարը կմնա չորոշված։",
    en: "A USD mortgage requires the bank's AMD payments and interest for each month. No exchange rate is assumed here; the refund stays unresolved.",
    ru: "Для ипотеки в USD нужны данные банка о платежах и процентах в AMD за каждый месяц. Курс здесь не предполагается; возврат останется неопределённым.",
  },
  refundSteps: {
    hy: "Հետվերադարձի հաշվարկի քայլեր",
    en: "Refund calculation steps",
    ru: "Шаги расчёта возврата",
  },
  stepIncome: {
    hy: "1. Աշխատավարձ և վճարումներ",
    en: "1. Salary and payments",
    ru: "1. Зарплата и платежи",
  },
  stepEligibility: {
    hy: "2. Հետվերադարձի պայմաններ",
    en: "2. Refund conditions",
    ru: "2. Условия возврата",
  },
  incomeHeading: {
    hy: "Աշխատավարձ և վճարումներ",
    en: "Salary and payments",
    ru: "Зарплата и платежи",
  },
  incomeIntro: {
    hy: "Մուտքագրեք աշխատավարձը՝ ամսական եկամտային հարկը գնահատելու համար։ Հետվերադարձի պայմանները կստուգվեն հաջորդ քայլում։",
    en: "Enter salary to estimate monthly income tax. Refund conditions are checked next.",
    ru: "Введите зарплату для оценки налога в месяц. Условия возврата проверяются далее.",
  },
  firstPayment: {
    hy: "Առաջին ամսական վճարման ամսաթիվ",
    en: "First monthly payment date",
    ru: "Дата первого ежемесячного платежа",
  },
  firstPaymentHelp: {
    hy: "Կանխատեսման համար ընտրեք պլանավորվող առաջին վճարման օրը։ Այն չի հաստատում վարկի տրամադրման ամսաթիվը։",
    en: "Use the planned first payment date. This does not confirm when the loan was issued.",
    ru: "Укажите планируемую дату первого платежа. Это не подтверждает дату выдачи кредита.",
  },
  borrowerSalary: {
    hy: "Վարկառուի աշխատավարձը",
    en: "Borrower's salary",
    ru: "Зарплата заёмщика",
  },
  includeCo: {
    hy: "Ներառել մեկ համավարկառուի եկամուտը",
    en: "Include one co-borrower's income",
    ru: "Добавить доход одного созаёмщика",
  },
  coSalary: {
    hy: "Համավարկառուի աշխատավարձը",
    en: "Co-borrower's salary",
    ru: "Зарплата созаёмщика",
  },
  continue: {
    hy: "Շարունակել՝ ստուգել պայմանները",
    en: "Continue: check conditions",
    ru: "Продолжить: проверить условия",
  },
  conditionsHeading: {
    hy: "Հետվերադարձի պայմաններ",
    en: "Refund conditions",
    ru: "Условия возврата",
  },
  conditionsIntro: {
    hy: "Պատասխանեք ըստ հաստատված տվյալների։ Չստուգված պայմանների համար ընտրեք «Չգիտեմ / չի ստուգվել»։ Սա կանխատեսում է, ոչ ՊԵԿ-ին ներկայացվող դիմում։",
    en: "Use confirmed information; otherwise choose “Unknown / not checked”. This is a forecast, not an SRC application.",
    ru: "Указывайте подтверждённые данные, иначе выберите «Не знаю / не проверено». Это прогноз, а не заявление в КГД.",
  },
  loanDate: {
    hy: "Հիփոթեքի տրամադրման ամսաթիվ",
    en: "Mortgage origination date",
    ru: "Дата выдачи ипотеки",
  },
  verifiedDate: {
    hy: "Փաստաթղթով ստուգված ամսաթիվ",
    en: "Date checked against documents",
    ru: "Дата сверена с документами",
  },
  unverifiedDate: {
    hy: "Չստուգված ամսաթիվը կպահանջի հաստատում",
    en: "An unverified date needs confirmation",
    ru: "Непроверенную дату нужно подтвердить",
  },
  borrowerConditions: {
    hy: "Վարկառուի պայմանները",
    en: "Borrower's conditions",
    ru: "Условия заёмщика",
  },
  coConditions: {
    hy: "Համավարկառուի պայմանները",
    en: "Co-borrower's conditions",
    ru: "Условия созаёмщика",
  },
  noSubsidy: {
    hy: "Տոկոսների սուբսիդավորում չկա․ բոլոր վճարների համար այն 0 է։",
    en: "There is no interest subsidy for any payment.",
    ru: "Субсидия процентов отсутствует по всем платежам.",
  },
  constantForecast: {
    hy: "Սա կանխատեսում է․ նշված ամսական աշխատավարձը, հարկն ու պատասխանները հաստատուն են ամբողջ ժամանակահատվածում, ներառյալ առաջին և վերջին ամբողջ օրացուցային եռամսյակները։ Վճարման օրը կրկնվում է ամսական՝ ամսավերջին սահմանափակմամբ։",
    en: "This forecast holds monthly salary, tax and answers constant for the entire period, including the full first and last calendar quarters. Payments repeat on the same day each month, clamped to month-end.",
    ru: "В прогнозе зарплата, налог и ответы неизменны весь период, включая полные первый и последний календарные кварталы. День платежа повторяется ежемесячно с ограничением концом месяца.",
  },
  back: {
    hy: "Նախորդ քայլ",
    en: "Previous step",
    ru: "Назад",
  },
  calculateRefund: {
    hy: "Հաշվել հետվերադարձի կանխատեսումը",
    en: "Estimate refund",
    ru: "Рассчитать возврат",
  },
  inputErrorPrefix: {
    hy: "Մուտքային տվյալների սխալ․",
    en: "Input error:",
    ru: "Ошибка ввода:",
  },
  combinedTax: {
    hy: "Երկու անձանց ամսական եկամտային հարկ՝",
    en: "Combined monthly income tax:",
    ru: "Подоходный налог двух лиц в месяц:",
  },
  selectedTax: {
    hy: "Ընտրված ամսական եկամտային հարկ՝",
    en: "Selected monthly income tax:",
    ru: "Выбранный подоходный налог в месяц:",
  },
  eligible: {
    hy: "Պայմանները բավարարված են ըստ տրամադրված տվյալների",
    en: "Conditions met based on the supplied information",
    ru: "По предоставленным данным условия выполнены",
  },
  projectionUnresolved: {
    hy: "Հետվերադարձի և արդյունավետ ծախսի գումար չի ենթադրվում։ Գույքի, վարկի կամ ձեր փաստաթղթերի ստուգումը դեռ ավարտված չէ։ Դիմեք կառուցապատողին կամ ՊԵԿ-ին։",
    en: "Refund and effective cost are unresolved. Review of property, loan or personal documents is incomplete. Contact the developer or SRC.",
    ru: "Возврат и эффективные расходы не определены. Проверка недвижимости, кредита или личных документов не завершена. Обратитесь к застройщику или в КГД.",
  },
  bankPayment: {
    hy: "Բանկի ամսական վճար",
    en: "Monthly bank payment",
    ru: "Ежемесячный платёж банку",
  },
  effectiveCost: {
    hy: "Հետվերադարձից հետո միջին ամսական ծախս",
    en: "Average monthly cost after refund",
    ru: "Средние расходы в месяц после возврата",
  },
  effectiveHelp: {
    hy: "Միջին ծախսը տեղեկատվական համարժեք է․ այն չի փոխում բանկին վճարվող գումարը և չի ներառում կանխավճարը։ Հետվերադարձը երաշխավորված չէ։",
    en: "The monthly average does not change bank payments and excludes the down payment. Refunds are not guaranteed.",
    ru: "Среднее значение не меняет платёж банку и не включает первый взнос. Возврат не гарантирован.",
  },
  quarterSchedule: {
    hy: "Եռամսյակային հետվերադարձի գրաֆիկ",
    en: "Quarterly refund schedule",
    ru: "Поквартальный график возврата",
  },
  quarterSuffix: {
    hy: "-րդ եռամսյակ",
    en: " quarter",
    ru: " квартал",
  },
  needsReview: {
    hy: "Ստուգում է պահանջվում",
    en: "Verification required",
    ru: "Требуется проверка",
  },
  interestPrefix: {
    hy: "Տոկոս՝",
    en: "Interest:",
    ru: "Проценты:",
  },
  taxPrefix: {
    hy: "· Հարկ՝",
    en: "· Tax:",
    ru: "· Налог:",
  },
  capPrefix: {
    hy: "· Սահմանաչափ՝",
    en: "· Cap:",
    ru: "· Лимит:",
  },
  previous: {
    hy: "Նախորդ",
    en: "Previous",
    ru: "Назад",
  },
  next: {
    hy: "Հաջորդ",
    en: "Next",
    ru: "Далее",
  },
  totalRefund: {
    hy: "Ընդհանուր կանխատեսված հետվերադարձ՝",
    en: "Total estimated refund",
    ru: "Общий прогноз возврата",
  },
  ruleVersion: {
    hy: "Իրավական տարբերակ՝",
    en: "Rule version:",
    ru: "Версия правил:",
  },
  futureChanges: {
    hy: "։ Ապագա օրենքների, եկամուտների և տոկոսների փոփոխություններ չեն կանխատեսվում։",
    en: ". Future changes in law, income and interest are not forecast.",
    ru: ". Будущие изменения закона, дохода и процентов не прогнозируются.",
  },
  taxCode: {
    hy: "ՀՀ հարկային օրենսգիրք, հոդված 160",
    en: "Armenian Tax Code, Article 160",
    ru: "Налоговый кодекс Армении, статья 160",
  },
  boundsError: {
    hy: "Ընտրեք գործընկերոջ թույլատրած կանխավճարն ու ժամկետը։",
    en: "Choose a down payment and term allowed by this partner.",
    ru: "Выберите первый взнос и срок, разрешённые партнёром.",
  },
  mortgage: {
    hy: "Հիփոթեքային ֆինանսավորում",
    en: "Mortgage calculator",
    ru: "Ипотечный калькулятор",
  },
  installment: {
    hy: "Կառուցապատողի ապառիկ",
    en: "Developer installment plan",
    ru: "Рассрочка застройщика",
  },
  price: {
    hy: "Բնակարանի արժեք",
    en: "Apartment price",
    ru: "Стоимость квартиры",
  },
  down: {
    hy: "Կանխավճար, %",
    en: "Down payment, %",
    ru: "Первый взнос, %",
  },
  allowed: {
    hy: "Թույլատրելի՝",
    en: "Allowed:",
    ru: "Допустимо:",
  },
  duration: {
    hy: "Ժամկետ",
    en: "Term",
    ru: "Срок",
  },
  months: {
    hy: "ամիս",
    en: "months",
    ru: "мес.",
  },
  annualRate: {
    hy: "Տարեկան անվանական",
    en: "Annual nominal rate",
    ru: "Номинальная, год.",
  },
  interestFree: {
    hy: "Անտոկոս ապառիկ",
    en: "Interest-free installments",
    ru: "Беспроцентная рассрочка",
  },
  fullDown: {
    hy: "Ամբողջական կանխավճար․ ֆինանսավորվող մնացորդ չկա։",
    en: "Paid in full: no financing balance.",
    ru: "Полная оплата: остатка для финансирования нет.",
  },
  roundingNote: {
    hy: "Վճարումը հաշվարկված է ամբողջ միավորով։ Վերջին վճարումը կարող է տարբերվել։",
    en: "Payments use whole currency units. The final payment may differ.",
    ru: "Платежи в целых единицах валюты. Последний платёж может отличаться.",
  },
  closeRefund: {
    hy: "Փակել հետվերադարձի հաշվարկը",
    en: "Close refund calculator",
    ru: "Закрыть расчёт возврата",
  },
  openRefund: {
    hy: "Հաշվել եկամտահարկի հետվերադարձով",
    en: "Calculate with income tax refund",
    ru: "Рассчитать с возвратом налога",
  },
  downAmount: {
    hy: "Կանխավճար",
    en: "Down payment",
    ru: "Первый взнос",
  },
  principal: {
    hy: "Ֆինանսավորվող գումար",
    en: "Financed amount",
    ru: "Сумма финансирования",
  },
  totalInterest: {
    hy: "Ընդհանուր տոկոսներ",
    en: "Total interest",
    ru: "Всего процентов",
  },
  totalCost: {
    hy: "Ընդհանուր արժեք՝ կանխավճարով",
    en: "Total cost including down payment",
    ru: "Общая стоимость с первым взносом",
  },
  schedule: {
    hy: "Վճարումների գրաֆիկ",
    en: "Payment schedule",
    ru: "График платежей",
  },
  noPrincipal: {
    hy: "Ֆինանսավորվող մնացորդ չկա։",
    en: "No financed balance.",
    ru: "Остатка для финансирования нет.",
  },
  month: {
    hy: "Ամիս",
    en: "Month",
    ru: "Месяц",
  },
  payment: {
    hy: "Վճար",
    en: "Payment",
    ru: "Платёж",
  },
  principalColumn: {
    hy: "Մայր գումար",
    en: "Principal",
    ru: "Основной долг",
  },
  interest: {
    hy: "Տոկոս",
    en: "Interest",
    ru: "Проценты",
  },
  balance: {
    hy: "Մնացորդ",
    en: "Balance",
    ru: "Остаток",
  },
  total: {
    hy: "Ընդամենը",
    en: "Total",
    ru: "Итого",
  },
  previousPage: {
    hy: "Գրաֆիկի նախորդ էջ",
    en: "Previous schedule page",
    ru: "Предыдущая страница графика",
  },
  previousArrow: {
    hy: "← Նախորդ",
    en: "← Previous",
    ru: "← Назад",
  },
  nextPage: {
    hy: "Գրաֆիկի հաջորդ էջ",
    en: "Next schedule page",
    ru: "Следующая страница графика",
  },
  nextArrow: {
    hy: "Հաջորդ →",
    en: "Next →",
    ru: "Далее →",
  },
  noInstallmentRefund: {
    hy: "Անտոկոս ապառիկի դեպքում հիփոթեքային տոկոսների եկամտահարկի հետվերադարձ չի հաշվարկվում։",
    en: "Interest-free installments do not qualify for mortgage-interest tax refunds.",
    ru: "Для беспроцентной рассрочки возврат налога по ипотечным процентам не рассчитывается.",
  },
  poweredBy: {
    hy: "Հաշվարկը՝",
    en: "Powered by",
    ru: "Расчёт:",
  },
  unavailableRefresh: {
    hy: "Հաշվիչը ժամանակավորապես հասանելի չէ։ Թարմացրեք էջը։",
    en: "The calculator is temporarily unavailable. Refresh the page.",
    ru: "Калькулятор временно недоступен. Обновите страницу.",
  },
  integrationOnly: {
    hy: "Հաշվիչը հասանելի է գործընկերոջ կայքի ինտեգրման միջոցով։",
    en: "Open this calculator through a partner website.",
    ru: "Откройте калькулятор на сайте партнёра.",
  },
  partnerUnavailable: {
    hy: "Գործընկերոջ հաշվիչը հասանելի չէ։",
    en: "This partner's calculator is unavailable.",
    ru: "Калькулятор этого партнёра недоступен.",
  },
  originDenied: {
    hy: "Այս կայքի համար հաշվիչը թույլատրված չէ։",
    en: "The calculator is not authorized for this website.",
    ru: "Калькулятор не разрешён для этого сайта.",
  },
  networkError: {
    hy: "Չհաջողվեց կապվել ֆինանսավորման ծառայության հետ։ Փորձեք կրկին։",
    en: "Could not reach the financing service. Try again.",
    ru: "Не удалось связаться с сервисом. Попробуйте снова.",
  },
  invalidInput: {
    hy: "Մուտքային տվյալները սխալ են։",
    en: "Invalid input data.",
    ru: "Некорректные входные данные.",
  },
  unavailable: {
    hy: "Հաշվիչը հասանելի չէ",
    en: "Calculator unavailable",
    ru: "Калькулятор недоступен",
  },
  retry: {
    hy: "Փորձել կրկին",
    en: "Try again",
    ru: "Попробовать снова",
  },
  footerTitle: {
    hy: "Varkonline · Ֆինանսավորման հաշվարկ",
    en: "Varkonline · Financing calculator",
    ru: "Varkonline · Финансовый калькулятор",
  },
  lenderField: {
    hy: "ՀՀ ռեզիդենտ ֆինանսական կազմակերպություն",
    en: "Armenian resident financial institution",
    ru: "Финансовая организация — резидент Армении",
  },
  housingField: {
    hy: "Վարկի նպատակային օգտագործում",
    en: "Use of loan for housing",
    ru: "Целевое использование кредита",
  },
  acquisitionField: {
    hy: "Գույքի ձեռքբերման տեսակ",
    en: "Property acquisition type",
    ru: "Способ приобретения недвижимости",
  },
  contractField: {
    hy: "Պայմանագրային ամբողջ գին",
    en: "Full contractual price",
    ru: "Полная договорная стоимость",
  },
  locationField: {
    hy: "Գտնվելու վայր և գնահատման գոտի",
    en: "Location and valuation zone",
    ru: "Местоположение и оценочная зона",
  },
  permitField: {
    hy: "Շինթույլտվության որոշման ամսաթիվ",
    en: "Building permit decision date",
    ru: "Дата решения о разрешении на строительство",
  },
  rightsField: {
    hy: "Գույքային իրավունքների գրանցում",
    en: "Registration of property rights",
    ru: "Регистрация прав на недвижимость",
  },
  documentsField: {
    hy: "Պահանջվող փաստաթղթեր",
    en: "Required documents",
    ru: "Необходимые документы",
  },
  loanField: {
    hy: "Վարկի տրամադրման ամսաթիվ",
    en: "Loan origination date",
    ru: "Дата выдачи кредита",
  },
  priceLimitReason: {
    hy: "Պայմանագրային գինը գերազանցում է օրենքի սահմանաչափը։",
    en: "The contract price exceeds the legal limit.",
    ru: "Договорная стоимость превышает установленный законом предел.",
  },
  priceMismatchReason: {
    hy: "Պայմանագրային և հաշվիչի գները տարբերվում են․ անհրաժեշտ է համադրել փաստաթղթերը։",
    en: "The contract and calculator prices differ; documents must be reconciled.",
    ru: "Договорная стоимость отличается от цены калькулятора; нужно сверить документы.",
  },
  locationReason: {
    hy: "Գույքի գտնվելու վայրի և վարկի ամսաթվի համար գործում է սահմանափակում։",
    en: "A restriction applies to this property location and loan date.",
    ru: "Для этого местоположения и даты кредита действует ограничение.",
  },
  amdReason: {
    hy: "Բացակայում են բանկի դրամային տվյալները։",
    en: "The bank's AMD amounts are missing.",
    ru: "Отсутствуют данные банка о суммах в AMD.",
  },
  acquisitionReason: {
    hy: "Գույքի ձեռքբերման այս տեսակը չի համապատասխանում պայմաններին։",
    en: "This acquisition type does not meet the conditions.",
    ru: "Этот способ приобретения не соответствует условиям.",
  },
  priorReason: {
    hy: "Մեկ այլ հիփոթեքի համար նախկին օգտվելը սահմանափակում է հետվերադարձը։",
    en: "Prior use for another mortgage restricts this refund.",
    ru: "Предыдущий возврат по другой ипотеке ограничивает этот возврат.",
  },
  tuitionReason: {
    hy: "Ուսման վճարի հետվերադարձը համընկնում է այս պահանջի հետ։",
    en: "A tuition refund overlaps with this claim.",
    ru: "Возврат за обучение совпадает с этим требованием.",
  },
  noParticipantReason: {
    hy: "Ներառված վարկառուների տվյալներով հետվերադարձի պայմանները չեն բավարարվում։",
    en: "None of the included borrowers meets the refund conditions.",
    ru: "Ни один из указанных заёмщиков не соответствует условиям возврата.",
  },
  employeeReason: {
    hy: "Աշխատանքային պայմանագրով աշխատելու պայմանը չի բավարարվում։",
    en: "The employment-contract condition is not met.",
    ru: "Условие работы по трудовому договору не выполнено.",
  },
  ownerReason: {
    hy: "Գույքի սեփականատեր լինելու պայմանը չի բավարարվում։",
    en: "The property-ownership condition is not met.",
    ru: "Условие владения недвижимостью не выполнено.",
  },
  unpaidReason: {
    hy: "Գործատուի հարկը ամբողջությամբ վճարված չէ։",
    en: "The employer's tax has not been paid in full.",
    ru: "Налог работодателя уплачен не полностью.",
  },
  factsField: {
    hy: "Անձնական, հարկային կամ իրավական տվյալներ",
    en: "Personal, tax or legal information",
    ru: "Личные, налоговые или правовые данные",
  },
  amountError: {
    hy: "Մուտքագրեք ամբողջ ոչ բացասական գումար՝ առավելագույնը 1 տրիլիոն դրամ։",
    en: "Enter a non-negative whole amount up to 1 trillion AMD.",
    ru: "Введите целую неотрицательную сумму до 1 триллиона AMD.",
  },
  language: {
    hy: "Լեզու",
    en: "Language",
    ru: "Язык",
  },
  monthlyPayment: {
    hy: "Ամսական վճար",
    en: "Monthly payment",
    ru: "Ежемесячный платёж",
  },
  estimate: {
    hy: "Նախնական հաշվարկ է, ոչ բանկի առաջարկ։",
    en: "Estimate only, not a bank offer.",
    ru: "Предварительный расчёт, не предложение банка.",
  },
  costNote: {
    hy: "Գումարները՝ ամբողջ AMD կամ USD միավորով։ Վճարներ, ապահովագրություն և այլ ծախսեր չեն ավելացվում։",
    en: "Amounts use whole AMD or USD units. Fees, insurance and other costs are excluded.",
    ru: "Суммы в целых AMD или USD. Комиссии, страхование и прочие расходы не включены.",
  },
  refundPeriod: {
    hy: "Ամբողջ ժամկետի համար՝ {months} ամիս։ Վճարումը՝ եռամսյակային, ոչ ամսական։",
    en: "Over the full {months}-month term. Paid quarterly, not monthly.",
    ru: "За весь срок: {months} мес. Возврат выплачивается поквартально, не ежемесячно.",
  },
  refundDetails: {
    hy: "Մանրամասներ և ենթադրություններ",
    en: "Details and assumptions",
    ru: "Подробности и допущения",
  },
  verificationRequired: {
    hy: "Պահանջվում է փաստաթղթային ստուգում։",
    en: "Documentary verification required.",
    ru: "Требуется документальная проверка.",
  },
  integrationError: {
    hy: "Ինտեգրման տվյալները հնարավոր չէ կիրառել ({code})։ Դիմեք կայքի պատասխանատուին։",
    en: "Cannot apply the integration data ({code}). Contact the website administrator.",
    ru: "Не удалось применить данные интеграции ({code}). Обратитесь к администратору сайта.",
  },
  dateError: {
    hy: "Մուտքագրեք վավեր ամսաթիվ։",
    en: "Enter a valid date.",
    ru: "Введите корректную дату.",
  },
  editRefund: {
    hy: "Փոխել աշխատավարձը կամ պայմանները",
    en: "Edit salary or conditions",
    ru: "Изменить зарплату или условия",
  },
  ...sdkMessages,
} as const;
export type MessageKey = keyof typeof widgetMessages;

export function translate(
  language: WidgetLanguage,
  key: MessageKey,
  values: Record<string, string | number> = {},
): string {
  return widgetMessages[key][language].replace(
    /\{(\w+)\}/g,
    (token, name: string) => String(values[name] ?? token),
  );
}

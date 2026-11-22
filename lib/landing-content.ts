import type { Lang } from './i18n';

/** Landing page copy in English and Kiswahili (Tanzania). Short strings live in lib/i18n.ts. */
type Item = { t: string; d: string };
type Feature = { eyebrow: string; title: string; text: string; ticks: string[] };
type Content = {
  designer: Feature; vouchers: Feature; simulator: Feature & { cta: string }; business: Feature; reportTicks: string[];
  uses: Item[]; security: Item[]; roles: [string, string][]; you: string;
  compareHead: [string, string, string, string]; compare: [string, string | boolean, string | boolean, string | boolean][];
  hardware: { title: string; text: string; code: string }[]; hardwareEyebrow: string; hardwareTitle: string;
  pricingEyebrow: string; pricingTitle: string; pricingSub: string; popular: string; month: string; free: string;
  planTicks: (pro: boolean) => string[]; selfTitle: string; selfText: string; selfTicks: string[]; selfCta: string; startFree: string;
  faq: [string, string][]; faqNote: string; footer: string; piGuide: string;
};

const en: Content = {
  designer: { eyebrow: 'WI-FI PAGE DESIGNER', title: 'A Wi-Fi page that looks like your brand.', text: 'Five templates (Modern, Classic, Bold, Minimal and Photo), your logo and colours, a headline, terms of use and English or Kiswahili. A live phone preview shows every change as you make it.', ticks: ['Loads fast on any phone, even before it is online', 'Vouchers and mobile money on one screen', 'Customers get a code to reconnect later'] },
  vouchers: { eyebrow: 'VOUCHERS', title: 'Print vouchers people want to keep.', text: 'Make up to 500 codes at a time for a specific router and package. Choose Classic, Ticket, Card or Minimal, and decide what each voucher shows. A QR code opens the Wi-Fi page with the code already filled in.', ticks: ['Time starts on first use, not when printed', 'Used codes fade on the sheet', 'Cancel a code and it is disconnected in seconds'] },
  simulator: { eyebrow: 'SIMULATOR', title: 'Try everything before you touch a router.', text: 'The simulator gives you a virtual router and a virtual phone side by side. Buy a package, redeem a voucher and watch the router let the phone online, using test payments where no money moves.', ticks: [], cta: 'Open the live demo' },
  business: { eyebrow: 'RUN YOUR BUSINESS', title: 'Know what sold, where and when.', text: "Sales by day, mobile money and vouchers, every router's status and every connected code. Packages can be sold everywhere or at one router only.", ticks: ['Search any code or phone number', 'Sales follow your own time zone', 'Self-healing routers: reboots and resets are fixed for you'] },
  reportTicks: ['Revenue, sales, average sale and paying customers against the previous period', 'Busiest hours by day, best packages and routers, top customers', 'Payment success rate, and CSV export for your accountant'],
  uses: [
    { t: 'Cafés & restaurants', d: 'Hourly and daily packages, vouchers printed at the till, and a Wi-Fi page in your brand colours.' },
    { t: 'Hostels & guest houses', d: 'Weekly and monthly plans with data caps and two devices per guest, sold at reception or by phone.' },
    { t: 'Apartments & estates', d: 'Monthly subscriptions paid by mobile money, one router per block, every block in one dashboard.' },
    { t: 'Colleges & student hostels', d: 'Cheap student bundles, fair speeds for everyone, and reports by building.' },
    { t: 'Shops & markets', d: 'Turn spare bandwidth into income with codes customers buy with M-Pesa in seconds.' },
    { t: 'Events & conferences', d: 'Day passes, a simulator to rehearse, and live numbers while the event runs.' },
  ],
  security: [
    { t: 'Encrypted secrets', d: 'Router tokens and payment keys are encrypted at rest. Each router has its own token you can replace in one click.' },
    { t: 'Payments verified twice', d: 'A payment only unlocks Wi-Fi after incnet re-checks it with the provider using your own key.' },
    { t: 'Self-healing routers', d: 'After a reboot or a reset, the router restores its users and login page on the next check-in.' },
    { t: 'Keeps working offline', d: 'Customers already online stay online until their time is up, even if the internet link drops.' },
    { t: 'Least access', d: 'Five roles, checked on the server for every page and action, with an activity log of every change.' },
    { t: 'Your data, your choice', d: 'Use our cloud, or host it yourself on Vercel, a VPS, a Raspberry Pi or shared hosting.' },
  ],
  roles: [['Owner', 'Everything, including the plan'], ['Admin', 'Routers, payments, team, settings'], ['Manager', 'Packages, vouchers, Wi-Fi page, reports'], ['Cashier', 'Prints vouchers, looks up codes'], ['Viewer', 'Sales and reports, read-only']],
  you: 'You',
  compareHead: ['', 'Printed vouchers only', 'Classic billing panel', 'incnet'],
  compare: [
    ['Router setup', 'By hand', 'VPN, firewall and API by hand', 'One paste or one command'],
    ['Mobile money', false, 'Add-on', true],
    ['Works behind any ISP, no public IP', true, false, true],
    ['Raspberry Pi and OpenWrt', false, false, true],
    ['Team roles and activity log', false, 'Partly', true],
    ['Reports, filters and CSV', false, 'Basic', true],
    ['Wi-Fi page and voucher designers', false, false, true],
    ['English and Kiswahili', false, false, true],
    ['Open source, host anywhere', '—', 'Partly', true],
  ],
  hardwareEyebrow: 'HARDWARE', hardwareTitle: 'Bring the router you have.',
  hardware: [
    { title: 'MikroTik', text: 'Any model on RouterOS 7: hAP, RB5009, CCR. Paste one script into the terminal.', code: 'WinBox → New Terminal → paste' },
    { title: 'Raspberry Pi', text: 'A Pi 3B+, 4 or 5 becomes the hotspot, using its own Wi-Fi or an access point.', code: 'curl … /install | sudo sh' },
    { title: 'OpenWrt', text: 'Any OpenWrt router, with openNDS installed and configured for you.', code: 'curl … /install | sh' },
    { title: 'Simulator', text: 'No hardware at all. Learn, demo and set up your packages in the browser.', code: 'Built in' },
  ],
  pricingEyebrow: 'PRICING', pricingTitle: 'Our cloud, or your server.', pricingSub: "The same software either way. Your customers' payments always go to your own account.",
  popular: 'Most popular', month: '/month', free: 'Free',
  planTicks: (pro) => ['Wi-Fi page and voucher designers', 'Mobile money, vouchers, reports and team roles', pro ? 'Up to 20 routers' : '1 router'],
  selfTitle: 'Self-hosted', selfText: 'Open source, no limits. Vercel, VPS, Raspberry Pi, shared hosting or Docker.', selfTicks: ['Everything in Business', 'Unlimited routers', 'Your server, your data'], selfCta: 'See hosting options', startFree: 'Start free',
  faq: [
    ['Which routers work?', 'Any MikroTik on RouterOS 7, a Raspberry Pi (3B+, 4 or 5), or any router running OpenWrt. Access points of any brand plug in behind them. No hardware yet? Start with the built-in simulator.'],
    ['Do I need a public IP, VPN or port forwarding?', 'No. The router calls incnet every few seconds over HTTPS, so it works behind any internet provider, including mobile data links.'],
    ['How do customers pay?', 'They pick a package on the Wi-Fi page, type their number and confirm with their PIN on M-Pesa, Mixx by Yas, Airtel Money or Halotel. They are online seconds later, with no staff involved. Printed vouchers work too.'],
    ['Where does the money go?', 'Straight to your own payment account (incpesa or Snippe). incnet never holds your money.'],
    ['Can my staff use it without seeing everything?', 'Yes. Invite them with a link and pick a role: cashiers only make and look up vouchers, viewers only see reports. Every change is in the activity log.'],
    ['Can I run it on my own server?', 'Yes. incnet is open source under AGPL-3.0. Deploy it to Vercel in one click, install it on a VPS or Raspberry Pi with one command, or upload a ready-made zip to shared hosting (cPanel, Plesk, Hostinger).'],
    ['Is it in Kiswahili?', 'Yes. The dashboard and the Wi-Fi page your customers see both switch between English and Kiswahili, and you choose the default for your venue.'],
  ],
  faqNote: 'Router tokens and payment keys are encrypted. Codes can only be guessed slowly.',
  footer: 'By INCPRITECH · Open source under AGPL-3.0', piGuide: 'Raspberry Pi guide',
};

const sw: Content = {
  designer: { eyebrow: 'MBUNIFU WA UKURASA WA WI-FI', title: 'Ukurasa wa Wi-Fi unaofanana na chapa yako.', text: 'Violezo vitano (Modern, Classic, Bold, Minimal na Photo), nembo na rangi zako, kichwa cha habari, masharti ya matumizi na Kiingereza au Kiswahili. Hakikisho la simu linaonyesha kila badiliko papo hapo.', ticks: ['Unafunguka haraka kwenye simu yoyote, hata kabla ya kuunganishwa', 'Vocha na malipo kwa simu kwenye skrini moja', 'Wateja wanapata namba ya kuunganisha tena baadaye'] },
  vouchers: { eyebrow: 'VOCHA', title: 'Chapisha vocha za kuvutia.', text: 'Tengeneza hadi namba 500 kwa mara moja kwa ruta na kifurushi maalum. Chagua Classic, Ticket, Card au Minimal, na uamue kila vocha ionyeshe nini. QR code inafungua ukurasa wa Wi-Fi ikiwa na namba tayari.', ticks: ['Muda unaanza vocha inapotumika mara ya kwanza, si inapochapishwa', 'Vocha zilizotumika zinafifia kwenye karatasi', 'Ghairi namba na mtumiaji anakatwa ndani ya sekunde chache'] },
  simulator: { eyebrow: 'KIIGAJI', title: 'Jaribu kila kitu kabla ya kugusa ruta.', text: 'Kiigaji kinakupa ruta ya kuigiza na simu ya kuigiza pembeni kwa pembeni. Nunua kifurushi, tumia vocha na uone ruta ikiiruhusu simu kuingia mtandaoni, kwa malipo ya majaribio bila pesa halisi.', ticks: [], cta: 'Fungua demo' },
  business: { eyebrow: 'ENDESHA BIASHARA YAKO', title: 'Jua kilichouzwa, wapi na lini.', text: 'Mauzo kwa siku, malipo kwa simu na vocha, hali ya kila ruta na kila namba inayotumika. Vifurushi vinaweza kuuzwa kila mahali au kwenye ruta moja tu.', ticks: ['Tafuta namba yoyote ya vocha au simu', 'Mauzo yanafuata saa za eneo lako', 'Ruta zinajirekebisha: zikizimwa au kuwekwa upya, incnet inazirudisha'] },
  reportTicks: ['Mapato, mauzo, wastani wa mauzo na wateja waliolipa ukilinganisha na kipindi kilichopita', 'Saa zenye wateja wengi kwa siku, vifurushi na ruta bora, wateja wakubwa', 'Kiwango cha malipo yaliyofanikiwa, na CSV kwa mhasibu wako'],
  uses: [
    { t: 'Migahawa na mikahawa', d: 'Vifurushi vya saa na siku, vocha zinazochapishwa kaunta, na ukurasa wa Wi-Fi wenye rangi za chapa yako.' },
    { t: 'Hosteli na nyumba za wageni', d: 'Vifurushi vya wiki na mwezi vyenye kikomo cha data na vifaa viwili kwa mgeni, vinauzwa mapokezi au kwa simu.' },
    { t: 'Makazi na apartment', d: 'Malipo ya kila mwezi kwa simu, ruta moja kwa kila jengo, majengo yote kwenye dashibodi moja.' },
    { t: 'Vyuo na hosteli za wanafunzi', d: 'Vifurushi nafuu kwa wanafunzi, kasi sawa kwa wote, na ripoti kwa kila jengo.' },
    { t: 'Maduka na masoko', d: 'Geuza intaneti ya ziada kuwa kipato kwa namba ambazo wateja wananunua kwa M-Pesa ndani ya sekunde.' },
    { t: 'Matukio na makongamano', d: 'Vifurushi vya siku, kiigaji cha kufanya mazoezi, na takwimu za moja kwa moja tukio likiendelea.' },
  ],
  security: [
    { t: 'Siri zimesimbwa', d: 'Tokeni za ruta na funguo za malipo zimesimbwa. Kila ruta ina tokeni yake unayoweza kubadilisha kwa kubofya mara moja.' },
    { t: 'Malipo yanathibitishwa mara mbili', d: 'Malipo yanafungua Wi-Fi baada tu ya incnet kuyakagua tena kwa mtoa huduma kwa ufunguo wako.' },
    { t: 'Ruta zinajirekebisha', d: 'Baada ya kuzimwa au kuwekwa upya, ruta inarudisha watumiaji na ukurasa wa kuingia kwenye mawasiliano yanayofuata.' },
    { t: 'Inaendelea bila mtandao', d: 'Wateja walio mtandaoni wanaendelea hadi muda wao uishe, hata intaneti ikikatika.' },
    { t: 'Ruhusa ndogo inayohitajika', d: 'Majukumu matano, yanayokaguliwa kwenye seva kwa kila ukurasa na kitendo, pamoja na kumbukumbu ya kila badiliko.' },
    { t: 'Data yako, chaguo lako', d: 'Tumia cloud yetu, au jiendeshee kwenye Vercel, VPS, Raspberry Pi au hosting ya pamoja.' },
  ],
  roles: [['Mmiliki', 'Kila kitu, pamoja na mpango'], ['Msimamizi', 'Ruta, malipo, timu, mipangilio'], ['Meneja', 'Vifurushi, vocha, ukurasa wa Wi-Fi, ripoti'], ['Keshia', 'Anachapisha vocha, anatafuta namba'], ['Mtazamaji', 'Mauzo na ripoti, kusoma tu']],
  you: 'Wewe',
  compareHead: ['', 'Vocha za karatasi tu', 'Paneli ya kawaida ya bili', 'incnet'],
  compare: [
    ['Kuweka ruta', 'Kwa mkono', 'VPN, firewall na API kwa mkono', 'Kubandika mara moja au amri moja'],
    ['Malipo kwa simu', false, 'Nyongeza', true],
    ['Inafanya kazi na mtoa huduma yeyote, bila IP ya umma', true, false, true],
    ['Raspberry Pi na OpenWrt', false, false, true],
    ['Majukumu ya timu na kumbukumbu', false, 'Kiasi', true],
    ['Ripoti, vichujio na CSV', false, 'Za msingi', true],
    ['Wabunifu wa ukurasa wa Wi-Fi na vocha', false, false, true],
    ['Kiingereza na Kiswahili', false, false, true],
    ['Programu huria, iendeshe popote', '—', 'Kiasi', true],
  ],
  hardwareEyebrow: 'VIFAA', hardwareTitle: 'Tumia ruta uliyonayo.',
  hardware: [
    { title: 'MikroTik', text: 'Modeli yoyote yenye RouterOS 7: hAP, RB5009, CCR. Bandika script moja kwenye terminal.', code: 'WinBox → New Terminal → bandika' },
    { title: 'Raspberry Pi', text: 'Pi 3B+, 4 au 5 inakuwa hotspot, kwa Wi-Fi yake au access point.', code: 'curl … /install | sudo sh' },
    { title: 'OpenWrt', text: 'Ruta yoyote ya OpenWrt, openNDS ikiwekwa na kusanidiwa kwa ajili yako.', code: 'curl … /install | sh' },
    { title: 'Kiigaji', text: 'Bila kifaa chochote. Jifunze, onyesha na weka vifurushi vyako kwenye kivinjari.', code: 'Kimo ndani' },
  ],
  pricingEyebrow: 'BEI', pricingTitle: 'Cloud yetu, au seva yako.', pricingSub: 'Programu ni ile ile. Malipo ya wateja wako yanaenda moja kwa moja kwenye akaunti yako.',
  popular: 'Inayopendwa zaidi', month: '/mwezi', free: 'Bure',
  planTicks: (pro) => ['Wabunifu wa ukurasa wa Wi-Fi na vocha', 'Malipo kwa simu, vocha, ripoti na majukumu ya timu', pro ? 'Hadi ruta 20' : 'Ruta 1'],
  selfTitle: 'Jiendeshee', selfText: 'Programu huria, bila kikomo. Vercel, VPS, Raspberry Pi, hosting ya pamoja au Docker.', selfTicks: ['Kila kitu kilicho kwenye Business', 'Ruta bila kikomo', 'Seva yako, data yako'], selfCta: 'Ona njia za kuendesha', startFree: 'Anza bure',
  faq: [
    ['Ruta zipi zinafanya kazi?', 'MikroTik yoyote yenye RouterOS 7, Raspberry Pi (3B+, 4 au 5), au ruta yoyote yenye OpenWrt. Access point za chapa yoyote zinaunganishwa nyuma yake. Huna kifaa bado? Anza na kiigaji.'],
    ['Ninahitaji IP ya umma, VPN au port forwarding?', 'Hapana. Ruta inawasiliana na incnet kila baada ya sekunde chache kwa HTTPS, hivyo inafanya kazi na mtoa huduma yeyote wa intaneti, hata kwa data ya simu.'],
    ['Wateja wanalipaje?', 'Wanachagua kifurushi kwenye ukurasa wa Wi-Fi, wanaandika namba yao na kuthibitisha kwa PIN kwenye M-Pesa, Mixx by Yas, Airtel Money au Halotel. Wanaingia mtandaoni ndani ya sekunde, bila mhudumu. Vocha za karatasi pia zinafanya kazi.'],
    ['Pesa zinaenda wapi?', 'Moja kwa moja kwenye akaunti yako ya malipo (incpesa au Snippe). incnet haishiki pesa zako.'],
    ['Wafanyakazi wangu wanaweza kuitumia bila kuona kila kitu?', 'Ndiyo. Waalike kwa kiungo na uchague jukumu: keshia anatengeneza na kutafuta vocha tu, mtazamaji anaona ripoti tu. Kila badiliko linaandikwa kwenye kumbukumbu.'],
    ['Ninaweza kuiendesha kwenye seva yangu?', 'Ndiyo. incnet ni programu huria chini ya AGPL-3.0. Iweke Vercel kwa kubofya mara moja, isakinishe kwenye VPS au Raspberry Pi kwa amri moja, au pakia zip iliyo tayari kwenye hosting ya pamoja (cPanel, Plesk, Hostinger).'],
    ['Inapatikana kwa Kiswahili?', 'Ndiyo. Dashibodi na ukurasa wa Wi-Fi wanaouona wateja wako vyote vinabadilika kati ya Kiingereza na Kiswahili, na wewe unachagua lugha ya msingi ya eneo lako.'],
  ],
  faqNote: 'Tokeni za ruta na funguo za malipo zimesimbwa. Namba za vocha haziwezi kubahatishwa haraka.',
  footer: 'Na INCPRITECH · Programu huria chini ya AGPL-3.0', piGuide: 'Mwongozo wa Raspberry Pi',
};

export const LANDING: Record<Lang, Content> = { en, sw };

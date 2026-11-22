/**
 * English and Kiswahili for the site (landing, sign-in, dashboard). The captive Wi-Fi page has its
 * own built-in translations and a per-venue default language.
 */
export const LANGS = ['en', 'sw'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_COOKIE = 'incnet_lang';
/** Kiswahili is written for Tanzania (sw-TZ): Tanzanian words such as "ruta", "keshia" and "malipo kwa simu". */
export const HTML_LANG: Record<Lang, string> = { en: 'en', sw: 'sw-TZ' };

const en = {
  // Navigation
  'nav.overview': 'Overview', 'nav.reports': 'Reports', 'nav.sales': 'Sales', 'nav.customers': 'Customers', 'nav.vouchers': 'Vouchers',
  'nav.packages': 'Packages', 'nav.routers': 'Routers', 'nav.portal': 'Wi-Fi page', 'nav.team': 'Team', 'nav.settings': 'Settings', 'nav.platform': 'Platform console',
  'nav.signout': 'Sign out', 'nav.switch': 'Switch business', 'nav.demo': 'Demo account · resets daily', 'lang.switch': 'Kiswahili',

  // Common
  'common.apply': 'Apply', 'common.reset': 'Reset', 'common.export': 'Export CSV', 'common.search': 'Search', 'common.all': 'All',
  'common.prev': 'Previous', 'common.next': 'Next', 'common.page': 'Page', 'common.of': 'of', 'common.none': 'Nothing in this period.',

  // Overview
  'ov.title': 'Good to see you', 'ov.glance': 'at a glance.', 'ov.salesToday': 'Sales today', 'ov.month': 'This month', 'ov.connected': 'Connected codes',
  'ov.vouchersToday': 'Vouchers used today', 'ov.payments': 'mobile payments', 'ov.mobile': 'mobile money', 'ov.timeLeft': 'with time left',
  'ov.printed': 'printed in total', 'ov.makeVouchers': 'Make vouchers', 'ov.setup': 'Get set up', 'ov.routers': 'Routers', 'ov.recent': 'Recent payments',
  'ov.allSales': 'All sales', 'ov.week': 'Last 7 days', 'ov.joined': 'You joined the team. Welcome!',

  // Page headers
  'reports.title': 'Reports', 'reports.sub': 'Revenue, customers and usage, with filters you can export.',
  'sales.title': 'Sales', 'sales.sub': 'Every mobile money payment, with filters.',
  'customers.title': 'Customers', 'customers.sub': 'Everyone who paid by phone, ranked by spend.',
  'vouchers.title': 'Vouchers', 'packages.title': 'Packages', 'routers.title': 'Routers', 'team.title': 'Team', 'settings.title': 'Settings',

  // Reports
  'r.period': 'Period', 'r.router': 'Ruta', 'r.package': 'Package', 'r.channel': 'Channel', 'r.from': 'From', 'r.to': 'To',
  'r.today': 'Today', 'r.7d': '7 days', 'r.30d': '30 days', 'r.month': 'This month', 'r.lastMonth': 'Last month', 'r.custom': 'Custom',
  'r.allRouters': 'All routers', 'r.allPackages': 'All packages', 'r.allChannels': 'Mobile money and vouchers', 'r.mobile': 'Mobile money', 'r.voucher': 'Vouchers',
  'r.revenue': 'Revenue', 'r.sales': 'Sales', 'r.avg': 'Average sale', 'r.customers': 'Paying customers', 'r.success': 'Payment success',
  'r.vsPrev': 'vs previous period', 'r.overTime': 'Revenue over time', 'r.byPackage': 'By package', 'r.byRouter': 'By router',
  'r.peak': 'Busiest hours', 'r.peakSub': 'Sales by day and hour', 'r.outcomes': 'Payment outcomes', 'r.topCustomers': 'Top customers', 'r.table': 'Show as table',
  'r.completed': 'Paid', 'r.failed': 'Failed', 'r.expired': 'No answer', 'r.pending': 'Waiting', 'r.review': 'Check',

  // Auth
  'auth.welcome': 'Welcome back', 'auth.welcomeSub': 'Sign in to manage your hotspots, packages and sales', 'auth.signin': 'Sign in',
  'auth.email': 'Email', 'auth.password': 'Password', 'auth.noAccount': "Don't have an account?", 'auth.create': 'Create one', 'auth.or': 'or',
  'auth.demo': 'Try the live demo, no account needed', 'auth.createTitle': 'Create your account', 'auth.createSub': 'Start selling Wi-Fi in a few minutes. Free to start.',
  'auth.firstTitle': 'Set up this incnet server', 'auth.firstSub': 'The first account becomes the server owner', 'auth.name': 'Your name', 'auth.business': 'Business name',
  'auth.createBtn': 'Create account', 'auth.have': 'Have an account?',

  // Landing
  'lp.features': 'Features', 'lp.hardware': 'Hardware', 'lp.pricing': 'Pricing', 'lp.selfhost': 'Self-host', 'lp.docs': 'Docs', 'lp.signin': 'Sign in', 'lp.start': 'Start free', 'lp.dashboard': 'Dashboard',
  'lp.pill': 'Open source · MikroTik · Raspberry Pi · OpenWrt',
  'lp.h1a': 'Sell Wi-Fi like a pro.', 'lp.h1b': 'Set it up in one paste.',
  'lp.lead': 'incnet runs paid hotspots for cafés, hostels, shops and estates. Customers pay with mobile money or a voucher and get online by themselves. Your router is set up with one script.',
  'lp.demo': 'Try the live demo', 'lp.openDash': 'Open dashboard', 'lp.noCard': 'No card needed', 'lp.anyIsp': 'Works behind any ISP',
  'lp.s1': 'to set up a MikroTik', 'lp.s2': 'for a Raspberry Pi or OpenWrt', 'lp.s3': 'from payment to online', 'lp.s4': 'VPNs, public IPs or port forwards',
  'lp.howEyebrow': 'HOW IT WORKS', 'lp.howTitle': 'From box to selling in ten minutes.',
  'lp.step1': 'Add your router', 'lp.step1d': 'Pick MikroTik, Raspberry Pi or OpenWrt. incnet writes the setup for your exact hardware.',
  'lp.step2': 'Paste once', 'lp.step2d': 'One script or command sets up the hotspot, DHCP, login page and a sync that heals itself.',
  'lp.step3': 'Customers pay', 'lp.step3d': 'They join your Wi-Fi, pick a package, confirm with their PIN, and they are online.',
  'lp.step4': 'You get paid', 'lp.step4d': 'Money lands in your own account. Watch sales, connected users and routers live.',
  'lp.useEyebrow': 'WHO IT IS FOR', 'lp.useTitle': 'Built for every place people need Wi-Fi.',
  'lp.teamEyebrow': 'TEAMS & ROLES', 'lp.teamTitle': 'Give every person the right access.',
  'lp.teamText': 'Invite staff with a link. Cashiers print vouchers, managers run packages and reports, viewers see numbers only, and every change lands in the activity log.',
  'lp.reportEyebrow': 'REPORTS', 'lp.reportTitle': 'Numbers you can act on.',
  'lp.reportText': 'Filter by period, router, package and channel. See revenue against the previous period, your busiest hours, best packages and top customers, then export to CSV for your accountant.',
  'lp.compareEyebrow': 'WHY INCNET', 'lp.compareTitle': 'More than a voucher printer.',
  'lp.secEyebrow': 'SECURITY & RELIABILITY', 'lp.secTitle': 'Built to keep running.',
  'lp.final': 'Ready to sell Wi-Fi?', 'lp.finalSub': 'Set up your first hotspot today. It takes about ten minutes.',
  'lp.hostEyebrow': 'HOST IT ANYWHERE', 'lp.hostTitle': 'Run it your way.', 'lp.hostSub': 'Open source under AGPL-3.0. Pick what suits you, and move later if you outgrow it.',
  'lp.faqEyebrow': 'QUESTIONS', 'lp.faqTitle': 'Good to know.',
};

type Dict = Record<keyof typeof en, string>;

const sw: Dict = {
  'nav.overview': 'Muhtasari', 'nav.reports': 'Ripoti', 'nav.sales': 'Mauzo', 'nav.customers': 'Wateja', 'nav.vouchers': 'Vocha',
  'nav.packages': 'Vifurushi', 'nav.routers': 'Ruta', 'nav.portal': 'Ukurasa wa Wi-Fi', 'nav.team': 'Timu', 'nav.settings': 'Mipangilio', 'nav.platform': 'Konsoli ya jukwaa',
  'nav.signout': 'Toka', 'nav.switch': 'Badili biashara', 'nav.demo': 'Akaunti ya majaribio · inafutwa kila siku', 'lang.switch': 'English',

  'common.apply': 'Tumia', 'common.reset': 'Futa vichujio', 'common.export': 'Pakua CSV', 'common.search': 'Tafuta', 'common.all': 'Zote',
  'common.prev': 'Iliyopita', 'common.next': 'Inayofuata', 'common.page': 'Ukurasa', 'common.of': 'kati ya', 'common.none': 'Hakuna kitu katika kipindi hiki.',

  'ov.title': 'Karibu tena', 'ov.glance': 'kwa ufupi.', 'ov.salesToday': 'Mauzo ya leo', 'ov.month': 'Mwezi huu', 'ov.connected': 'Namba zinazotumika',
  'ov.vouchersToday': 'Vocha zilizotumika leo', 'ov.payments': 'malipo ya simu', 'ov.mobile': 'malipo kwa simu', 'ov.timeLeft': 'zenye muda uliobaki',
  'ov.printed': 'zilizochapishwa jumla', 'ov.makeVouchers': 'Tengeneza vocha', 'ov.setup': 'Anza kuweka', 'ov.routers': 'Ruta', 'ov.recent': 'Malipo ya karibuni',
  'ov.allSales': 'Mauzo yote', 'ov.week': 'Siku 7 zilizopita', 'ov.joined': 'Umejiunga na timu. Karibu!',

  'reports.title': 'Ripoti', 'reports.sub': 'Mapato, wateja na matumizi, kwa vichujio unavyoweza kupakua.',
  'sales.title': 'Mauzo', 'sales.sub': 'Kila malipo ya simu, pamoja na vichujio.',
  'customers.title': 'Wateja', 'customers.sub': 'Kila aliyelipa kwa simu, kwa mpangilio wa matumizi.',
  'vouchers.title': 'Vocha', 'packages.title': 'Vifurushi', 'routers.title': 'Ruta', 'team.title': 'Timu', 'settings.title': 'Mipangilio',

  'r.period': 'Kipindi', 'r.router': 'Ruta', 'r.package': 'Kifurushi', 'r.channel': 'Njia', 'r.from': 'Kuanzia', 'r.to': 'Hadi',
  'r.today': 'Leo', 'r.7d': 'Siku 7', 'r.30d': 'Siku 30', 'r.month': 'Mwezi huu', 'r.lastMonth': 'Mwezi uliopita', 'r.custom': 'Chagua tarehe',
  'r.allRouters': 'Ruta zote', 'r.allPackages': 'Vifurushi vyote', 'r.allChannels': 'Malipo kwa simu na vocha', 'r.mobile': 'Malipo kwa simu', 'r.voucher': 'Vocha',
  'r.revenue': 'Mapato', 'r.sales': 'Mauzo', 'r.avg': 'Wastani wa mauzo', 'r.customers': 'Wateja waliolipa', 'r.success': 'Malipo yaliyofanikiwa',
  'r.vsPrev': 'ukilinganisha na kipindi kilichopita', 'r.overTime': 'Mapato kwa muda', 'r.byPackage': 'Kwa kifurushi', 'r.byRouter': 'Kwa ruta',
  'r.peak': 'Saa zenye wateja wengi', 'r.peakSub': 'Mauzo kwa siku na saa', 'r.outcomes': 'Matokeo ya malipo', 'r.topCustomers': 'Wateja wakubwa', 'r.table': 'Onyesha kama jedwali',
  'r.completed': 'Imelipwa', 'r.failed': 'Imeshindwa', 'r.expired': 'Hakuna jibu', 'r.pending': 'Inasubiri', 'r.review': 'Kagua',

  'auth.welcome': 'Karibu tena', 'auth.welcomeSub': 'Ingia kusimamia hotspot, vifurushi na mauzo yako', 'auth.signin': 'Ingia',
  'auth.email': 'Barua pepe', 'auth.password': 'Nenosiri', 'auth.noAccount': 'Huna akaunti?', 'auth.create': 'Fungua akaunti', 'auth.or': 'au',
  'auth.demo': 'Jaribu demo, bila akaunti', 'auth.createTitle': 'Fungua akaunti yako', 'auth.createSub': 'Anza kuuza Wi-Fi kwa dakika chache. Bure kuanza.',
  'auth.firstTitle': 'Weka seva hii ya incnet', 'auth.firstSub': 'Akaunti ya kwanza inakuwa mmiliki wa seva', 'auth.name': 'Jina lako', 'auth.business': 'Jina la biashara',
  'auth.createBtn': 'Fungua akaunti', 'auth.have': 'Una akaunti tayari?',

  'lp.features': 'Huduma', 'lp.hardware': 'Vifaa', 'lp.pricing': 'Bei', 'lp.selfhost': 'Jiendeshee', 'lp.docs': 'Maelekezo', 'lp.signin': 'Ingia', 'lp.start': 'Anza bure', 'lp.dashboard': 'Dashibodi',
  'lp.pill': 'Programu huria · MikroTik · Raspberry Pi · OpenWrt',
  'lp.h1a': 'Uza Wi-Fi kitaalamu.', 'lp.h1b': 'Iweke kwa kubandika mara moja.',
  'lp.lead': 'incnet inaendesha hotspot za kulipia kwa mikahawa, hosteli, maduka na makazi. Wateja hulipa kwa pesa ya simu au vocha na kuunganishwa wenyewe. Ruta yako inawekwa kwa script moja.',
  'lp.demo': 'Jaribu demo', 'lp.openDash': 'Fungua dashibodi', 'lp.noCard': 'Hakuna kadi inayohitajika', 'lp.anyIsp': 'Inafanya kazi na mtoa huduma yeyote wa intaneti',
  'lp.s1': 'kuweka MikroTik', 'lp.s2': 'kwa Raspberry Pi au OpenWrt', 'lp.s3': 'kutoka malipo hadi mtandaoni', 'lp.s4': 'VPN, IP za umma wala port forwarding',
  'lp.howEyebrow': 'JINSI INAVYOFANYA KAZI', 'lp.howTitle': 'Kutoka kwenye boksi hadi kuuza kwa dakika kumi.',
  'lp.step1': 'Ongeza ruta yako', 'lp.step1d': 'Chagua MikroTik, Raspberry Pi au OpenWrt. incnet inaandika mipangilio ya kifaa chako.',
  'lp.step2': 'Bandika mara moja', 'lp.step2d': 'Script au amri moja inaweka hotspot, DHCP, ukurasa wa kuingia na usawazishaji unaojirekebisha.',
  'lp.step3': 'Wateja wanalipa', 'lp.step3d': 'Wanajiunga na Wi-Fi yako, wanachagua kifurushi, wanathibitisha kwa PIN, na wako mtandaoni.',
  'lp.step4': 'Unapokea pesa', 'lp.step4d': 'Pesa inaingia kwenye akaunti yako. Fuatilia mauzo, watumiaji na ruta moja kwa moja.',
  'lp.useEyebrow': 'NI KWA AJILI YA NANI', 'lp.useTitle': 'Imejengwa kwa kila mahali watu wanapohitaji Wi-Fi.',
  'lp.teamEyebrow': 'TIMU NA MAJUKUMU', 'lp.teamTitle': 'Mpe kila mtu ruhusa sahihi.',
  'lp.teamText': 'Alika wafanyakazi kwa kiungo. Makeshia wanachapisha vocha, mameneja wanasimamia vifurushi na ripoti, watazamaji wanaona takwimu tu, na kila badiliko linaandikwa.',
  'lp.reportEyebrow': 'RIPOTI', 'lp.reportTitle': 'Takwimu unazoweza kuzitumia.',
  'lp.reportText': 'Chuja kwa kipindi, ruta, kifurushi na njia ya malipo. Linganisha mapato na kipindi kilichopita, ona saa zenye wateja wengi, vifurushi bora na wateja wakubwa, kisha pakua CSV kwa mhasibu wako.',
  'lp.compareEyebrow': 'KWA NINI INCNET', 'lp.compareTitle': 'Zaidi ya kichapishaji cha vocha.',
  'lp.secEyebrow': 'USALAMA NA UTHABITI', 'lp.secTitle': 'Imejengwa iendelee kufanya kazi.',
  'lp.final': 'Uko tayari kuuza Wi-Fi?', 'lp.finalSub': 'Weka hotspot yako ya kwanza leo. Inachukua takriban dakika kumi.',
  'lp.hostEyebrow': 'IENDESHE POPOTE', 'lp.hostTitle': 'Iendeshe kwa njia yako.', 'lp.hostSub': 'Programu huria chini ya AGPL-3.0. Chagua inayokufaa, na uhamie baadaye ukikua.',
  'lp.faqEyebrow': 'MASWALI', 'lp.faqTitle': 'Mambo ya kujua.',
};

export const DICTS: Record<Lang, Dict> = { en, sw };
export type TKey = keyof typeof en;

export const translate = (lang: Lang, key: string) => (DICTS[lang] as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;

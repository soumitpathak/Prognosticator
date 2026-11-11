import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Heart,
  Thermometer,
  Moon,
  Droplets,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Languages,
  UserCheck,
  Building2,
  Globe2
} from 'lucide-react';
import { authService } from '../services/authService';

type LanguageKey = 'en' | 'bn' | 'ta' | 'zh' | 'tl' | 'ar' | 'hi';

interface TranslationSet {
  title: string;
  zeroSurveillance: string;
  privacyNotice: string;
  autonomicRecovery: string;
  mildStrainNotice: string;
  skinTemp: string;
  hydrationCountdown: string;
  hydrationNotice: string;
  logButton: string;
  cooldownTitle: string;
  cooldownDesc: string;
  requestBreakBtn: string;
  breakDispatchedTitle: string;
  breakDispatchedDesc: string;
  resumeShiftBtn: string;
  statutoryNotice: string;
}

const TRANSLATIONS: Record<LanguageKey, TranslationSet> = {
  en: {
    title: 'Private Worker Biometric & Recovery Terminal',
    zeroSurveillance: 'Zero Managerial Surveillance',
    privacyNotice: 'Your individual telemetry is protected by Prognosticator’s privacy shield (k-Anonymity N ≥ 12). Under company policy, MOM & HIPAA, this data cannot be used for disciplinary actions or wage docking.',
    autonomicRecovery: 'Autonomic Recovery',
    mildStrainNotice: 'Heart Rate Variability shows mild cardiovascular strain from sustained thermal exposure in Sector 4.',
    skinTemp: 'Skin & Thermal Load',
    hydrationCountdown: 'Hydration & Electrolyte Countdown',
    hydrationNotice: 'Minimum fluid target: 250ml electrolyte solution every 20 minutes under severe thermal load.',
    logButton: 'Log 250ml Consumed',
    cooldownTitle: 'Autonomous Cooling Break Request',
    cooldownDesc: 'Under Singapore MOM & GCC MoHRE Heat Regulations, every worker has an unconditional statutory right to take immediate shaded rest if experiencing dizziness or heat exhaustion.',
    requestBreakBtn: 'Request Immediate Shaded Cool-Down (Non-Punitive)',
    breakDispatchedTitle: 'Cooling Break Dispatched',
    breakDispatchedDesc: 'Medical liaison and shaded hydration tent notified. You may immediately stand down without penalty.',
    resumeShiftBtn: 'Cool-Down Completed • Resume Active Shift',
    statutoryNotice: 'Protected by Singapore MOM WSH Act & GCC MoHRE Midday Work Ban Regulations.'
  },
  bn: {
    title: 'ব্যক্তিগত কর্মী বায়োমেট্রিক ও বিশ্রাম টার্মিনাল',
    zeroSurveillance: 'কোনো ব্যবস্থাপনা নজরদারি নেই',
    privacyNotice: 'আপনার ব্যক্তিগত বায়োমেট্রিক তথ্য গোপনীয়তা শিল্ড (k-Anonymity N ≥ 12) দ্বারা সুরক্ষিত। কোম্পানির নীতি ও আন্তর্জাতিক আইন অনুযায়ী কোনো বেতন কাটা বা শাস্তিমূলক ব্যবস্থা নেওয়া যাবে না।',
    autonomicRecovery: 'শারীরিক ক্লান্তি ও হার্ট রেট ভ্যারিয়েবিলিটি',
    mildStrainNotice: 'তীব্র তাপমাত্রায় কাজ করার কারণে মৃদু হৃদযন্ত্রের ক্লান্তি শনাক্ত হয়েছে। পর্যাপ্ত পানি ও বিশ্রাম নিন।',
    skinTemp: 'শরীরের তাপমাত্রা ও তাপের প্রভাব',
    hydrationCountdown: 'পানি ও ইলেক্ট্রোলাইট পানের কাউন্টডাউন',
    hydrationNotice: 'প্রতি ২০ মিনিটে অন্তত ২৫০ মিলি পানি বা ওআরএস দ্রবণ পান করার সুপারিশ করা হচ্ছে।',
    logButton: '২৫০ মিলি পানি পান সম্পন্ন',
    cooldownTitle: 'ছায়াযুক্ত স্থানে তাৎক্ষণিক বিশ্রামের আবেদন',
    cooldownDesc: 'সিঙ্গাপুর MOM এবং উপসাগরীয় MoHRE আইন অনুযায়ী, মাথা ঘোরা বা চরম গরমে তাৎক্ষণিক ছায়ায় বিশ্রাম নেওয়া আপনার আইনি অধিকার। কোনো জরিমানা নেই।',
    requestBreakBtn: 'তাৎক্ষণিক ছায়ায় বিশ্রাম নিন (কোনো শাস্তি বা জরিমানা নেই)',
    breakDispatchedTitle: 'বিশ্রামের অনুরোধ অনুমোদিত ও প্রেরিত',
    breakDispatchedDesc: 'মেডিক্যাল টিম এবং ছায়াযুক্ত বিশ্রাম কেন্দ্র অবহিত হয়েছে। আপনি নির্ভয়ে বিশ্রাম নিতে পারেন।',
    resumeShiftBtn: 'বিশ্রাম শেষ • পুনরায় কাজ শুরু করুন',
    statutoryNotice: 'সিঙ্গাপুর MOM ডব্লিউএসএইচ আইন এবং প্রবাসী কর্মী সুরক্ষা দ্বারা সুরক্ষিত।'
  },
  ta: {
    title: 'தனியார் தொழிலாளர் பயோமெட்ரிக் மற்றும் ஓய்வு தளம்',
    zeroSurveillance: 'மேற்பார்வை கண்காணிப்பு இல்லை',
    privacyNotice: 'உங்கள் தனிப்பட்ட உடல்நலத் தகவல்கள் முழுமையாகப் பாதுகாக்கப்பட்டுள்ளன (k-அனானிமிட்டி N ≥ 12). சட்டப்படி இந்த விவரங்களை வைத்து சம்பளம் குறைக்கப்படவோ தண்டிக்கப்படவோ முடியாது.',
    autonomicRecovery: 'இதய துடிப்பு மற்றும் உடல் சோர்வு',
    mildStrainNotice: 'கடுமையான வெப்பத்தின் காரணமாக லேசான உடல் சோர்வு ஏற்பட்டுள்ளது. நிழலில் ஓய்வெடுக்கவும்.',
    skinTemp: 'தோல் மற்றும் வெப்ப நிலை',
    hydrationCountdown: 'நீர் மற்றும் எலக்ட்ரோலைட் பருகுவதற்கான நேரம்',
    hydrationNotice: 'அதிக வெப்பத்தில் ஒவ்வொரு 20 நிமிடங்களுக்கும் குறைந்தது 250 மிலி நீர் அருந்தவும்.',
    logButton: '250 மிலி நீர் பருகப்பட்டது',
    cooldownTitle: 'உடனடி நிழல் ஓய்வு கோரிக்கை',
    cooldownDesc: 'சிங்கப்பூர் MOM விதிகளின்படி, மயக்கம் அல்லது அதீத வெப்பம் ஏற்பட்டால் உடனடியாக நிழலில் ஓய்வெடுப்பது உங்கள் சட்டப்பூர்வ உரிமை.',
    requestBreakBtn: 'உடனடி நிழல் ஓய்வு கோருங்கள் (அபராதம் இல்லை)',
    breakDispatchedTitle: 'ஓய்வு கோரிக்கை அனுப்பப்பட்டது',
    breakDispatchedDesc: 'மருத்துவக் குழுவிற்கும் குளிரூட்டப்பட்ட ஓய்வுக் கூடாரத்திற்கும் தெரிவிக்கப்பட்டுள்ளது.',
    resumeShiftBtn: 'ஓய்வு முடிந்தது • பணியைத் தொடரவும்',
    statutoryNotice: 'சிங்கப்பூர் மனிதவள அமைச்சு (MOM) மற்றும் புலம்பெயர்ந்த தொழிலாளர் நலச் சட்டத்தின்படி பாதுகாக்கப்பட்டது.'
  },
  zh: {
    title: '工人个人生理体征与自主恢复终端',
    zeroSurveillance: '完全免受管理层个别监控',
    privacyNotice: '您的个人健康监测数据受 Prognosticator 隐私护盾算法（k-匿名性 N ≥ 12）严格保护。依据新加坡人力部（MOM）法规，此数据绝不用于考勤处罚或扣减工资。',
    autonomicRecovery: '自主神经恢复状态 (HRV)',
    mildStrainNotice: '心率变异性监测显示持续高温导致轻度心血管疲劳，请注意补水降温。',
    skinTemp: '体表与热负荷监测',
    hydrationCountdown: '补水与电解质提醒倒计时',
    hydrationNotice: '在严重热应激环境下，建议每20分钟饮用至少250毫升电解质溶液。',
    logButton: '记录已饮用 250ml',
    cooldownTitle: '自主申请降温休息',
    cooldownDesc: '根据新加坡人力部及国际劳工标准，工人如感头晕或中暑先兆，享有立即进入阴凉处休息的法定权利，不受任何纪律处分。',
    requestBreakBtn: '申请立即进入遮阴处降温（免责免处罚）',
    breakDispatchedTitle: '已派发降温休息指令',
    breakDispatchedDesc: '已通知现场医疗联络员及阴凉补水帐篷，请立即就地休整。',
    resumeShiftBtn: '降温完毕 • 返回工作岗位',
    statutoryNotice: '受新加坡《工作场所安全与卫生法令》(WSHA) 及外籍劳工福利条例保障。'
  },
  tl: {
    title: 'Pribadong Terminal ng Kalusugan at Pahinga ng Manggagawa',
    zeroSurveillance: 'Walang Surveillance ng Pamunuan',
    privacyNotice: 'Protektado ang iyong datos ng privacy shield (k-Anonymity N ≥ 12). Hindi ito maaaring gamitin para sa bawas-sahod o parusa ayon sa batas ng paggawa.',
    autonomicRecovery: 'Autonomic Recovery at Pagod',
    mildStrainNotice: 'May banayad na pagkapagod ang iyong puso dahil sa mataas na temperatura sa Sector 4.',
    skinTemp: 'Temperatura ng Balat at Init',
    hydrationCountdown: 'Oras ng Pag-inom ng Tubig at Electrolytes',
    hydrationNotice: 'Uminom ng hindi bababa sa 250ml na tubig kada 20 minuto sa matinding init.',
    logButton: 'Naitala ang 250ml na Nainom',
    cooldownTitle: 'Hiling para sa Agarang Pagpapalamig',
    cooldownDesc: 'Karapatan ng bawat manggagawa sa ilalim ng batas na magpahinga agad sa lilim kapag nakakaranas ng pagkahilo o sobrang init.',
    requestBreakBtn: 'Humiling ng Agarang Pahinga sa Lilim (Walang Parusa)',
    breakDispatchedTitle: 'Naipadala ang Hiling ng Pahinga',
    breakDispatchedDesc: 'Naabisuhan na ang medical liaison at hydration tent. Maaari ka nang magpahinga agad.',
    resumeShiftBtn: 'Tapos na ang Pahinga • Bumalik sa Trabaho',
    statutoryNotice: 'Protektado sa ilalim ng WSH Act at Proteksyon sa Migranteng Manggagawa.'
  },
  ar: {
    title: 'محطة المؤشرات الحيوية والتعافي الخاصة بالعامل',
    zeroSurveillance: 'حماية كاملة من المراقبة الإدارية الفردية',
    privacyNotice: 'بياناتك الحيوية محمية بنظام درع الخصوصية (k-Anonymity N ≥ 12). بموجب القانون وقرارات وزارة الموارد البشرية، لا يجوز استخدام هذه البيانات لخصم الأجور أو اتخاذ تدابير تأديبية.',
    autonomicRecovery: 'مستوى التعافي والإجهاد القلبي',
    mildStrainNotice: 'يُظهر تقلب معدل ضربات القلب إجهاداً حرارياً خفيفاً ناتجاً عن درجات الحرارة العالية.',
    skinTemp: 'حرارة الجلد والحمل الحراري',
    hydrationCountdown: 'العد التنازلي لشرب الماء والأملاح',
    hydrationNotice: 'الهدف الأدنى: شرب 250 مل من محلول الأملاح كل 20 دقيقة في الأجواء شديدة الحرارة.',
    logButton: 'تسجيل استهلاك 250 مل',
    cooldownTitle: 'طلب استراحة تبريد فورية في الظل',
    cooldownDesc: 'بموجب قرار حظر العمل وقت الظهيرة ولوائح الإجهاد الحراري، يحق لك نظاماً التوقف وأخذ قسط من الراحة المظللة فوراً دون أي استقطاع من الراتب.',
    requestBreakBtn: 'طلب استراحة فورية في منطقة مظللة (بدون عقوبة)',
    breakDispatchedTitle: 'تم إرسال طلب استراحة التبريد',
    breakDispatchedDesc: 'تم إخطار الطاقم الطبي وخيمة الترطيب المبردة. يمكنك التوقف عن العمل فوراً بأمان.',
    resumeShiftBtn: 'اكتمل التبريد • استئناف الوردية',
    statutoryNotice: 'محمي بموجب قرارات وزارة الموارد البشرية ولوائح حماية العمالة الوافدة.'
  },
  hi: {
    title: 'श्रमिक व्यक्तिगत बायोमेट्रिक एवं स्वास्थ्य रिकवरी टर्मिनल',
    zeroSurveillance: 'प्रबंधन द्वारा व्यक्तिगत निगरानी से पूर्ण सुरक्षा',
    privacyNotice: 'आपका स्वास्थ्य डेटा गोपनीयता शील्ड (k-Anonymity N ≥ 12) द्वारा सुरक्षित है। कंपनी नीति और श्रम कानूनों के अनुसार इस आधार पर वेतन नहीं काटा जा सकता।',
    autonomicRecovery: 'शारीरिक रिकवरी एवं हृदय गति संतुलन',
    mildStrainNotice: 'भीषण गर्मी के कारण हल्का तनाव दर्ज किया गया है। कृपया समय पर पानी पिएं और छाया में आराम करें।',
    skinTemp: 'शरीर का तापमान एवं हीट लोड',
    hydrationCountdown: 'जल एवं इलेक्ट्रोलाइट सेवन काउंटडाउन',
    hydrationNotice: 'गंभीर गर्मी में हर 20 मिनट में कम से कम 250 मिलीलीटर पानी अथवा ओआरएस पिएं।',
    logButton: '250 मिली पानी पिया गया दर्ज करें',
    cooldownTitle: 'छाया में त्वरित विश्राम का अनुरोध',
    cooldownDesc: 'सिंगापुर MOM एवं खाड़ी MoHRE नियमों के तहत, चक्कर आने या अत्यधिक गर्मी लगने पर तुरंत छायादार स्थान पर आराम पाना आपका कानूनी अधिकार है। कोई जुर्माना नहीं।',
    requestBreakBtn: 'तुरंत छाया में आराम का अनुरोध करें (बिना किसी जुर्माने के)',
    breakDispatchedTitle: 'विश्राम अनुरोध स्वीकृत एवं प्रेषित',
    breakDispatchedDesc: 'चिकित्सा दल एवं वातानुकूलित हाइड्रेशन टेंट को सूचित कर दिया गया है। आप तुरंत विश्राम कर सकते हैं।',
    resumeShiftBtn: 'विश्राम पूर्ण • कार्य पर लौटें',
    statutoryNotice: 'सिंगापुर WSH अधिनियम एवं प्रवासी श्रमिक सुरक्षा कानूनों द्वारा संरक्षित।'
  }
};

export default function WorkerPrivateDashboard() {
  const currentUser = authService.getCurrentUser();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>(
    currentUser.primaryLanguage in TRANSLATIONS ? (currentUser.primaryLanguage as LanguageKey) : 'en'
  );
  const [hydrationCountdown, setHydrationCountdown] = useState<number>(14 * 60 + 20); // 14 mins
  const [loggedGlasses, setLoggedGlasses] = useState<number>(3);
  const [requestedBreak, setRequestedBreak] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser.primaryLanguage in TRANSLATIONS) {
      setSelectedLanguage(currentUser.primaryLanguage as LanguageKey);
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHydrationCountdown((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;

  return (
    <div className="space-y-6">
      {/* Migrant Worker Language Selector Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Languages className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-slate-200">Migrant Worker Language Access:</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">(MOM &amp; MoHRE Multilingual Directive)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { key: 'en', label: 'English' },
              { key: 'bn', label: 'বাংলা (Bengali)' },
              { key: 'ta', label: 'தமிழ் (Tamil)' },
              { key: 'zh', label: '中文 (Chinese)' },
              { key: 'tl', label: 'Tagalog' },
              { key: 'ar', label: 'العربية (Arabic)' },
              { key: 'hi', label: 'हिन्दी (Hindi)' }
            ] as const
          ).map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => setSelectedLanguage(lang.key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                selectedLanguage === lang.key
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white">{t.title}</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  {t.zeroSurveillance}
                </span>
                {currentUser.workforceType === 'MIGRANT_WORKFORCE' && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold font-mono">
                    Migrant Pass Holder
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t.privacyNotice}
              </p>
              <div className="text-[11px] text-emerald-400/90 mt-1.5 font-medium flex items-center gap-1.5">
                <Globe2 className="h-3 w-3" />
                <span>{t.statutoryNotice}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Logged Worker</p>
            <p className="text-xs font-mono text-cyan-400 font-bold">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.assignedZoneOrDorm || 'Sector 4 Heavy Works'}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-end gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Ephemeral Sovereign Key Active
            </p>
          </div>
        </div>
      </div>

      {/* Main Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Autonomic Strain & HRV */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t.autonomicRecovery}</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  58 ms <span className="text-xs text-amber-400 font-medium font-mono">(-14% from rest)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              {t.mildStrainNotice}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[65%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>High Strain</span>
              <span>Nominal Recovery (68 ms)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Skin & Thermal Load */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t.skinTemp}</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  37.4°C <span className="text-xs text-amber-400 font-medium font-mono">(Elevated +0.9°C)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Thermometer className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Skin temperature is climbing due to high ambient radiation in Sector 4. Evaporative cooling threshold approached.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full w-[78%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Baseline 36.5°C</span>
              <span className="text-rose-400 font-semibold">Exhaustion &gt;38.2°C</span>
            </div>
          </div>
        </div>

        {/* Card 3: Circadian & Fatigue Buffer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Sleep &amp; Fatigue Buffer</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  6.8 hrs <span className="text-xs text-emerald-400 font-medium font-mono">(Restorative)</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Circadian buffer remains resilient. Nighttime recovery sleep in dormitory met quality thermal thresholds.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full w-[85%] rounded-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Deficit (&lt;5h)</span>
              <span className="text-emerald-400 font-semibold">Optimal (&gt;7h)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels: Hydration & Self-Advocacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Guidance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-cyan-400" />
                {t.hydrationCountdown}
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">
                TWL 115 W/m² (Severe Heat)
              </span>
            </div>

            <div className="text-4xl font-extrabold font-mono text-cyan-400 my-2 flex items-center justify-center gap-2">
              <Clock className="h-7 w-7 text-cyan-500" />
              {formatTime(hydrationCountdown)}
            </div>
            <p className="text-[11px] text-slate-400">
              {t.hydrationNotice}
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span>Logged Today:</span>
              <strong className="text-cyan-400 font-mono text-sm">{loggedGlasses} / 8</strong>
              <span className="text-[11px] text-slate-400">portions</span>
              {loggedGlasses > 0 && (
                <button
                  type="button"
                  onClick={() => setLoggedGlasses((g) => Math.max(0, g - 1))}
                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-500 cursor-pointer transition"
                  title="Decrement portion"
                >
                  -1
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLoggedGlasses((g) => g + 1)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Droplets className="h-3.5 w-3.5" /> {t.logButton}
            </button>
          </div>
        </div>

        {/* Private Worker Self-Advocacy & Cooldown Request */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-400" /> {t.cooldownTitle}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {t.cooldownDesc}
            </p>
            {requestedBreak ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">{t.breakDispatchedTitle}</strong>
                    <span>{t.breakDispatchedDesc}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRequestedBreak(false)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium"
                  >
                    <span>{t.resumeShiftBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Clicking below dispatches an anonymous, non-punitive relief rotation request to your zone safety officer.
                </p>
              </div>
            )}
          </div>

          {!requestedBreak && (
            <button
              type="button"
              onClick={() => setRequestedBreak(true)}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <AlertCircle className="h-4 w-4" /> {t.requestBreakBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'tr' | 'de' | 'ar';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations for all supported languages
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.viewingAs': 'Viewing as:',
    'header.selectUniversity': 'Select University',
    'header.loading': 'Loading...',
    'header.turkishUniversities': 'Turkish Universities',
    'header.internationalUniversities': 'International Universities',
    'header.signOut': 'Sign Out',
    'header.language': 'Language',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.partners': 'Partners',
    'nav.mobility': 'Mobility',
    'nav.mou': 'MOU',
    'nav.partnerships': 'Partnerships',
    'nav.intelligence': 'Intelligence',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.activePartnerships': 'Active Partnerships',
    'dashboard.pendingMOUs': 'Pending MOUs',
    'dashboard.mobilityBalance': 'Mobility Balance',
    'dashboard.actionItems': 'Action Items',
    'dashboard.mobilityTrends': 'Mobility Trends',
    'dashboard.mouStatus': 'MOU Status',
    'dashboard.partnersByRegion': 'Partners by Region',
    'dashboard.projectsOverview': 'Projects Overview',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.marketIntelligence': 'Market Intelligence',
    
    // Profile
    'profile.title': 'University Profile',
    'profile.subtitle': 'AI-generated institutional analysis and strategic intelligence',
    'profile.healthIndex': 'Institutional Health Index',
    'profile.overallScore': 'Overall Score',
    'profile.executiveSummary': 'Executive Summary',
    'profile.strengths': 'Strengths',
    'profile.weaknesses': 'Weaknesses',
    'profile.recommendations': 'Strategic Recommendations',
    'profile.departmentROI': 'Department ROI Analysis',
    
    // Partners
    'partners.title': 'Partner Discovery',
    'partners.subtitle': 'AI-powered partner recommendations and university database',
    'partners.aiRecommended': 'AI Recommended',
    'partners.allUniversities': 'All Universities',
    'partners.search': 'Search partners...',
    'partners.allRegions': 'All Regions',
    'partners.refresh': 'Refresh',
    'partners.viewProfile': 'View Profile',
    'partners.initiateMOU': 'Initiate MOU',
    'partners.matchScore': 'Match Score',
    
    // Mobility
    'mobility.title': 'Student Mobility Management',
    'mobility.overview': 'Overview',
    'mobility.studentApplications': 'Student Applications',
    'mobility.learningAgreements': 'Learning Agreements',
    'mobility.incoming': 'Incoming',
    'mobility.outgoing': 'Outgoing',
    'mobility.partnerUniversities': 'Partner Universities',
    'mobility.activePrograms': 'Active Programs',
    'mobility.programType': 'Program Type',
    'mobility.allPrograms': 'All Programs',
    'mobility.direction': 'Direction',
    'mobility.allDirections': 'All Directions',
    'mobility.academicYear': 'Academic Year',
    'mobility.allYears': 'All Years',
    'mobility.status': 'Status',
    
    // MOU
    'mou.title': 'MOU Management',
    'mou.createNew': 'Create New MOU',
    'mou.status': 'Status',
    'mou.partner': 'Partner',
    'mou.clauses': 'Clauses',
    'mou.history': 'History',
    
    // Market Intelligence
    'intelligence.title': 'Market Intelligence',
    'intelligence.subtitle': 'AI-powered market analysis and strategic recommendations',
    'intelligence.generateAnalysis': 'Generate Analysis',
    'intelligence.regenerate': 'Regenerate',
    'intelligence.recommendations': 'AI Recommendations',
    'intelligence.metrics': 'Market Metrics',
    'intelligence.confidence': 'Confidence',
    'intelligence.risk': 'Risk Level',
    'intelligence.keyMetrics': 'Key Metrics',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.refresh': 'Refresh',
    'common.generate': 'Generate',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.completed': 'Completed',
    'common.pending': 'Pending',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.draft': 'Draft',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
  },
  tr: {
    // Header
    'header.viewingAs': 'Görüntülenen:',
    'header.selectUniversity': 'Üniversite Seçin',
    'header.loading': 'Yükleniyor...',
    'header.turkishUniversities': 'Türk Üniversiteleri',
    'header.internationalUniversities': 'Uluslararası Üniversiteler',
    'header.signOut': 'Çıkış Yap',
    'header.language': 'Dil',
    
    // Navigation
    'nav.dashboard': 'Gösterge Paneli',
    'nav.profile': 'Profil',
    'nav.partners': 'Ortaklar',
    'nav.mobility': 'Hareketlilik',
    'nav.mou': 'MOU',
    'nav.partnerships': 'Ortaklıklar',
    'nav.intelligence': 'Pazar Analizi',
    
    // Dashboard
    'dashboard.title': 'Gösterge Paneli',
    'dashboard.activePartnerships': 'Aktif Ortaklıklar',
    'dashboard.pendingMOUs': 'Bekleyen MOU\'lar',
    'dashboard.mobilityBalance': 'Hareketlilik Dengesi',
    'dashboard.actionItems': 'Eylem Öğeleri',
    'dashboard.mobilityTrends': 'Hareketlilik Trendleri',
    'dashboard.mouStatus': 'MOU Durumu',
    'dashboard.partnersByRegion': 'Bölgeye Göre Ortaklar',
    'dashboard.projectsOverview': 'Projeler Genel Bakış',
    'dashboard.quickActions': 'Hızlı İşlemler',
    'dashboard.marketIntelligence': 'Pazar Analizi',
    
    // Profile
    'profile.title': 'Üniversite Profili',
    'profile.subtitle': 'Yapay zeka destekli kurumsal analiz ve stratejik istihbarat',
    'profile.healthIndex': 'Kurumsal Sağlık Endeksi',
    'profile.overallScore': 'Genel Puan',
    'profile.executiveSummary': 'Yönetici Özeti',
    'profile.strengths': 'Güçlü Yönler',
    'profile.weaknesses': 'Zayıf Yönler',
    'profile.recommendations': 'Stratejik Öneriler',
    'profile.departmentROI': 'Bölüm ROI Analizi',
    
    // Partners
    'partners.title': 'Ortak Keşfi',
    'partners.subtitle': 'Yapay zeka destekli ortak önerileri ve üniversite veritabanı',
    'partners.aiRecommended': 'Yapay Zeka Önerileri',
    'partners.allUniversities': 'Tüm Üniversiteler',
    'partners.search': 'Ortak ara...',
    'partners.allRegions': 'Tüm Bölgeler',
    'partners.refresh': 'Yenile',
    'partners.viewProfile': 'Profili Görüntüle',
    'partners.initiateMOU': 'MOU Başlat',
    'partners.matchScore': 'Eşleşme Puanı',
    
    // Mobility
    'mobility.title': 'Öğrenci Hareketlilik Yönetimi',
    'mobility.overview': 'Genel Bakış',
    'mobility.studentApplications': 'Öğrenci Başvuruları',
    'mobility.learningAgreements': 'Öğrenim Anlaşmaları',
    'mobility.incoming': 'Gelen',
    'mobility.outgoing': 'Giden',
    'mobility.partnerUniversities': 'Ortak Üniversiteler',
    'mobility.activePrograms': 'Aktif Programlar',
    'mobility.programType': 'Program Türü',
    'mobility.allPrograms': 'Tüm Programlar',
    'mobility.direction': 'Yön',
    'mobility.allDirections': 'Tüm Yönler',
    'mobility.academicYear': 'Akademik Yıl',
    'mobility.allYears': 'Tüm Yıllar',
    'mobility.status': 'Durum',
    
    // MOU
    'mou.title': 'MOU Yönetimi',
    'mou.createNew': 'Yeni MOU Oluştur',
    'mou.status': 'Durum',
    'mou.partner': 'Ortak',
    'mou.clauses': 'Maddeler',
    'mou.history': 'Geçmiş',
    
    // Market Intelligence
    'intelligence.title': 'Pazar Analizi',
    'intelligence.subtitle': 'Yapay zeka destekli pazar analizi ve stratejik öneriler',
    'intelligence.generateAnalysis': 'Analiz Oluştur',
    'intelligence.regenerate': 'Yeniden Oluştur',
    'intelligence.recommendations': 'Yapay Zeka Önerileri',
    'intelligence.metrics': 'Pazar Metrikleri',
    'intelligence.confidence': 'Güven',
    'intelligence.risk': 'Risk Seviyesi',
    'intelligence.keyMetrics': 'Anahtar Metrikler',
    
    // Common
    'common.loading': 'Yükleniyor...',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.add': 'Ekle',
    'common.search': 'Ara',
    'common.filter': 'Filtrele',
    'common.refresh': 'Yenile',
    'common.generate': 'Oluştur',
    'common.download': 'İndir',
    'common.upload': 'Yükle',
    'common.submit': 'Gönder',
    'common.back': 'Geri',
    'common.next': 'İleri',
    'common.completed': 'Tamamlandı',
    'common.pending': 'Beklemede',
    'common.active': 'Aktif',
    'common.inactive': 'Pasif',
    'common.draft': 'Taslak',
    'common.approved': 'Onaylandı',
    'common.rejected': 'Reddedildi',
  },
  de: {
    // Header
    'header.viewingAs': 'Anzeige als:',
    'header.selectUniversity': 'Universität auswählen',
    'header.loading': 'Laden...',
    'header.turkishUniversities': 'Türkische Universitäten',
    'header.internationalUniversities': 'Internationale Universitäten',
    'header.signOut': 'Abmelden',
    'header.language': 'Sprache',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profil',
    'nav.partners': 'Partner',
    'nav.mobility': 'Mobilität',
    'nav.mou': 'MOU',
    'nav.partnerships': 'Partnerschaften',
    'nav.intelligence': 'Marktanalyse',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.activePartnerships': 'Aktive Partnerschaften',
    'dashboard.pendingMOUs': 'Ausstehende MOUs',
    'dashboard.mobilityBalance': 'Mobilitätsbilanz',
    'dashboard.actionItems': 'Aktionspunkte',
    'dashboard.mobilityTrends': 'Mobilitätstrends',
    'dashboard.mouStatus': 'MOU-Status',
    'dashboard.partnersByRegion': 'Partner nach Region',
    'dashboard.projectsOverview': 'Projektübersicht',
    'dashboard.quickActions': 'Schnellaktionen',
    'dashboard.marketIntelligence': 'Marktanalyse',
    
    // Profile
    'profile.title': 'Universitätsprofil',
    'profile.subtitle': 'KI-gestützte institutionelle Analyse und strategische Intelligenz',
    'profile.healthIndex': 'Institutioneller Gesundheitsindex',
    'profile.overallScore': 'Gesamtpunktzahl',
    'profile.executiveSummary': 'Zusammenfassung',
    'profile.strengths': 'Stärken',
    'profile.weaknesses': 'Schwächen',
    'profile.recommendations': 'Strategische Empfehlungen',
    'profile.departmentROI': 'Abteilungs-ROI-Analyse',
    
    // Partners
    'partners.title': 'Partnersuche',
    'partners.subtitle': 'KI-gestützte Partnerempfehlungen und Universitätsdatenbank',
    'partners.aiRecommended': 'KI-Empfehlungen',
    'partners.allUniversities': 'Alle Universitäten',
    'partners.search': 'Partner suchen...',
    'partners.allRegions': 'Alle Regionen',
    'partners.refresh': 'Aktualisieren',
    'partners.viewProfile': 'Profil anzeigen',
    'partners.initiateMOU': 'MOU starten',
    'partners.matchScore': 'Übereinstimmung',
    
    // Mobility
    'mobility.title': 'Studentenmobilitätsverwaltung',
    'mobility.overview': 'Übersicht',
    'mobility.studentApplications': 'Studentenanträge',
    'mobility.learningAgreements': 'Lernvereinbarungen',
    'mobility.incoming': 'Eingehend',
    'mobility.outgoing': 'Ausgehend',
    'mobility.partnerUniversities': 'Partneruniversitäten',
    'mobility.activePrograms': 'Aktive Programme',
    'mobility.programType': 'Programmtyp',
    'mobility.allPrograms': 'Alle Programme',
    'mobility.direction': 'Richtung',
    'mobility.allDirections': 'Alle Richtungen',
    'mobility.academicYear': 'Akademisches Jahr',
    'mobility.allYears': 'Alle Jahre',
    'mobility.status': 'Status',
    
    // MOU
    'mou.title': 'MOU-Verwaltung',
    'mou.createNew': 'Neues MOU erstellen',
    'mou.status': 'Status',
    'mou.partner': 'Partner',
    'mou.clauses': 'Klauseln',
    'mou.history': 'Verlauf',
    
    // Market Intelligence
    'intelligence.title': 'Marktanalyse',
    'intelligence.subtitle': 'KI-gestützte Marktanalyse und strategische Empfehlungen',
    'intelligence.generateAnalysis': 'Analyse erstellen',
    'intelligence.regenerate': 'Neu erstellen',
    'intelligence.recommendations': 'KI-Empfehlungen',
    'intelligence.metrics': 'Marktmetriken',
    'intelligence.confidence': 'Vertrauen',
    'intelligence.risk': 'Risikostufe',
    'intelligence.keyMetrics': 'Schlüsselmetriken',
    
    // Common
    'common.loading': 'Laden...',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.refresh': 'Aktualisieren',
    'common.generate': 'Erstellen',
    'common.download': 'Herunterladen',
    'common.upload': 'Hochladen',
    'common.submit': 'Absenden',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.completed': 'Abgeschlossen',
    'common.pending': 'Ausstehend',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',
    'common.draft': 'Entwurf',
    'common.approved': 'Genehmigt',
    'common.rejected': 'Abgelehnt',
  },
  ar: {
    // Header
    'header.viewingAs': 'العرض كـ:',
    'header.selectUniversity': 'اختر الجامعة',
    'header.loading': 'جاري التحميل...',
    'header.turkishUniversities': 'الجامعات التركية',
    'header.internationalUniversities': 'الجامعات الدولية',
    'header.signOut': 'تسجيل الخروج',
    'header.language': 'اللغة',
    
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.partners': 'الشركاء',
    'nav.mobility': 'التنقل',
    'nav.mou': 'مذكرة التفاهم',
    'nav.partnerships': 'الشراكات',
    'nav.intelligence': 'تحليل السوق',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.activePartnerships': 'الشراكات النشطة',
    'dashboard.pendingMOUs': 'مذكرات التفاهم المعلقة',
    'dashboard.mobilityBalance': 'ميزان التنقل',
    'dashboard.actionItems': 'عناصر العمل',
    'dashboard.mobilityTrends': 'اتجاهات التنقل',
    'dashboard.mouStatus': 'حالة مذكرة التفاهم',
    'dashboard.partnersByRegion': 'الشركاء حسب المنطقة',
    'dashboard.projectsOverview': 'نظرة عامة على المشاريع',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.marketIntelligence': 'تحليل السوق',
    
    // Profile
    'profile.title': 'ملف الجامعة',
    'profile.subtitle': 'تحليل مؤسسي مدعوم بالذكاء الاصطناعي واستخبارات استراتيجية',
    'profile.healthIndex': 'مؤشر الصحة المؤسسية',
    'profile.overallScore': 'النتيجة الإجمالية',
    'profile.executiveSummary': 'الملخص التنفيذي',
    'profile.strengths': 'نقاط القوة',
    'profile.weaknesses': 'نقاط الضعف',
    'profile.recommendations': 'التوصيات الاستراتيجية',
    'profile.departmentROI': 'تحليل عائد الاستثمار للأقسام',
    
    // Partners
    'partners.title': 'اكتشاف الشركاء',
    'partners.subtitle': 'توصيات الشركاء المدعومة بالذكاء الاصطناعي وقاعدة بيانات الجامعات',
    'partners.aiRecommended': 'توصيات الذكاء الاصطناعي',
    'partners.allUniversities': 'جميع الجامعات',
    'partners.search': 'البحث عن شركاء...',
    'partners.allRegions': 'جميع المناطق',
    'partners.refresh': 'تحديث',
    'partners.viewProfile': 'عرض الملف',
    'partners.initiateMOU': 'بدء مذكرة التفاهم',
    'partners.matchScore': 'درجة التطابق',
    
    // Mobility
    'mobility.title': 'إدارة تنقل الطلاب',
    'mobility.overview': 'نظرة عامة',
    'mobility.studentApplications': 'طلبات الطلاب',
    'mobility.learningAgreements': 'اتفاقيات التعلم',
    'mobility.incoming': 'الوارد',
    'mobility.outgoing': 'الصادر',
    'mobility.partnerUniversities': 'الجامعات الشريكة',
    'mobility.activePrograms': 'البرامج النشطة',
    'mobility.programType': 'نوع البرنامج',
    'mobility.allPrograms': 'جميع البرامج',
    'mobility.direction': 'الاتجاه',
    'mobility.allDirections': 'جميع الاتجاهات',
    'mobility.academicYear': 'السنة الأكاديمية',
    'mobility.allYears': 'جميع السنوات',
    'mobility.status': 'الحالة',
    
    // MOU
    'mou.title': 'إدارة مذكرة التفاهم',
    'mou.createNew': 'إنشاء مذكرة تفاهم جديدة',
    'mou.status': 'الحالة',
    'mou.partner': 'الشريك',
    'mou.clauses': 'البنود',
    'mou.history': 'السجل',
    
    // Market Intelligence
    'intelligence.title': 'تحليل السوق',
    'intelligence.subtitle': 'تحليل السوق والتوصيات الاستراتيجية المدعومة بالذكاء الاصطناعي',
    'intelligence.generateAnalysis': 'إنشاء التحليل',
    'intelligence.regenerate': 'إعادة الإنشاء',
    'intelligence.recommendations': 'توصيات الذكاء الاصطناعي',
    'intelligence.metrics': 'مقاييس السوق',
    'intelligence.confidence': 'الثقة',
    'intelligence.risk': 'مستوى المخاطر',
    'intelligence.keyMetrics': 'المقاييس الرئيسية',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.refresh': 'تحديث',
    'common.generate': 'إنشاء',
    'common.download': 'تحميل',
    'common.upload': 'رفع',
    'common.submit': 'إرسال',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.completed': 'مكتمل',
    'common.pending': 'معلق',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.draft': 'مسودة',
    'common.approved': 'موافق عليه',
    'common.rejected': 'مرفوض',
  },
};

const languageNames: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  ar: 'العربية',
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('iris-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('iris-language', lang);
    // Update document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { languageNames };

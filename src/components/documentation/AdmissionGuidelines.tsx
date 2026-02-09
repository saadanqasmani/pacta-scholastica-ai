import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BookOpen, Users, FileText, Globe, Languages, GraduationCap, ShieldCheck, 
  AlertTriangle, CheckCircle2, XCircle, Info, Stamp, Building2, Scale
} from 'lucide-react';

export function AdmissionGuidelines() {
  const { t, language } = useLanguage();
  const isTR = language === 'tr';

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-6 pr-4">
        {/* Header Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-primary" />
              {isTR ? 'İstanbul Nişantaşı Üniversitesi Uluslararası Öğrenci Kabul Yönergesi' : 'İstanbul Nişantaşı University International Student Admission Guidelines'}
            </CardTitle>
            <CardDescription>
              {isTR 
                ? 'Senato Kararı: 09.12.2025 tarih ve 2025/28 sayılı karar ile güncellenmiştir. YÖK Yurtdışından Öğrenci Kabulüne İlişkin Esaslar doğrultusunda hazırlanmıştır.'
                : 'Senate Decision: Updated by resolution dated 09.12.2025, No. 2025/28. Prepared in accordance with YÖK (Council of Higher Education) principles on admission of students from abroad.'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Eligibility Rules - Madde 7 */}
        <Accordion type="multiple" defaultValue={['eligibility', 'documents', 'language']} className="space-y-3">
          <AccordionItem value="eligibility" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{isTR ? 'Başvuru Şartları (Madde 7)' : 'Eligibility Requirements (Article 7)'}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {isTR ? 'Başvurusu Kabul Edilenler' : 'Eligible Applicants'}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>{isTR 
                    ? 'Yabancı uyruklu olanlar (Türkiye\'deki liselerde 2022-2023 öncesi kayıtlı olması şartıyla)' 
                    : 'Foreign nationals (must have enrolled in Turkish high schools before 2022-2023 academic year)'}</li>
                  <li>{isTR 
                    ? 'Doğumla Türk vatandaşı olup vatandaşlıktan çıkanlar / Mavi Kart sahipleri' 
                    : 'Those born as Turkish citizens who renounced citizenship / Blue Card holders'}</li>
                  <li>{isTR 
                    ? 'Yabancı uyruklu iken sonradan T.C. vatandaşlığına geçenler / çift uyruklular' 
                    : 'Those who acquired Turkish citizenship after being foreign nationals / dual citizens'}</li>
                  <li>{isTR 
                    ? 'T.C. uyruklu olup ortaöğretimin tamamını KKTC hariç yabancı ülkede tamamlayanlar' 
                    : 'Turkish citizens who completed all secondary education abroad (excluding TRNC)'}</li>
                  <li>{isTR 
                    ? 'KKTC uyruklu olup GCE AL sınav sonucuna sahip olanlar veya yurtdışında lise tamamlayıp TR-YÖS sonucuna sahip olanlar' 
                    : 'TRNC citizens with GCE AL exam results or those who completed high school abroad with TR-YÖS results'}</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  {isTR ? 'Başvurusu Kabul Edilmeyenler' : 'Ineligible Applicants'}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
                  <li>{isTR 
                    ? 'T.C. uyruklu olup ortaöğretimini Türkiye\'de veya KKTC\'de tamamlayanlar' 
                    : 'Turkish citizens who completed secondary education in Turkey or TRNC'}</li>
                  <li>{isTR 
                    ? 'KKTC uyruklu olanlar (GCE AL veya TR-YÖS sahipleri hariç)' 
                    : 'TRNC citizens (except those with GCE AL or TR-YÖS results)'}</li>
                  <li>{isTR 
                    ? 'Doğumla ilk uyruğu T.C. olan çift uyruklular (belirli istisnalar hariç)' 
                    : 'Dual citizens whose first nationality by birth is Turkish (with certain exceptions)'}</li>
                  <li>{isTR 
                    ? '2022-2023 eğitim-öğretim yılından itibaren Türkiye\'deki ortaöğretim kurumlarına kayıt yaptıran yabancı uyruklular' 
                    : 'Foreign nationals enrolled in Turkish secondary institutions from 2022-2023 onward'}</li>
                  <li>{isTR 
                    ? 'Yurtdışında bulunmaksızın uzaktan öğretim yoluyla yurtdışındaki liseden diploma alanlar' 
                    : 'Those who obtained a diploma from a foreign high school via distance education without being abroad'}</li>
                </ul>
              </div>
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm">
                  {isTR 
                    ? 'Türkiye Cumhuriyeti İçişleri Bakanlığı Göç İdaresi Başkanlığı kapsamında yasal kalış hakkı bulunmayan yabancıların başvuruları kabul edilmez.' 
                    : 'Applications from foreigners without legal right of stay under the Directorate General of Migration Management are not accepted.'}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Required Documents - Madde 11 */}
          <AccordionItem value="documents" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold">{isTR ? 'Kayıt İçin Gerekli Belgeler (Madde 11)' : 'Required Registration Documents (Article 11)'}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {[
                { key: 'a', icon: GraduationCap, label: isTR ? 'Lise diploması veya geçici mezuniyet belgesinin aslı' : 'Original high school diploma or provisional graduation certificate', note: isTR ? 'Türkçe/İngilizce değilse noter onaylı tercüme gerekir' : 'Notarized Turkish translation required if not in Turkish/English' },
                { key: 'b', icon: FileText, label: isTR ? 'Resmi not belgesi (transkript) aslı' : 'Official transcript (original)', note: isTR ? 'Lise müdürlüğü onaylı, Türkçe/İngilizce değilse noter tercümesi' : 'Certified by school, notarized translation if not in Turkish/English' },
                { key: 'c', icon: Stamp, label: isTR ? 'EK 3 kriterlerine uygun sınav sonuç belgesi' : 'Exam result certificate per EK 3 criteria', note: isTR ? 'Diploma türleri ve minimum puanlar geçerlidir' : 'Diploma types and minimum scores apply' },
                { key: 'ç', icon: Globe, label: isTR ? 'Pasaport kimlik sayfası ve hudut kapısı giriş kaşesi' : 'Passport ID page and border entry stamp', note: null },
                { key: 'd', icon: ShieldCheck, label: isTR ? 'Pasaportaki vize etiketi' : 'Visa sticker on passport', note: isTR ? 'Vize muafiyeti kapsamındakiler hariç' : 'Except those under visa exemption' },
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="shrink-0 mt-0.5">{item.key}</Badge>
                  <div>
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {item.note && <p className="text-xs text-muted-foreground mt-1 ml-6">{item.note}</p>}
                  </div>
                </div>
              ))}
              <Separator />
              <p className="text-sm font-medium">{isTR ? 'Varsa ek olarak:' : 'Additionally, if applicable:'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  isTR ? 'İkamet izin belgesi' : 'Residence permit',
                  isTR ? 'Vatansız kişi kimlik belgesi' : 'Stateless person ID',
                  isTR ? 'Uluslararası koruma başvuru/statü belgesi' : 'International protection status document',
                  isTR ? 'Geçici koruma kimlik belgesi' : 'Temporary protection ID',
                  isTR ? 'Çalışma izni belgesi' : 'Work permit',
                  isTR ? 'Mavi kart' : 'Blue card',
                  isTR ? 'Yabancı Temsilcilik Personel Kimlik Kartı' : 'Foreign Mission Personnel ID Card',
                  isTR ? 'İngilizce/Türkçe Yeterlik belgesi' : 'English/Turkish proficiency certificate',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-md">
                <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-sm">
                  {isTR 
                    ? '18 yaşından küçükler için veli/vasi muvafakatnamesi ve veli bilgisi içeren belge (doğum belgesi vb.) gereklidir.' 
                    : 'For minors under 18: parental/guardian consent and documentation containing guardian information (birth certificate, etc.) is required.'}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Language Requirements - Madde 10 */}
          <AccordionItem value="language" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-primary" />
                <span className="font-semibold">{isTR ? 'Dil Yeterliliği (Madde 10)' : 'Language Proficiency (Article 10)'}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {/* English EK 1 */}
              <div>
                <h4 className="font-medium text-sm mb-2">{isTR ? 'EK 1: İngilizce Yeterlilik Eşdeğerlikleri' : 'Annex 1: English Proficiency Equivalencies'}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {isTR ? 'İngilizce programlar için hazırlık muafiyeti gereksinimleri:' : 'Preparatory exemption requirements for English-taught programs:'}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isTR ? 'Sınav' : 'Exam'}</TableHead>
                      <TableHead>{isTR ? 'Genel Programlar' : 'General Programs'}</TableHead>
                      <TableHead>{isTR ? 'İngiliz Dili & Mütercim Tercümanlık' : 'English Literature & Translation'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>TOEFL-IBT</TableCell><TableCell><Badge>72</Badge></TableCell><TableCell><Badge variant="secondary">90</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Cambridge C1 Advanced</TableCell><TableCell><Badge>C</Badge></TableCell><TableCell><Badge variant="secondary">A</Badge></TableCell></TableRow>
                    <TableRow><TableCell>Cambridge C2 Proficiency</TableCell><TableCell>—</TableCell><TableCell><Badge variant="secondary">C</Badge></TableCell></TableRow>
                    <TableRow><TableCell>PTE-Akademik</TableCell><TableCell><Badge>55</Badge></TableCell><TableCell><Badge variant="secondary">75</Badge></TableCell></TableRow>
                    <TableRow><TableCell>YDS/YÖKDİL</TableCell><TableCell><Badge>60</Badge></TableCell><TableCell><Badge variant="secondary">75</Badge></TableCell></TableRow>
                  </TableBody>
                </Table>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {isTR ? 'Başka üniversitenin İngilizce hazırlık programını başarıyla tamamlayanlar muaf tutulabilir.' : 'Those who completed another university\'s English preparatory program may be exempt.'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {isTR ? 'İngilizcenin resmi dil olduğu ülkede ortaöğretimini tamamlayanlar muaf tutulabilir.' : 'Those who completed secondary education in a country where English is official language may be exempt.'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Turkish EK 2 */}
              <div>
                <h4 className="font-medium text-sm mb-2">{isTR ? 'EK 2: Türkçe Yeterlilik Gereksinimleri' : 'Annex 2: Turkish Proficiency Requirements'}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {isTR 
                    ? 'Türkçe programlar için B2 seviyesinde Türkçe Dil Yeterliliği Belgesi gereklidir.' 
                    : 'B2 level Turkish Language Proficiency Certificate is required for Turkish-taught programs.'}
                </p>
                <p className="text-sm font-medium mb-2">{isTR ? 'Kabul edilen kuruluşlar:' : 'Accepted institutions:'}</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>{isTR ? 'Üniversitelerin TÖMER ve Türkçe Öğretimi Merkezleri' : 'University TÖMER and Turkish Language Centers'}</li>
                  <li>{isTR ? 'Yunus Emre Enstitüsü' : 'Yunus Emre Institute'}</li>
                  <li>{isTR ? 'Yurtdışı Türkler ve Akraba Topluluklar Başkanlığı (YTB)' : 'Presidency for Turks Abroad and Related Communities (YTB)'}</li>
                </ul>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {isTR ? 'Türkiye\'de tüm ortaöğretimini tamamlayanlar muaf tutulabilir.' : 'Those who completed all secondary education in Turkey may be exempt.'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {isTR ? 'MEB nezdinde açılmış yurtdışındaki Türk okullarında tamamlayanlar muaf tutulabilir.' : 'Those who completed education at MEB-affiliated Turkish schools abroad may be exempt.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm">
                  {isTR 
                    ? 'Yeterli seviyeyi sağlayamayan öğrenciye 1 yıl ek süre verilir. Toplam 2 yıl sonunda seviyeyi sağlayamayan öğrencinin Üniversite ile ilişiği kesilir.' 
                    : 'Students who cannot achieve the required level are given 1 additional year. If unable to achieve the level after a total of 2 years, the student\'s enrollment is terminated.'}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Additional Important Rules */}
          <AccordionItem value="additional" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">{isTR ? 'Diğer Önemli Hükümler' : 'Other Important Provisions'}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {[
                { icon: ShieldCheck, title: isTR ? 'İkamet İzni (Madde 17)' : 'Residence Permit (Article 17)', desc: isTR ? 'Türkiye\'ye giriş tarihinden itibaren en geç 3 ay içerisinde ikamet izni belgesini Uluslararası Ofis\'e ibraz etmeleri gerekir. Aksi halde öğrencilik haklarından yararlanamazlar.' : 'Must submit residence permit to International Office within 3 months of entering Turkey. Otherwise, they cannot benefit from student rights.' },
                { icon: Scale, title: isTR ? 'Genel Sağlık Sigortası (Madde 15)' : 'General Health Insurance (Article 15)', desc: isTR ? 'Her eğitim-öğretim dönemine ilişkin genel sağlık sigortası primleri ve ikamet izni belge bedelleri öğrenciler tarafından ödenir.' : 'Health insurance premiums and residence permit fees for each academic term are paid by students.' },
                { icon: AlertTriangle, title: isTR ? 'Sahte/Eksik Belge (Madde 16)' : 'Fake/Missing Documents (Article 16)', desc: isTR ? 'Tahrif edilmiş, sahte, eksik veya yanlış belge sunan öğrencilerin kayıtları, kesin kayıt yapılmış olsa dahi iptal edilir.' : 'Enrollment of students who submit falsified, fake, incomplete or incorrect documents will be cancelled, even if final registration was completed.' },
                { icon: GraduationCap, title: isTR ? 'Burs İmkânı (Madde 14)' : 'Scholarship Opportunities (Article 14)', desc: isTR ? 'Burs Yönergesinin ilgili maddelerine göre Komisyon değerlendirmesi ve Mütevelli Heyeti onayı ile burs imkânı tanınabilir.' : 'Scholarships may be granted based on Commission evaluation and Board of Trustees approval per the Scholarship Directive.' },
                { icon: FileText, title: isTR ? 'Ön Kabul Mektubu (Madde 17/5)' : 'Pre-Acceptance Letter (Article 17/5)', desc: isTR ? 'Başvuru şartlarını sağlayan adaylara, kontenjanın 1/3\'ünü aşmamak kaydıyla ön kabul mektubu düzenlenebilir.' : 'Pre-acceptance letters may be issued to eligible candidates, not exceeding 1/3 of the program quota.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{item.desc}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Evaluation Process - Madde 9 */}
          <AccordionItem value="evaluation" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">{isTR ? 'Başvuruların Değerlendirilmesi (Madde 9)' : 'Application Evaluation (Article 9)'}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
                <li>{isTR 
                  ? 'Başvurular "Uluslararası Öğrenci Kabul Komisyonu" tarafından değerlendirilir. Başvuru yapmak kesin kayıt hakkı kazandırmaz.' 
                  : 'Applications are evaluated by the "International Student Admission Commission." Applying does not guarantee enrollment.'}</li>
                <li>{isTR 
                  ? 'Komisyon değerlendirmeyi kontenjanları dikkate alarak başvuru dosyası üzerinden yapar.' 
                  : 'The Commission evaluates based on the application file, considering available quotas.'}</li>
                <li>{isTR 
                  ? 'Özel yetenek sınavı ile alan bölümlere ek olarak özel yetenek sınavında başarılı olunmalıdır.' 
                  : 'For programs requiring special talent exams, candidates must also pass the talent exam.'}</li>
                <li>{isTR 
                  ? 'Yurtdışında bulunmaksızın uzaktan öğretim yoluyla alınan diplomalar kabul edilmez.' 
                  : 'Diplomas obtained via distance education without being abroad are not accepted.'}</li>
                <li>{isTR 
                  ? 'İlgili ülkede kalınan sürenin örgün eğitimi desteklememesi halinde kayıtlar iptal edilir.' 
                  : 'Enrollments will be cancelled if time spent in the country does not support in-person education.'}</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}

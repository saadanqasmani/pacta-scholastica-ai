import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2, ChevronLeft, ChevronRight, Upload, X, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'University name and location' },
  { id: 2, title: 'Contact Details', description: 'Primary contact and IO managers' },
  { id: 3, title: 'Academic Profile', description: 'Research strengths and accreditations' },
  { id: 4, title: 'Partnership Info', description: 'Eligibility and preferences' },
  { id: 5, title: 'Photos & Media', description: 'University images for your profile' },
];

const REGIONS = ['Europe', 'North America', 'Asia', 'Middle East', 'Africa', 'South America', 'Oceania'];
const UNIVERSITY_TYPES = ['public', 'private', 'research', 'technical', 'liberal arts'];
const SIZES = ['small', 'medium', 'large'];
const MATURITY_LEVELS = ['low', 'medium', 'high'];

const ACCREDITATION_OPTIONS = ['AACSB', 'EQUIS', 'ABET', 'YÖK', 'QS Stars', 'AMBA'];
const LANGUAGE_OPTIONS = ['English', 'French', 'German', 'Spanish', 'Chinese', 'Arabic', 'Turkish'];
const ERASMUS_OPTIONS = ['Erasmus+ KA171', 'Erasmus+ KA131', 'Not Eligible'];
const MEMBERSHIP_OPTIONS = ['UNIMED', 'EURAS', 'EURIE', 'IAU', 'UMAP', 'EUA'];
const DISCIPLINE_OPTIONS = ['STEM', 'Business', 'Humanities', 'Health Sciences', 'Social Sciences', 'Arts', 'Law'];
const COLLABORATION_OPTIONS = ['Joint Research', 'Short-term Programs', 'Dual Degrees', 'Scholar Exchange', 'Virtual Exchange', 'Industry Partnerships'];
const SDG_OPTIONS = ['SDG 4 - Quality Education', 'SDG 9 - Innovation', 'SDG 13 - Climate Action', 'SDG 17 - Partnerships'];
const TARGET_REGIONS = ['Africa', 'Asia', 'Balkans', 'Europe', 'Middle East', 'Latin America'];

interface IOManager {
  name: string;
  email: string;
  phone: string;
}

export default function RegisterUniversity() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Basic Information
  const [universityName, setUniversityName] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [universityType, setUniversityType] = useState('');
  const [size, setSize] = useState('');
  const [maturity, setMaturity] = useState('');
  const [website, setWebsite] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [ranking, setRanking] = useState('');
  
  // Step 2: Contact Details
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [ioManagers, setIoManagers] = useState<IOManager[]>([{ name: '', email: '', phone: '' }]);
  
  // Step 3: Academic Profile
  const [selectedAccreditations, setSelectedAccreditations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [researchStrengths, setResearchStrengths] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [degreeRecognition, setDegreeRecognition] = useState('');
  
  // Step 4: Partnership Info
  const [selectedErasmus, setSelectedErasmus] = useState<string[]>([]);
  const [horizonEligible, setHorizonEligible] = useState(false);
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [selectedCollaborations, setSelectedCollaborations] = useState<string[]>([]);
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([]);
  const [selectedTargetRegions, setSelectedTargetRegions] = useState<string[]>([]);
  const [hasEnglishStaff, setHasEnglishStaff] = useState(false);
  const [hasVisaAssistance, setHasVisaAssistance] = useState(false);
  
  // Step 5: Photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (profile?.university_id) {
      navigate('/');
    }
  }, [user, profile, authLoading, navigate]);

  const toggleArrayValue = (array: string[], setArray: (val: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const addIOManager = () => {
    if (ioManagers.length < 5) {
      setIoManagers([...ioManagers, { name: '', email: '', phone: '' }]);
    }
  };

  const removeIOManager = (index: number) => {
    if (ioManagers.length > 1) {
      setIoManagers(ioManagers.filter((_, i) => i !== index));
    }
  };

  const updateIOManager = (index: number, field: keyof IOManager, value: string) => {
    const updated = [...ioManagers];
    updated[index][field] = value;
    setIoManagers(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).slice(0, 5 - photos.length);
    setPhotos([...photos, ...newFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(universityName && country && region && universityType && size && maturity);
      case 2:
        return !!(contactName && contactEmail && ioManagers[0].name);
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Optional fields
      case 5:
        return true; // Optional fields
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, STEPS.length));
    } else {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description: 'Please fill in all required fields before continuing.',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'Please login to continue.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first
      const uploadedPhotoUrls: string[] = [];
      for (const photo of photos) {
        setIsUploading(true);
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('university-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('university-photos')
          .getPublicUrl(fileName);

        uploadedPhotoUrls.push(publicUrl);
      }
      setPhotoUrls(uploadedPhotoUrls);
      setIsUploading(false);

      // Create university
      const { data: universityData, error: universityError } = await supabase
        .from('universities')
        .insert({
          name: universityName,
          country,
          region,
          type: universityType,
          size,
          internationalization_maturity: maturity,
          website: website || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          ranking: ranking ? parseInt(ranking) : null,
          accreditations: selectedAccreditations.length > 0 ? selectedAccreditations : null,
          research_strengths: researchStrengths.length > 0 ? researchStrengths : null,
        })
        .select()
        .single();

      if (universityError) throw universityError;

      // Update user profile with university_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          university_id: universityData.id,
          phone: contactPhone || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create university profile with extended details
      const { error: uniProfileError } = await supabase
        .from('university_profiles')
        .insert({
          university_id: universityData.id,
          contact_person_name: contactName,
          contact_person_email: contactEmail,
          contact_person_phone: contactPhone || null,
          io_manager_1_name: ioManagers[0]?.name || '',
          io_manager_1_email: ioManagers[0]?.email || null,
          io_manager_1_phone: ioManagers[0]?.phone || null,
          io_manager_2_name: ioManagers[1]?.name || null,
          io_manager_2_email: ioManagers[1]?.email || null,
          io_manager_2_phone: ioManagers[1]?.phone || null,
          io_manager_3_name: ioManagers[2]?.name || null,
          io_manager_3_email: ioManagers[2]?.email || null,
          io_manager_3_phone: ioManagers[2]?.phone || null,
          io_manager_4_name: ioManagers[3]?.name || null,
          io_manager_4_email: ioManagers[3]?.email || null,
          io_manager_4_phone: ioManagers[3]?.phone || null,
          io_manager_5_name: ioManagers[4]?.name || null,
          io_manager_5_email: ioManagers[4]?.email || null,
          io_manager_5_phone: ioManagers[4]?.phone || null,
          languages_of_instruction: selectedLanguages.length > 0 ? selectedLanguages : null,
          degree_recognition: degreeRecognition || null,
          discipline_focus_areas: selectedDisciplines.length > 0 ? selectedDisciplines : null,
          erasmus_eligibility: selectedErasmus.length > 0 ? selectedErasmus : null,
          horizon_europe_eligible: horizonEligible,
          memberships: selectedMemberships.length > 0 ? selectedMemberships : null,
          collaboration_interests: selectedCollaborations.length > 0 ? selectedCollaborations : null,
          sdg_alignment: selectedSDGs.length > 0 ? selectedSDGs : null,
          target_regions: selectedTargetRegions.length > 0 ? selectedTargetRegions : null,
          has_english_speaking_staff: hasEnglishStaff,
          visa_housing_assistance: hasVisaAssistance,
          university_photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
        });

      if (uniProfileError) throw uniProfileError;

      await refreshProfile();

      toast({
        title: 'Registration complete!',
        description: 'Your university has been successfully registered.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'An error occurred during registration.',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Eye className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">University Registration</h1>
          <p className="text-muted-foreground">Complete your institution profile to join IRIS</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Step {currentStep} of {STEPS.length}</span>
            <span className="text-muted-foreground">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  step.id < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.id === currentStep
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uni-name">University Name *</Label>
                  <Input
                    id="uni-name"
                    placeholder="e.g., University of Example"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="e.g., Turkey"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">Institution Type *</Label>
                    <Select value={universityType} onValueChange={setUniversityType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIVERSITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size *</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maturity">Int'l Maturity *</Label>
                    <Select value={maturity} onValueChange={setMaturity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATURITY_LEVELS.map((m) => (
                          <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="founded">Founded Year</Label>
                    <Input
                      id="founded"
                      type="number"
                      placeholder="e.g., 1965"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ranking">World Ranking</Label>
                    <Input
                      id="ranking"
                      type="number"
                      placeholder="e.g., 250"
                      value={ranking}
                      onChange={(e) => setRanking(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Primary Contact Person</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Dr. Jane Smith"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="jane@university.edu"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        placeholder="+1 234 567 8900"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">International Office Managers</h3>
                    <span className="text-xs text-muted-foreground">At least 1 required, up to 5</span>
                  </div>
                  {ioManagers.map((manager, index) => (
                    <div key={index} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Manager {index + 1} {index === 0 && '*'}</span>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIOManager(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          placeholder="Full Name"
                          value={manager.name}
                          onChange={(e) => updateIOManager(index, 'name', e.target.value)}
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={manager.email}
                          onChange={(e) => updateIOManager(index, 'email', e.target.value)}
                        />
                        <Input
                          placeholder="Phone"
                          value={manager.phone}
                          onChange={(e) => updateIOManager(index, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  {ioManagers.length < 5 && (
                    <Button type="button" variant="outline" className="w-full" onClick={addIOManager}>
                      <Plus className="mr-2 h-4 w-4" /> Add Another Manager
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Academic Profile */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Accreditations</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCREDITATION_OPTIONS.map((acc) => (
                      <Badge
                        key={acc}
                        variant={selectedAccreditations.includes(acc) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedAccreditations, setSelectedAccreditations, acc)}
                      >
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Languages of Instruction</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <Badge
                        key={lang}
                        variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedLanguages, setSelectedLanguages, lang)}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Discipline Focus Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {DISCIPLINE_OPTIONS.map((disc) => (
                      <Badge
                        key={disc}
                        variant={selectedDisciplines.includes(disc) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedDisciplines, setSelectedDisciplines, disc)}
                      >
                        {disc}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degree-recognition">Degree Recognition / Compatibility</Label>
                  <Textarea
                    id="degree-recognition"
                    placeholder="e.g., Bologna-compliant, ECTS system..."
                    value={degreeRecognition}
                    onChange={(e) => setDegreeRecognition(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Research Strengths (comma-separated)</Label>
                  <Textarea
                    placeholder="e.g., AI & Machine Learning, Biomedical Engineering..."
                    value={researchStrengths.join(', ')}
                    onChange={(e) => setResearchStrengths(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Partnership Info */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Erasmus+ Eligibility</Label>
                  <div className="flex flex-wrap gap-2">
                    {ERASMUS_OPTIONS.map((opt) => (
                      <Badge
                        key={opt}
                        variant={selectedErasmus.includes(opt) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedErasmus, setSelectedErasmus, opt)}
                      >
                        {opt}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Memberships</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEMBERSHIP_OPTIONS.map((mem) => (
                      <Badge
                        key={mem}
                        variant={selectedMemberships.includes(mem) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedMemberships, setSelectedMemberships, mem)}
                      >
                        {mem}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Collaboration Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLLABORATION_OPTIONS.map((coll) => (
                      <Badge
                        key={coll}
                        variant={selectedCollaborations.includes(coll) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedCollaborations, setSelectedCollaborations, coll)}
                      >
                        {coll}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>SDG Alignment</Label>
                  <div className="flex flex-wrap gap-2">
                    {SDG_OPTIONS.map((sdg) => (
                      <Badge
                        key={sdg}
                        variant={selectedSDGs.includes(sdg) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedSDGs, setSelectedSDGs, sdg)}
                      >
                        {sdg}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Target Regions for Partnerships</Label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_REGIONS.map((reg) => (
                      <Badge
                        key={reg}
                        variant={selectedTargetRegions.includes(reg) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedTargetRegions, setSelectedTargetRegions, reg)}
                      >
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">Horizon Europe Eligible</p>
                      <p className="text-xs text-muted-foreground">TÜBİTAK bilateral programs</p>
                    </div>
                    <Switch checked={horizonEligible} onCheckedChange={setHorizonEligible} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">English-speaking Staff</p>
                      <p className="text-xs text-muted-foreground">Administrative capability</p>
                    </div>
                    <Switch checked={hasEnglishStaff} onCheckedChange={setHasEnglishStaff} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
                    <div>
                      <p className="font-medium text-sm">Visa & Housing Assistance</p>
                      <p className="text-xs text-muted-foreground">Support for exchange students</p>
                    </div>
                    <Switch checked={hasVisaAssistance} onCheckedChange={setHasVisaAssistance} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Photos */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>University Photos</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 5 photos of your campus, facilities, or events. These will be visible to other universities in Partner Discovery.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-video rounded-lg border overflow-hidden">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`University photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>

                {photos.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No photos uploaded yet. You can skip this step and add photos later.
                  </p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading photos...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      Complete Registration <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

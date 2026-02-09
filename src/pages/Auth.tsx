import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signIn, signUp, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (user && profile) {
      if (profile.university_id) {
        navigate('/');
      } else {
        navigate('/register-university');
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setLoginErrors(errors);
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } else {
      toast({ title: t('auth.welcomeBack'), description: t('auth.signInToContinue') });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    const result = signupSchema.safeParse({ fullName: signupFullName, email: signupEmail, password: signupPassword, confirmPassword: signupConfirmPassword });
    if (!result.success) {
      const errors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        errors[path as keyof typeof errors] = err.message;
      });
      setSignupErrors(errors);
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } else {
      toast({ title: t('auth.createAccount'), description: t('auth.verifyEmail') });
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Eye className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('auth.title')}</h1>
          <p className="text-muted-foreground">{t('auth.subtitle')}</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription className="text-center">{t('auth.signInToContinue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input id="login-email" type="email" placeholder="you@university.edu" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={loginErrors.email ? 'border-destructive' : ''} />
                    {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={loginErrors.password ? 'border-destructive' : ''} />
                    {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loggingIn')}</> : t('auth.loginButton')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                    <Input id="signup-name" type="text" placeholder="Dr. Jane Smith" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} className={signupErrors.fullName ? 'border-destructive' : ''} />
                    {signupErrors.fullName && <p className="text-sm text-destructive">{signupErrors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input id="signup-email" type="email" placeholder="you@university.edu" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={signupErrors.email ? 'border-destructive' : ''} />
                    {signupErrors.email && <p className="text-sm text-destructive">{signupErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className={signupErrors.password ? 'border-destructive' : ''} />
                    {signupErrors.password && <p className="text-sm text-destructive">{signupErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
                    <Input id="signup-confirm" type="password" placeholder="••••••••" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className={signupErrors.confirmPassword ? 'border-destructive' : ''} />
                    {signupErrors.confirmPassword && <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.signingUp')}</> : t('auth.signupButton')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

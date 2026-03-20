import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type Step = 'form' | 'otp' | 'forgot' | 'forgot-otp' | 'reset-password';

const Auth = () => {
  const { signUp, signIn, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('form');
  const [showPassword, setShowPassword] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/';
  const isBrandLogin = searchParams.get('role') === 'brand';

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<'user' | 'brand'>('user');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'brand') {
      setRegRole('brand');
      setMode('login');
      setStep('form');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: 'Welcome back!' });
      navigate(redirectTo);
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSendLoginOtp = async () => {
    if (!loginEmail) { toast({ title: 'Enter your email first', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await sendOtp(loginEmail);
      setStep('otp');
      toast({ title: 'OTP sent!', description: 'Check your email for the 6-digit code.' });
    } catch (err: any) {
      toast({ title: 'Failed to send OTP', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleVerifyLoginOtp = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(loginEmail, otpCode);
      toast({ title: 'Welcome back!' });
      navigate(redirectTo);
    } catch (err: any) {
      toast({ title: 'Invalid OTP', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user: createdUser, session: createdSession } = await signUp(regEmail, regPassword, regName, regRole);

      if (createdSession) {
        toast({ title: 'Account created and signed in', description: 'You are now logged in.' });
        navigate(redirectTo);
        return;
      }

      try {
        await signIn(regEmail, regPassword);
        toast({ title: 'Account created and signed in', description: 'You are now logged in.' });
        navigate(redirectTo);
      } catch (signInError: any) {
        if (createdUser) {
          toast({ title: 'Account created', description: 'Please verify your email link to finish sign-in.', variant: 'warning' });
          setMode('login');
          setStep('form');
        } else {
          throw signInError;
        }
      }
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleVerifyRegOtp = async () => {
    if (regOtpCode.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: regEmail, token: regOtpCode, type: 'signup' });
      if (error) throw error;
      toast({ title: 'Account verified!', description: 'Welcome aboard!' });
      navigate(redirectTo);
    } catch (err: any) {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  // Forgot password: send OTP
  const handleForgotSendOtp = async () => {
    toast({ title: 'Forgot password is temporarily disabled', description: 'Password recovery by email is turned off for now.', variant: 'warning' });
  };

  // Forgot password: verify OTP
  const handleForgotVerifyOtp = async () => {
    if (forgotOtp.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(forgotEmail, forgotOtp);
      setStep('reset-password');
      toast({ title: 'OTP verified!', description: 'Now set your new password.' });
    } catch (err: any) {
      toast({ title: 'Invalid OTP', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  // Reset password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      setStep('form');
      setMode('login');
      setForgotEmail(''); setForgotOtp(''); setNewPassword('');
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const resetToForm = () => {
    setStep('form');
    setOtpCode('');
    setRegOtpCode('');
    setForgotOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-border/40 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* ===== LOGIN ===== */}
          {mode === 'login' && step === 'form' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-[#5f259f]">
                  {isBrandLogin ? 'Brand Login' : 'Welcome Back'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isBrandLogin ? 'Sign in to manage your brand account' : 'Sign in with your email and password'}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Email</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="mt-1.5" placeholder="your@email.com" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Password</Label>
                  <div className="relative mt-1.5">
                    <Input type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-1 text-right">
                    <span className="text-xs text-muted-foreground">Forgot password currently disabled (no email link).</span>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#5f259f] hover:bg-[#4a1f78] text-white font-semibold py-2.5">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {!isBrandLogin && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('register'); resetToForm(); }} className="font-semibold text-[#5f259f] hover:underline">Sign Up</button>
                </p>
              )}

              <div className="flex items-center justify-center gap-3 mt-4 text-xs">
                {isBrandLogin ? (
                  <Link to="/auth" className="text-primary font-medium hover:underline">User Login</Link>
                ) : (
                  <Link to="/auth?role=brand" className="text-primary font-medium hover:underline">Brand Login</Link>
                )}
                <span className="text-muted-foreground">•</span>
                <Link to="/admin/login" className="text-primary font-medium hover:underline">Admin Login</Link>
              </div>
              <div className="mt-4 text-center">
                <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
                  Back to Website
                </Link>
              </div>
            </>
          )}

          {/* ===== LOGIN OTP VERIFY ===== */}
          {mode === 'login' && step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-foreground">Enter OTP</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{loginEmail}</span>
                </p>
              </div>
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyLoginOtp} disabled={loading || otpCode.length !== 6} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <div className="flex items-center justify-between mt-4">
                <button onClick={resetToForm} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back</button>
                <button onClick={handleSendLoginOtp} className="text-sm font-medium text-primary hover:underline">Resend OTP</button>
              </div>
            </>
          )}

          {/* ===== FORGOT PASSWORD - Enter Email ===== */}
          {step === 'forgot' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-foreground">Forgot Password</h1>
                <p className="text-sm text-muted-foreground mt-1">We'll send a 6-digit code to your email. Use it to reset and then sign in with your new password.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Email</Label>
                  <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="mt-1.5" placeholder="your@email.com" />
                </div>
                <Button onClick={handleForgotSendOtp} disabled={loading || !forgotEmail} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
              <button onClick={() => { setStep('form'); setMode('login'); }} className="mt-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </button>
            </>
          )}

          {/* ===== FORGOT PASSWORD - Verify OTP ===== */}
          {step === 'forgot-otp' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-foreground">Verify OTP</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter the code sent to <span className="font-medium text-foreground">{forgotEmail}</span></p>
              </div>
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={forgotOtp} onChange={setForgotOtp}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleForgotVerifyOtp} disabled={loading || forgotOtp.length !== 6} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => setStep('forgot')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back</button>
                <button onClick={handleForgotSendOtp} className="text-sm font-medium text-primary hover:underline">Resend OTP</button>
              </div>
            </>
          )}

          {/* ===== RESET PASSWORD ===== */}
          {step === 'reset-password' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-foreground">New Password</h1>
                <p className="text-sm text-muted-foreground mt-1">Set your new password</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">New Password</Label>
                  <div className="relative mt-1.5">
                    <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} className="pr-10" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleResetPassword} disabled={loading || newPassword.length < 6} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </>
          )}

          {/* ===== REGISTER ===== */}
          {mode === 'register' && step === 'form' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-[#5f259f]">Create Account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {regRole === 'brand' ? 'Register as a Brand' : 'Sign up for a new account'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">After registration, verify OTP and then sign in to continue.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Full Name</Label>
                  <Input value={regName} onChange={(e) => setRegName(e.target.value)} required className="mt-1.5" placeholder="Your full name" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Email</Label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="mt-1.5" placeholder="your@email.com" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Password</Label>
                  <div className="relative mt-1.5">
                    <Input type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} className="pr-10" />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">I am a</Label>
                  <div className="mt-2 flex gap-3">
                    <Button type="button" variant={regRole === 'user' ? 'default' : 'outline'} size="sm" onClick={() => setRegRole('user')} className="flex-1">User (Buyer)</Button>
                    <Button type="button" variant={regRole === 'brand' ? 'default' : 'outline'} size="sm" onClick={() => setRegRole('brand')} className="flex-1">Brand (Seller)</Button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                  {loading ? 'Creating account...' : 'Create Account & Send OTP'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); resetToForm(); }} className="font-semibold text-primary hover:underline">Sign In</button>
              </p>
            </>
          )}

          {/* ===== REGISTER OTP VERIFY ===== */}
          {mode === 'register' && step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans] text-foreground">Verify Email</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-digit code sent to <span className="font-medium text-foreground">{regEmail}</span>
                </p>
              </div>
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={regOtpCode} onChange={setRegOtpCode}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyRegOtp} disabled={loading || regOtpCode.length !== 6} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              <div className="flex items-center justify-between mt-4">
                <button onClick={resetToForm} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back</button>
                <button onClick={handleRegister} className="text-sm font-medium text-primary hover:underline">Resend OTP</button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

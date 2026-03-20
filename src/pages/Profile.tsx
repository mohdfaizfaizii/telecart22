import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, UserCircle2 } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, role, fullName, loading, updateProfile, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(fullName || '');
  }, [fullName]);

  useEffect(() => {
    if (!loading && (!user || role === 'admin')) {
      navigate(role === 'admin' ? '/admin/dashboard' : '/auth');
    }
  }, [loading, navigate, role, user]);

  if (!user || role === 'admin') {
    return null;
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(name);
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update profile', description: err.message, variant: 'destructive' });
    }
    setSavingProfile(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update password', description: err.message, variant: 'destructive' });
    }
    setSavingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Website
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <UserCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{fullName || user.email || 'Account'}</CardTitle>
              <CardDescription>
                {role === 'brand' ? 'Brand Account' : 'User Account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Type</p>
                <p className="font-medium">{role === 'brand' ? 'Brand' : 'User'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your display name.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1.5"
                    />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Choose a new password for your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        className="pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      className="mt-1.5"
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

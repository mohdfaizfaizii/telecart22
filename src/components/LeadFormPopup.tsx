import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface LeadFormPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  sourceButton: string;
  googleFormUrl?: string | null;
}

const LeadFormPopup = ({ open, onOpenChange, productId, productName, sourceButton, googleFormUrl }: LeadFormPopupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If Google Form is approved, redirect to it
  useEffect(() => {
    if (googleFormUrl && open) {
      window.open(googleFormUrl, '_blank');
      onOpenChange(false);
    }
  }, [googleFormUrl, open, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('leads' as any).insert({
      product_id: productId,
      user_id: user.id,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim() || null,
      purpose: purpose.trim() || null,
      source_button: sourceButton,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Inquiry submitted!', description: `Your request for ${productName} has been sent.` });
      setName(''); setMobile(''); setPurpose('');
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Plus_Jakarta_Sans]">Get a Quote — {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Mobile Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
          </div>
          <div>
            <Label>Company Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
          <div>
            <Label>Purpose of Inquiry</Label>
            <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Tell us what you're looking for..." rows={3} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormPopup;

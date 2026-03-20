import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const WriteReview = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('products').select('id, company_name').eq('status', 'approved').eq('is_visible', true)
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  const handleSubmit = async () => {
    if (!user || !selectedProduct || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: selectedProduct,
      user_id: user.id,
      rating,
      review_text: reviewText,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted for moderation' });
      setRating(0); setReviewText(''); setSelectedProduct('');
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-20">
          <p className="mb-4 text-lg text-muted-foreground">Please sign in to write a review.</p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="font-[Plus_Jakarta_Sans]">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-8 w-8 cursor-pointer transition ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted hover:text-yellow-300'}`} />
                </button>
              ))}
            </div>
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your detailed experience..." rows={5} />
            <Button onClick={handleSubmit} disabled={submitting || !selectedProduct || rating === 0} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default WriteReview;

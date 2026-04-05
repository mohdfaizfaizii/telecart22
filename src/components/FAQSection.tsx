import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const buyerFaqs = [
  {
    q: "What's the process to buy software on Book Demo?",
    a: 'Browse software, compare features and pricing, request a demo if needed, and complete your purchase directly through the platform.',
  },
  {
    q: 'Are the software genuine and licensed?',
    a: 'Yes. All software listed on Book Demo is verified and provided by authorized vendors only.',
  },
  {
    q: 'Can I request a personalized demo before purchase?',
    a: 'Yes, many software providers offer demos. Look for the "Request Demo" option on the product page.',
  },
  {
    q: 'What about after-sales support?',
    a: 'After purchase, support is provided directly by the software vendor as per their support policy.',
  },
  {
    q: 'Is Book Demo legit?',
    a: 'Absolutely. Book Demo works only with verified brands and ensures transparency and security for buyers.',
  },
];

const sellerFaqs = [
  {
    q: 'How do I list my software on Book Demo?',
    a: 'Sign up as a Brand, submit your software details, and wait for admin approval before going live.',
  },
  {
    q: 'Is there a listing fee?',
    a: 'Currently, Book Demo does not charge any upfront listing fees.',
  },
  {
    q: 'Can I update my product details later?',
    a: 'Yes, you can edit your product anytime. Updates will require admin re-approval.',
  },
  {
    q: 'How do I get customer leads?',
    a: 'Interested buyers can request demos or contact you directly through your product page.',
  },
  {
    q: 'How does payment work?',
    a: 'Payments are processed securely, and payouts are handled as per Book Demo’s vendor policy.',
  },
];

const FAQSection = () => {
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');

  const faqs = activeTab === 'buyers' ? buyerFaqs : sellerFaqs;

  return (
    <section className="bg-[#E6F2FF] py-20">
      <div className="container mx-auto px-6 md:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>

        <div className="mb-12 flex justify-center">
          <div className="flex rounded-full bg-gray-200 p-1">

            {/* Buyers Tab */}
            <Button
              size="sm"
              onClick={() => setActiveTab('buyers')}
              className={`rounded-full px-6 transition-all ${
                activeTab === 'buyers'
                  ? 'bg-black text-white hover:bg-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              For Buyers
            </Button>

            {/* Sellers Tab */}
            <Button
              size="sm"
              onClick={() => setActiveTab('sellers')}
              className={`rounded-full px-6 transition-all ${
                activeTab === 'sellers'
                  ? 'bg-black text-white hover:bg-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              For Sellers
            </Button>

          </div>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

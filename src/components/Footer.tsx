import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-lg font-bold">Book Demo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The leading B2B software marketplace for enterprise solutions.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Product</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/software" className="hover:text-foreground">Browse Software</Link>
            <Link to="/#solutions" className="hover:text-foreground">Our Solution</Link>
            <Link to="/write-review" className="hover:text-foreground">Write a Review</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>About Us</span>
            <span>Contact</span>
            <span>Privacy Policy</span>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Help Center</span>
            <span>FAQs</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        © 2026 Book Demo. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

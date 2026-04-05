import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import ProfileDropdown from './ProfileDropdown';

const solutionsItems = [
  { name: 'For Brands', href: '/business/brands' },
  { name: 'For Sales', href: '/business/sales' },
  { name: 'For Service', href: '/business/service' },
  { name: 'For Investment', href: '/business/investment' },
  { name: 'For Partnership', href: '/business/partnership' },
];

const navLinks = [
  { label: 'Software', href: '/software' },
  { label: 'Solutions', href: '/business/brands' },
  { label: 'Write a Review', href: '/write-review' },
];

const Header = () => {
  const { user, role, fullName, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [softwareItems, setSoftwareItems] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const sb = supabase as any;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await sb
          .from('categories')
          .select('id, name')
          .order('display_order');
        if (data && Array.isArray(data)) {
          setSoftwareItems(data.map((cat: any) => ({ name: cat.name, id: cat.id })));
        }
      } catch {
        setSoftwareItems([
          { name: 'CRM', id: '1' },
          { name: 'ERP', id: '2' },
          { name: 'Marketing', id: '3' },
          { name: 'AI Tools', id: '4' },
          { name: 'Accounting', id: '5' },
        ]);
      }
    };
    fetchCategories();
  }, [sb]);

  const handleCategoryClick = () => {
    setOpenMenu(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <div className="w-11 h-10 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-bold text-2xl leading-none">
            B
          </div>
          <span className="ml-2 font-bold text-2xl text-[#5f259f] font-[Plus_Jakarta_Sans]">
            BookDemo
          </span>
        </Link>

        {/* Desktop mega menu */}
        <NavigationMenu
          ref={menuRef}
          className="hidden md:flex"
          value={openMenu ?? undefined}
          onValueChange={(v) => v && setOpenMenu(v)}
        >
          <NavigationMenuList className="gap-8">
            <NavigationMenuItem onMouseEnter={() => setOpenMenu('software')}>
              <NavigationMenuTrigger className="text-sm md:text-base font-light uppercase tracking-wide bg-transparent cursor-default">
                Software
              </NavigationMenuTrigger>
              <NavigationMenuContent
                onMouseLeave={() => setOpenMenu(null)}
                className="overflow-hidden rounded-xl border border-white/50 bg-white/90 p-0 shadow-2xl backdrop-blur-xl"
              >
                <div className="h-1 bg-[#6D28D9]" />
                <div className="flex w-[760px]">
                  <div className="w-[240px] bg-[#EDE9FE] p-6 flex items-center">
                    <p className="text-[#5B21B6] font-semibold text-lg">For Businesses</p>
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      {softwareItems.map((item) => (
                        <Link
                          key={item.id}
                          to={`/software?category=${item.id}`}
                          onClick={handleCategoryClick}
                          className="flex gap-3 rounded-lg p-3 hover:bg-white/70"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-primary">PG</div>
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Link to="/software" onClick={handleCategoryClick} className="text-xs text-primary hover:underline">See All</Link>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem onMouseEnter={() => setOpenMenu('solutions')}>
              <NavigationMenuTrigger className="text-sm md:text-base font-light uppercase tracking-wide bg-transparent cursor-default">
                Our Solutions
              </NavigationMenuTrigger>
              <NavigationMenuContent
                onMouseLeave={() => setOpenMenu(null)}
                className="overflow-hidden rounded-xl border border-white/50 bg-white/90 p-0 shadow-2xl backdrop-blur-xl"
              >
                <div className="h-1 bg-[#6D28D9]" />
                <div className="flex w-[760px]">
                  <div className="w-[240px] bg-[#EDE9FE] p-6 flex items-center">
                    <p className="text-[#5B21B6] font-semibold text-lg">Solutions</p>
                  </div>
                  <div className="flex-1 p-6 grid grid-cols-2 gap-4">
                    {solutionsItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex gap-3 rounded-lg p-3 hover:bg-white/70"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-primary">S</div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Business use cases</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/write-review" className="text-sm md:text-base font-light uppercase tracking-wide">
                Write a Review
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <ProfileDropdown />
          ) : (
            <>
              <Link to="/admin/login">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Shield className="h-4 w-4" /> Admin
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5">
                <Shield className="h-4 w-4" /> Admin Login
              </Button>
            </Link>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>Sign Out</Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

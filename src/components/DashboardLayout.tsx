import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Menu, X, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface SidebarItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const DashboardLayout = ({ title, items, activeTab, onTabChange, children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-[hsl(220,25%,12%)] text-white fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-white/10">
          <h2 className="text-sm font-bold tracking-wide text-primary">{title}</h2>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Home link */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>Home Page</span>
          </button>
          <div className="border-b border-white/10 my-2" />
          {items.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[hsl(220,25%,12%)] px-4 py-3">
        <h2 className="text-sm font-bold text-primary">{title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-white/70 hover:text-white">
            <Home className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[hsl(220,25%,12%)] text-white flex flex-col">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-primary">{title}</h2>
              <button onClick={() => setMobileOpen(false)} className="text-white/70"><X className="h-4 w-4" /></button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <button
                onClick={() => { navigate('/'); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>Home Page</span>
              </button>
              <div className="border-b border-white/10 my-2" />
              {items.map((item) => {
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => { onTabChange(item.value); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="h-4 w-4" /><span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-56 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur px-6 py-4 mt-0 md:mt-0" style={{ marginTop: 0 }}>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium">{profileName}</span>
          </div>
        </header>
        <div className="p-4 md:p-6 mt-12 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

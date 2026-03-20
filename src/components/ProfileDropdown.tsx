import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const ProfileDropdown = () => {
  const { user, role, fullName, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };

  const initials =
    fullName
      ? fullName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
      : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-[#5f259f] text-white flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <span className="hidden sm:inline text-sm font-medium">
          {fullName || user.email || 'User'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-md border bg-white shadow-md z-50">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold truncate">
              {fullName || user.email || 'User'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {role === 'admin'
                ? 'Administrator'
                : role === 'brand'
                ? 'Brand Account'
                : 'User Account'}
            </p>
          </div>

          {role !== 'admin' && (
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
          )}

          {(role === 'admin' || role === 'brand') && (
            <Link
              to={role === 'admin' ? '/admin/dashboard' : '/brand/dashboard'}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Shield className="h-4 w-4" />
              {role === 'admin' ? 'Admin Panel' : 'Dashboard'}
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;


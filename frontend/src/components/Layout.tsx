import { ReactNode } from 'react';
import { FileText, ClipboardCheck, History, Settings, ShieldCheck, HelpCircle, LogOut, UploadCloud, Search, Bell, Home } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'officer';

  const officerNavItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Dashboard', icon: FileText, path: '/officer/tenders' },
  ];

  const bidderNavItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Browse Tenders', icon: Search, path: '/bidder/tenders' },
    { name: 'My Applications', icon: FileText, path: '/bidder/applications' },
    { name: 'My Vault', icon: UploadCloud, path: '/bidder/submit' },
  ];

  const navItems = role === 'officer' ? officerNavItems : bidderNavItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
          <span className="font-bold text-xl text-slate-800 hidden sm:block">GemOne</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/${role}/notifications`)} className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-700">{user.name}</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{role}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 rounded-full transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileCheck, LayoutDashboard, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

interface NavbarProps {
  user?: {
    role: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  } | null;
}

const Navbar = ({ user: userProp }: NavbarProps) => {
  const [user, setUser] = useState(userProp);

  // Auto-load user from localStorage if not provided as prop
  useEffect(() => {
    if (userProp !== undefined) {
      setUser(userProp);
    } else {
      // If no prop provided, load from localStorage
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  }, [userProp]);

  // Also check localStorage on mount in case prop wasn't provided
  useEffect(() => {
    if (!userProp) {
      const currentUser = getCurrentUser();
      if (currentUser && !user) {
        setUser(currentUser);
      }
    }
  }, []);

  // Listen for storage changes (e.g., login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check on focus in case user logged in/out in another tab
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Get display name: first_name + last_name, or fallback to username
  const getUserDisplayName = () => {
    if (!user) return null;
    // Try first_name + last_name
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    // Try first_name only
    if (user.first_name) return user.first_name;
    // Try username
    if (user.username) return user.username;
    // Try email as last resort
    if ((user as any).email) return (user as any).email;
    // Default fallback
    return "User";
  };

  const displayName = getUserDisplayName();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center transition-smooth group-hover:scale-105 shadow-lg shadow-primary/25">
              <FileCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Problem Solver</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{displayName || "User"}</span>
              </div>
              <Link to="/company/dashboard">
                <Button variant="outline" className="transition-smooth hover:bg-muted">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/logout">
                <Button className="gradient-primary transition-smooth hover:opacity-90">
                  Logout
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="transition-smooth">Login</Button>
              </Link>
              <Link to="/auth?register=true">
                <Button className="gradient-primary transition-smooth hover:opacity-90">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

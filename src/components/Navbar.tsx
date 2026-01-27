import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userRole?: "student" | "recruiter" | "admin" | null;
}

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/opportunities", label: "Opportunities" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/portfolio", label: "Portfolio" },
];

const recruiterLinks = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/post", label: "Post Opportunity" },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
];

export function Navbar({ userRole }: NavbarProps) {
  const location = useLocation();
  const links = userRole === "student" 
    ? studentLinks 
    : userRole === "recruiter" 
    ? recruiterLinks 
    : userRole === "admin" 
    ? adminLinks 
    : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo showSubtitle={!!userRole} />
          
          {userRole && (
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userRole ? (
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/login">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

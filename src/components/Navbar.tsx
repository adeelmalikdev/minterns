import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  userRole?: "student" | "recruiter" | "admin" | null;
}

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/opportunities", label: "Opportunities" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/tasks", label: "Tasks" },
  { href: "/student/portfolio", label: "Portfolio" },
];

const recruiterLinks = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/post", label: "Post Opportunity" },
  { href: "/recruiter/submissions", label: "Reviews" },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
];

export function Navbar({ userRole }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  
  const links = userRole === "student" 
    ? studentLinks 
    : userRole === "recruiter" 
    ? recruiterLinks 
    : userRole === "admin" 
    ? adminLinks 
    : [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={userRole ? `/${userRole}/dashboard` : "/"}>
            <Logo showSubtitle={!!userRole} />
          </Link>
          
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {profile?.full_name || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  {profile?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

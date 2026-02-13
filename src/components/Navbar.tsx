import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, MessageSquare, Menu, X, Settings } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavbarProps {
  userRole?: "student" | "recruiter" | "admin" | null;
}

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/opportunities", label: "Opportunities" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/tasks", label: "Tasks" },
  { href: "/student/portfolio", label: "Portfolio" },
  { href: "/student/profile", label: "Profile" },
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
  const unreadCount = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  
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

  const messagesPath = userRole === "student" 
    ? "/student/messages" 
    : userRole === "recruiter" 
    ? "/recruiter/messages" 
    : null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={userRole ? `/${userRole}/dashboard` : "/"}>
            <Logo />
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

        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          {userRole && (
            <NotificationBell userRole={userRole} />
          )}

          {/* Messages Icon with Badge */}
          {messagesPath && (
            <Link
              to={messagesPath}
              className={cn(
                "relative p-2 rounded-md transition-colors hover:bg-muted",
                location.pathname === messagesPath && "bg-muted"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Link>
          )}

          {userRole ? (
            <>
              {/* Desktop user dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
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

              {/* Mobile hamburger menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 mt-6">
                    {links.map((link) => (
                      <Button
                        key={link.href}
                        variant={location.pathname === link.href ? "secondary" : "ghost"}
                        className="justify-start"
                        onClick={() => {
                          navigate(link.href);
                          setMobileOpen(false);
                        }}
                      >
                        {link.label}
                      </Button>
                    ))}
                    <div className="border-t my-2" />
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        handleSignOut();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
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

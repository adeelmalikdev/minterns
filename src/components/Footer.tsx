import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const { user, role } = useAuth();

  const studentLinks = user && role === "student" ? [
    { label: "Browse Opportunities", href: "/student/opportunities" },
    { label: "Build Portfolio", href: "/student/portfolio" },
  ] : [
    { label: "Browse Opportunities", href: "/login" },
    { label: "Build Portfolio", href: "/login" },
  ];

  const recruiterLinks = user && role === "recruiter" ? [
    { label: "Post Opportunities", href: "/recruiter/post" },
    { label: "Find Talent", href: "/recruiter/dashboard" },
  ] : [
    { label: "Post Opportunities", href: "/login?role=recruiter" },
    { label: "Find Talent", href: "/login?role=recruiter" },
  ];

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4">μ-intern</h3>
            <p className="text-sm text-background/70">
              Empowering students with micro-internship opportunities
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Students</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {studentLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-background">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Recruiters</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {recruiterLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-background">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/feedback" className="hover:text-background">
                  Give Feedback
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <Link to="/about" className="hover:text-background">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-background">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          © 2026 μ-intern Platform | All Rights Reserved
        </div>
      </div>
    </footer>
  );
}

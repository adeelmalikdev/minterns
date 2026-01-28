import { Link } from "react-router-dom";
import { ArrowRight, Users, Building2, CheckCircle, TrendingUp, Target, BookOpen, Award, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { icon: Users, label: "Students" },
  { icon: Building2, label: "Recruiters" },
  { icon: CheckCircle, label: "Opportunities" },
  { icon: TrendingUp, label: "Real Experience" },
];

const howItWorks = [
  {
    step: 1,
    icon: Users,
    title: "Create Your Profile",
    description: "Build your portfolio with skills, projects, and achievements",
  },
  {
    step: 2,
    icon: Building2,
    title: "Browse Opportunities",
    description: "Explore micro-internships tailored to CS/IT/SE students",
  },
  {
    step: 3,
    icon: Award,
    title: "Gain Experience",
    description: "Complete tasks, get feedback, and earn certificates",
  },
];

const benefits = [
  {
    icon: Target,
    title: "Real Projects",
    description: "Work on actual industry tasks that matter",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description: "Get verified certificates for your portfolio",
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Complete micro-internships around your classes",
  },
];

const features = [
  { icon: Target, label: "Opportunities" },
  { icon: BookOpen, label: "Learning" },
  { icon: Award, label: "Certificates" },
  { icon: Clock, label: "Flexible" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                Build Your Portfolio with{" "}
                <span className="text-accent">Micro-Internships</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Connect with industry recruiters, gain real-world experience, and showcase your skills through short-term, impactful projects.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="gap-2">
                    Start Your Journey
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login?role=recruiter">
                  <Button variant="outline" size="lg">
                    For Recruiters
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in">
              {features.map((feature) => (
                <Card key={feature.label} className="shadow-card hover:shadow-card-hover transition-all">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <feature.icon className="h-8 w-8 text-primary mb-3" />
                    <span className="font-medium text-foreground">{feature.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-b">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to kickstart your professional journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <Card key={item.step} className="shadow-card hover:shadow-card-hover transition-all relative">
                <div className="absolute -top-3 left-6">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <CardContent className="p-6 pt-8">
                  <item.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose μ-intern?</h2>
            <p className="text-muted-foreground">
              Built specifically for IIUI SE/IT/CS students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6 text-center">
                  <benefit.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-cta py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Gain Real Experience?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join IIUI SE/IT/CS students in building professional portfolios through micro-internships
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2 bg-background text-foreground hover:bg-background/90">
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">μ-intern</h3>
              <p className="text-sm text-background/70">
                Empowering IIUI students with micro-internship opportunities
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">Browse Opportunities</a></li>
                <li><a href="#" className="hover:text-background">Build Portfolio</a></li>
                <li><a href="#" className="hover:text-background">Get Certified</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">Post Opportunities</a></li>
                <li><a href="#" className="hover:text-background">Find Talent</a></li>
                <li><a href="#" className="hover:text-background">Give Feedback</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#" className="hover:text-background">About IIUI</a></li>
                <li><a href="#" className="hover:text-background">Contact Us</a></li>
                <li><a href="#" className="hover:text-background">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
            © 2026 μ-intern Platform | All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}

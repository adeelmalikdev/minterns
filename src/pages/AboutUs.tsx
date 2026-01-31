import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Users, Award } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">About μ-intern</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            μ-intern is a micro-internship platform designed to bridge the gap between students 
            and industry experience. We believe that every student deserves the opportunity to 
            gain real-world skills before entering the job market.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
                <p className="text-sm text-muted-foreground">
                  Empowering students with practical experience through short-term, meaningful projects.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Our Community</h3>
                <p className="text-sm text-muted-foreground">
                  Connecting talented students with industry recruiters and mentors.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Our Promise</h3>
                <p className="text-sm text-muted-foreground">
                  Verified certificates and feedback to build your professional portfolio.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-foreground mb-4">Why Micro-Internships?</h2>
            <p className="text-muted-foreground mb-4">
              Traditional internships often require long-term commitments that can conflict with 
              academic schedules. Micro-internships offer a flexible alternative—short-term projects 
              that can be completed in days or weeks, allowing students to gain experience without 
              sacrificing their education.
            </p>
            <p className="text-muted-foreground">
              Each completed micro-internship adds to your portfolio, demonstrates your skills to 
              future employers, and provides valuable industry connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

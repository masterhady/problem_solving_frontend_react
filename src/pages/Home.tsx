import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { Target, Zap, TrendingUp, ArrowRight, Code, CheckCircle2, BarChart2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";

const Home = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar would need update too, but for now we focus on page content */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Code className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Problem Solver</span>
          </Link>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth?register=true">
                  <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/company/dashboard">
                <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">New: Advanced LeetCode Analysis</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Master Your Team's <br />
              <span className="text-primary">Problem Solving</span> Skills
            </h1>

            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              The ultimate platform for engineering leaders to analyze, track, and improve their team's algorithmic capabilities through detailed LeetCode insights.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to={user ? "/company/dashboard" : "/auth?register=true"}>
                <Button size="lg" className="bg-primary hover:bg-primary-dark text-white text-lg px-8 h-14 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  Start Analyzing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">Why Problem Solver?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for modern engineering teams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            <FeatureCard
              icon={BarChart2}
              title="Deep Analytics"
              description="Get granular insights into problem-solving patterns, topic strengths, and areas for improvement."
            />
            <FeatureCard
              icon={Target}
              title="Goal Tracking"
              description="Set and monitor weekly coding goals to keep your team sharp and interview-ready."
            />
            <FeatureCard
              icon={Zap}
              title="AI Insights"
              description="Leverage AI to generate personalized improvement plans based on coding history."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <h2 className="text-4xl font-bold mb-4 relative z-10">Ready to Elevate Your Team?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">
              Join forward-thinking companies using Problem Solver to build world-class engineering teams.
            </p>
            <Link to="/auth?register=true" className="relative z-10">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-white text-lg px-12 h-14 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Problem Solver</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Problem Solver. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { BarChart3, TrendingUp, BarChart, Target } from "lucide-react";
import { useIndexedDbStorage } from "@/hooks/use-indexed-db-storage";

const Index = () => {
  const { files } = useIndexedDbStorage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            RCA & Bid Simulation Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Advanced analytics and bid simulation tools for data-driven decision making
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Link to="/csv-upload">
            <Card className="shadow-card hover:shadow-elegant transition-all animate-slide-up cursor-pointer hover:scale-[1.02] h-full">
              <CardHeader>
                <div className="p-3 bg-primary rounded-lg w-fit shadow-lg">
                  <BarChart className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">File Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload and process CSV files with automatic data validation and parsing
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/data-aggregation">
            <Card className="shadow-card hover:shadow-elegant transition-all animate-slide-up [animation-delay:100ms] cursor-pointer hover:scale-[1.02] h-full">
              <CardHeader>
                <div className="p-3 bg-accent rounded-lg w-fit shadow-lg">
                  <BarChart3 className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle className="text-lg">Data Aggregation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Intelligent data aggregation with real-time metrics and performance indicators
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/rca-analysis">
            <Card className="shadow-card hover:shadow-elegant transition-all animate-slide-up [animation-delay:200ms] cursor-pointer hover:scale-[1.02] h-full">
              <CardHeader>
                <div className="p-3 bg-success rounded-lg w-fit shadow-lg">
                  <TrendingUp className="h-6 w-6 text-success-foreground" />
                </div>
                <CardTitle className="text-lg">RCA Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Root Cause Analysis with advanced pattern recognition and insights
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/bid-simulation">
            <Card className="shadow-card hover:shadow-elegant transition-all animate-slide-up [animation-delay:300ms] cursor-pointer hover:scale-[1.02] h-full">
              <CardHeader>
                <div className="p-3 bg-warning rounded-lg w-fit shadow-lg">
                  <Target className="h-6 w-6 text-warning-foreground" />
                </div>
                <CardTitle className="text-lg">Bid Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Predictive bid simulation with scenario modeling and optimization
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import RcaAnalysisWidget from '@/components/rca/RcaAnalysisWidget';

const RcaAnalysis = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="mx-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="shadow-card hover:shadow-elegant transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Bids RCA Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Root Cause Analysis with advanced pattern recognition and insights
          </p>
        </div>

        {/* RCA Analysis Widget */}
        <RcaAnalysisWidget />
      </div>
    </div>
  );
};

export default RcaAnalysis;
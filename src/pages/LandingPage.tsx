import React from 'react';
import { 
  Atom, 
  BookOpen, 
  Bot, 
  CheckSquare, 
  BarChart2, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Award,
  Zap,
  HelpCircle
} from 'lucide-react';
import { NavigationTab } from '../types';
import { Button, Card, Badge } from '../components/ui';

interface LandingPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div id="public-landing-page" className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50 text-slate-900 animate-in fade-in duration-200">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/40 to-slate-50 border-b border-slate-200/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        
        {/* Subtle decorative background circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-32 right-10 w-72 h-72 bg-teal-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-powered Class 6 CBSE Science Micro-Tutor</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading text-slate-900 tracking-tight leading-[1.15]">
              Learn Science. <span className="text-emerald-700">Ask Questions.</span> <br className="hidden sm:inline" />
              Practice. Track Progress.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              A structured, child-friendly learning companion designed specifically for Class 6 CBSE students. Master science concepts step-by-step with interactive lessons, instant AI tutor help, and practice tests.
            </p>
          </div>

          {/* Primary Call to Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button
              id="landing-signup-cta"
              variant="primary"
              size="lg"
              fullWidth
              icon={UserPlus}
              onClick={() => onNavigate('signup')}
              className="shadow-sm hover:shadow-md transition-shadow font-bold text-base py-3.5"
            >
              Sign Up for Free
            </Button>
            
            <Button
              id="landing-login-cta"
              variant="outline"
              size="lg"
              fullWidth
              icon={LogIn}
              onClick={() => onNavigate('login')}
              className="bg-white font-bold text-base py-3.5"
            >
              Student Login
            </Button>
          </div>

          {/* Trust points */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Aligned with NCERT & CBSE Syllabus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Safe & Age-Appropriate AI Tutor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Free Student Access</span>
            </div>
          </div>

        </div>
      </section>

      {/* Major Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="default" size="md">Core Capabilities</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Everything you need to master Class 6 Science
          </h2>
          <p className="text-sm text-slate-600">
            Science Buddy brings clarity to complex scientific concepts through structured learning modules and active practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Capability 1: Learn */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                1. Step-by-Step Learning
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand Class 6 Science topics step by step with clear explanations, structured concept cards, diagrams, and audio read-aloud support.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
              <span>NCERT Chapter Breakdown</span>
            </div>
          </Card>

          {/* Capability 2: AI Tutor */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                2. 24/7 AI Science Tutor
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask questions anytime and get friendly, child-safe, personalized explanations using simple real-world analogies and guided thought prompts.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-teal-700">
              <span>Socratic Explanation Mode</span>
            </div>
          </Card>

          {/* Capability 3: Practice & Exams */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                3. Practice & Exams
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test your understanding with topic quick checks, NCERT exemplar questions, and timed chapter exams with instant step-by-step solutions.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-700">
              <span>Instant Scoring & Feedback</span>
            </div>
          </Card>

          {/* Capability 4: Track Progress */}
          <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                4. Progress Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand your strengths and pinpoint areas that need more practice. Track mastery percentage, quiz history, and learning streaks.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-700">
              <span>Mastery Analytics & Badges</span>
            </div>
          </Card>

        </div>
      </section>

      {/* Curriculum & Academic Highlights */}
      <section className="bg-white border-y border-slate-200/80 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-1">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm font-heading">CBSE Class 6 Aligned</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Curriculum mapped to standard NCERT learning objectives, covering foundational scientific curiosity, method, and concepts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-1">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm font-heading">Active Micro-Learning</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bite-sized sections with knowledge checks prevent cognitive overload and reinforce memory retention.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm font-heading">Student Privacy First</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Secure authentication with Supabase cloud storage protects student quiz scores, notes, and progress records.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Ready to Begin Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-6">
        <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-md space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto text-emerald-300">
            <Atom className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
              Ready to explore the wonderful world of science?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Create your free student account or log in to access Chapter 1 lessons, interactive practice quizzes, and your personal AI Tutor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              id="landing-footer-signup-btn"
              variant="secondary"
              size="lg"
              icon={UserPlus}
              onClick={() => onNavigate('signup')}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-8 shadow-sm"
            >
              Create Free Account
            </Button>
            <Button
              id="landing-footer-login-btn"
              variant="outline"
              size="lg"
              icon={LogIn}
              onClick={() => onNavigate('login')}
              className="border-emerald-400/40 text-white hover:bg-white/10 font-bold px-8"
            >
              Log In
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

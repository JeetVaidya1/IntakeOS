import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-white/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">I</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">IntakeOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16">
        {/* Hero Section */}
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            New: Embed directly on your website
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Stop losing leads to <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">boring forms.</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Turn passive intake forms into active AI agents. Collect better data, book meetings instantly, and never miss a client again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 rounded-full">
                Start Building Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white/80">
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-20 pt-10 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000 delay-300">
             {[
               { icon: Zap, label: "Setup Time", value: "2 Minutes" },
               { icon: CheckCircle2, label: "Completion Rate", value: "+45% Increase" },
               { icon: Shield, label: "Data Security", value: "Enterprise Grade" },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center">
                 <div className="p-3 bg-indigo-50 rounded-full mb-3 text-indigo-600">
                   <stat.icon className="w-6 h-6" />
                 </div>
                 <div className="font-bold text-2xl text-slate-900">{stat.value}</div>
                 <div className="text-sm text-slate-500">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}
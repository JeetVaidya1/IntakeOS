import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 animate-gradient">I</div>
            <span className="text-xl font-bold gradient-text-vibrant">IntakeOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-indigo-500/30 animate-gradient">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16">
        {/* Hero Section */}
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 border border-purple-200 text-purple-700 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg shadow-purple-500/10">
            <span className="flex h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse"></span>
            New: Embed directly on your website
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Stop losing leads to <br />
            <span className="gradient-text-vibrant animate-gradient">boring forms.</span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Turn passive intake forms into active AI agents. Collect better data, book meetings instantly, and never miss a client again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/30 rounded-full animate-gradient group">
                Start Building Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-full glass-vibrant border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/20">
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Social Proof / Stats */}
          <div className="mt-20 pt-10 border-t border-purple-200/40 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000 delay-300">
             {[
               { icon: Zap, label: "Setup Time", value: "2 Minutes", color: "from-yellow-400 to-orange-500", bg: "bg-gradient-to-br from-yellow-50 to-orange-50", border: "border-orange-200" },
               { icon: CheckCircle2, label: "Completion Rate", value: "+45% Increase", color: "from-emerald-400 to-teal-500", bg: "bg-gradient-to-br from-emerald-50 to-teal-50", border: "border-teal-200" },
               { icon: Shield, label: "Data Security", value: "Enterprise Grade", color: "from-indigo-400 to-purple-500", bg: "bg-gradient-to-br from-indigo-50 to-purple-50", border: "border-purple-200" },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center group">
                 <div className={`p-4 ${stat.bg} rounded-2xl mb-4 border ${stat.border} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                   <stat.icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} strokeWidth={2.5} />
                 </div>
                 <div className="font-bold text-3xl text-slate-900 mb-1">{stat.value}</div>
                 <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}
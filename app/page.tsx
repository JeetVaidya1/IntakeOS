import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Bot, Sparkles, MessageSquare, TrendingUp, Users, Clock, Mail, Code } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-white">
      {/* Snowfall Effect */}
      <div className="snowfall-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="snowflake">❄</div>
        ))}
      </div>

      {/* Vibrant Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large colorful circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-500 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500 rounded-full opacity-15 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-80 h-80 bg-pink-500 rounded-full opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-cyan-500 rounded-full opacity-15 animate-float" style={{animationDelay: '1s'}}></div>

        {/* Geometric squares */}
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-orange-500 opacity-20 rotate-45 animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-20 w-56 h-56 bg-teal-500 opacity-15 rotate-12 animate-float" style={{animationDelay: '5s'}}></div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-purple-200/50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 animate-gradient">I</div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">IntakeOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-700 hover:text-purple-600 transition-colors px-4 py-2 rounded-lg hover:bg-purple-50">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 animate-gradient hover:shadow-xl hover:scale-105 transition-all">
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

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="text-slate-900">Stop losing leads to</span> <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient inline-block">
              boring forms.
            </span>
          </h1>

          <p className="text-xl text-slate-700 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Turn passive intake forms into <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">active AI agents</span>. Collect better data, book meetings instantly, and never miss a client again.
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
          <div className="mt-20 pt-10 border-t border-purple-300/50 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000 delay-300">
             {[
               { icon: Zap, label: "Setup Time", value: "2 Minutes", gradient: "from-yellow-500 to-orange-500", bg: "from-yellow-50 to-orange-50", border: "border-orange-200", shadow: "shadow-orange-500/30" },
               { icon: CheckCircle2, label: "Completion Rate", value: "+45% Increase", gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-50 to-teal-50", border: "border-teal-200", shadow: "shadow-teal-500/30" },
               { icon: Shield, label: "Data Security", value: "Enterprise Grade", gradient: "from-indigo-500 to-purple-500", bg: "from-indigo-50 to-purple-50", border: "border-purple-200", shadow: "shadow-purple-500/30" },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center group">
                 <div className={`p-4 bg-gradient-to-br ${stat.bg} rounded-2xl mb-4 border-2 ${stat.border} shadow-xl ${stat.shadow} group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                   <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                     <stat.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                   </div>
                 </div>
                 <div className="font-bold text-3xl bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-1">{stat.value}</div>
                 <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Why IntakeOS?</h2>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto">Transform boring forms into engaging AI conversations that your clients actually want to complete</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: "AI-Powered Conversations",
                description: "Smart AI agents ask contextual questions and adapt to responses in real-time",
                gradient: "from-indigo-500 to-purple-500",
                bg: "from-indigo-50 to-purple-50"
              },
              {
                icon: Sparkles,
                title: "Auto-Generated Forms",
                description: "Describe what you need and our AI builds the perfect intake form in seconds",
                gradient: "from-purple-500 to-pink-500",
                bg: "from-purple-50 to-pink-50"
              },
              {
                icon: MessageSquare,
                title: "Natural Conversations",
                description: "Clients chat naturally instead of filling boring fields, increasing completion rates by 45%",
                gradient: "from-cyan-500 to-blue-500",
                bg: "from-cyan-50 to-blue-50"
              },
              {
                icon: TrendingUp,
                title: "Higher Conversion",
                description: "Conversational forms feel less intimidating and lead to more completed submissions",
                gradient: "from-emerald-500 to-teal-500",
                bg: "from-emerald-50 to-teal-50"
              },
              {
                icon: Mail,
                title: "Instant Notifications",
                description: "Get notified immediately when a client completes your intake form",
                gradient: "from-orange-500 to-amber-500",
                bg: "from-orange-50 to-amber-50"
              },
              {
                icon: Code,
                title: "Easy Integration",
                description: "Embed on your website with one line of code or share a simple link",
                gradient: "from-pink-500 to-rose-500",
                bg: "from-pink-50 to-rose-50"
              }
            ].map((feature, idx) => (
              <Card key={idx} className={`p-8 bg-gradient-to-br ${feature.bg} border-2 border-white/80 shadow-xl hover:shadow-2xl hover:scale-105 hover:border-white transition-all duration-300 group relative overflow-hidden`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all relative z-10`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 relative z-10">{feature.title}</h3>
                <p className="text-slate-700 leading-relaxed relative z-10">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-grid opacity-40"></div>
          {/* Solid colored shapes */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-400 rounded-full opacity-10 animate-float"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-400 rounded-full opacity-15 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500 opacity-10 rotate-45 animate-float" style={{animationDelay: '4s'}}></div>
          <div className="container mx-auto px-4 max-w-6xl relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">How It Works</h2>
              <p className="text-xl text-slate-700">Get started in 3 simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: "1",
                  title: "Describe Your Needs",
                  description: "Tell our AI what information you need to collect from clients",
                  gradient: "from-indigo-600 to-purple-600"
                },
                {
                  step: "2",
                  title: "AI Generates Your Bot",
                  description: "Watch as AI creates a custom conversational intake form instantly",
                  gradient: "from-purple-600 to-pink-600"
                },
                {
                  step: "3",
                  title: "Share & Collect",
                  description: "Share the link or embed on your site. Start collecting better data immediately",
                  gradient: "from-pink-600 to-cyan-600"
                }
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-white shadow-2xl hover:shadow-purple-500/30 hover:scale-105 hover:border-purple-200 transition-all duration-300 h-full group">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-xl shadow-purple-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all animate-gradient`}>
                      <span className="text-3xl font-bold text-white">{step.step}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
                    <p className="text-slate-700 text-lg leading-relaxed">{step.description}</p>
                  </Card>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-purple-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-12 text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl shadow-purple-500/40 rounded-full animate-gradient">
                  Start Building Your Bot Free
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Perfect For Every Industry</h2>
            <p className="text-xl text-slate-700">See how professionals use IntakeOS to collect better data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "🎨 Photographers & Creatives",
                description: "Collect client preferences, event details, and budget information through natural conversation",
                stats: "45% higher booking rates"
              },
              {
                title: "⚖️ Legal Professionals",
                description: "Gather case details, client information, and consultation needs efficiently and securely",
                stats: "60% time saved on intake"
              },
              {
                title: "💼 Consultants & Agencies",
                description: "Qualify leads, understand project scope, and collect requirements without endless forms",
                stats: "3x more qualified leads"
              },
              {
                title: "🏥 Healthcare Providers",
                description: "Streamline patient intake with conversational forms that feel personal and caring",
                stats: "80% completion rate"
              },
              {
                title: "💻 SaaS Companies",
                description: "Onboard users, collect feature requests, and gather feedback through engaging conversations",
                stats: "50% more submissions"
              },
              {
                title: "🏠 Real Estate Agents",
                description: "Understand buyer preferences, budget, and requirements through guided conversations",
                stats: "2x faster qualification"
              }
            ].map((useCase, idx) => (
              <Card key={idx} className="p-8 bg-white/70 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl hover:border-purple-400 hover:scale-105 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent relative z-10">{useCase.title}</h3>
                <p className="text-slate-700 text-lg mb-4 leading-relaxed relative z-10">{useCase.description}</p>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-full shadow-sm group-hover:shadow-md transition-shadow relative z-10">
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{useCase.stats}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="container mx-auto px-4 max-w-4xl text-center relative">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">Ready to Transform Your Intake Process?</h2>
            <p className="text-2xl text-white/95 mb-12 max-w-2xl mx-auto drop-shadow">Join hundreds of professionals collecting better data with AI-powered conversations</p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-12 text-lg bg-white text-purple-600 hover:bg-gray-50 hover:scale-105 shadow-2xl rounded-full font-bold transition-all">
                  Get Started Free
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-16 px-12 text-lg border-2 border-white text-white hover:bg-white/20 hover:scale-105 rounded-full font-bold transition-all">
                  View Demo
                </Button>
              </Link>
            </div>

            <p className="text-white/90 mt-8 text-lg drop-shadow">No credit card required • Setup in 2 minutes • Free forever</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">I</div>
              <span className="text-xl font-bold">IntakeOS</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 IntakeOS. Built with AI. Made for humans.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
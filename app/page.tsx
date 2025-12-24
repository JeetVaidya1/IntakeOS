import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Bot, Sparkles, MessageSquare, TrendingUp, Users, Clock, Mail, Code } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30">
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

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-vibrant">Why IntakeOS?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Transform boring forms into engaging AI conversations that your clients actually want to complete</p>
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
              <Card key={idx} className={`p-8 bg-gradient-to-br ${feature.bg} border-2 border-white/60 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-grid opacity-50"></div>
          <div className="container mx-auto px-4 max-w-6xl relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-vibrant">How It Works</h2>
              <p className="text-xl text-slate-600">Get started in 3 simple steps</p>
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
                  <Card className="p-8 glass-vibrant border-2 border-white shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 h-full">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30`}>
                      <span className="text-3xl font-bold text-white">{step.step}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
                  </Card>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-purple-400" />
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-vibrant">Perfect For Every Industry</h2>
            <p className="text-xl text-slate-600">See how professionals use IntakeOS to collect better data</p>
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
              <Card key={idx} className="p-8 glass-vibrant border-2 border-purple-200 shadow-xl hover:shadow-2xl hover:border-purple-300 transition-all duration-300 group">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{useCase.title}</h3>
                <p className="text-slate-600 text-lg mb-4 leading-relaxed">{useCase.description}</p>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full">
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{useCase.stats}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
          <div className="container mx-auto px-4 max-w-4xl text-center relative">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">Ready to Transform Your Intake Process?</h2>
            <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto">Join hundreds of professionals collecting better data with AI-powered conversations</p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-12 text-lg bg-white text-purple-600 hover:bg-gray-50 shadow-2xl rounded-full font-bold">
                  Get Started Free
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-16 px-12 text-lg border-2 border-white text-white hover:bg-white/10 rounded-full font-bold">
                  View Demo
                </Button>
              </Link>
            </div>

            <p className="text-white/80 mt-8">No credit card required • Setup in 2 minutes • Free forever</p>
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
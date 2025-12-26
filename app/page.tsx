import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Zap, Globe, MessageSquare, Workflow, Clock, CheckCircle2, X } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section - Dark Aurora Background */}
      <section className="relative min-h-screen bg-slate-950 overflow-hidden">
        {/* Aurora Background with Orbs */}
        <div className="absolute inset-0 bg-aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
          <div className="aurora-orb aurora-orb-3"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern"></div>

        {/* Navbar */}
        <header className="relative z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/50">I</div>
              <span className="text-xl font-bold text-white">IntakeOS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                Sign In
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:scale-105 transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content - Split Layout */}
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text + CTAs */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-cyan-300 text-sm font-medium mb-8 shadow-lg">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Agentic AI Technology
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white leading-tight">
                Your AI Receptionist,<br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Not Just Another Form.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
                IntakeOS is the <span className="text-white font-semibold">agentic brain</span> that talks to your clients, qualifies leads, and syncs to your CRM—<span className="text-cyan-400">24/7</span>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/50 rounded-full group">
                    Start Building Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-14 px-10 text-base rounded-full bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 hover:border-white/30">
                  View Demo
                </Button>
              </div>
            </div>

            {/* Right: Mock Chat UI */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">AI Receptionist</div>
                    <div className="text-white/80 text-xs flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-400"></span>
                      Online
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-6 space-y-4 bg-slate-900/50">
                  {/* Bot Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 max-w-sm">
                      <p className="text-slate-200 text-sm">Hi! I'm here to help. What type of project are you working on?</p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl rounded-tr-none px-4 py-3 max-w-sm">
                      <p className="text-white text-sm">I need a website redesign for my startup</p>
                    </div>
                  </div>

                  {/* Bot Message - Agentic Feature */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 max-w-sm">
                      <p className="text-slate-200 text-sm mb-3">Perfect! Let me capture a few details:</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Project Type: Website Redesign</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Industry: Startup</span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Extracting budget range...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="bg-slate-900/80 backdrop-blur-lg px-6 py-4 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-400"
                      disabled
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl px-6 py-3 shadow-2xl shadow-indigo-500/50 border border-white/20">
                <div className="text-white font-bold text-sm">3 Fields Extracted</div>
                <div className="text-white/80 text-xs">From One Message</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features - "The OS Vibe" */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">The IntakeOS Advantage</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">Not just a form builder. A complete operating system for client intake.</p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Large Feature 1 - Spans 2 columns */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">The Traffic Cop</h3>
                  <p className="text-cyan-400 text-sm">Agentic Decision-Making</p>
                </div>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Our AI agent doesn't just collect responses—it <span className="text-white font-semibold">decides what to ask next</span> based on context. If a user mentions "enterprise team," the bot automatically explores budget, timeline, and stakeholders.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs">Contextual Awareness</span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs">Dynamic Routing</span>
                <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-xs">Multi-Intent Extraction</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero-Click Sync</h3>
              <p className="text-slate-300 leading-relaxed">
                Webhooks fire instantly to Zapier, Make.com, or your CRM. No manual exports. No delays.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform mb-6">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Context Aware</h3>
              <p className="text-slate-300 leading-relaxed">
                Knows your business hours, services, and pricing. Responds like a trained receptionist, not a bot.
              </p>
            </div>

            {/* Feature 4 - Spans 2 columns */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Omnichannel</h3>
                  <p className="text-orange-400 text-sm">Deploy Anywhere</p>
                </div>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                Embed as a widget, share a link, scan a QR code, or integrate via API. One brain, infinite touchpoints.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Website Widget
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Direct Link
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  QR Code
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  API Integration
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50 group-hover:scale-110 transition-transform mb-6">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Natural Language</h3>
              <p className="text-slate-300 leading-relaxed">
                Users talk naturally. No dropdowns. No rigid forms. Just conversation.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 group shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/50 group-hover:scale-110 transition-transform mb-6">
                <Workflow className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Routing</h3>
              <p className="text-slate-300 leading-relaxed">
                Automatically routes high-value leads to urgent queues. Qualifies before you lift a finger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section - Old vs New */}
      <section className="relative bg-slate-950 py-24 overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">The Old Way vs. The IntakeOS Way</h2>
            <p className="text-xl text-slate-300">Stop frustrating your leads with static forms</p>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-white/5 backdrop-blur-lg border border-red-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Static Forms</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Boring, intimidating fields",
                  "50%+ drop-off rate",
                  "No context or personalization",
                  "Manual data entry into CRM",
                  "Users abandon mid-form",
                  "One-size-fits-all approach"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* New Way */}
            <div className="bg-white/10 backdrop-blur-lg border border-green-500/30 rounded-3xl p-8 shadow-2xl ring-2 ring-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">IntakeOS Agents</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Engaging, conversational flow",
                  "+40% completion rate",
                  "Context-aware & personalized",
                  "Auto-sync to any CRM",
                  "Natural, human-like dialogue",
                  "Adapts to each user's needs"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/50 rounded-full group">
                Make The Switch Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">Ready to Deploy Your AI Receptionist?</h2>
          <p className="text-2xl text-white/95 mb-12 max-w-2xl mx-auto drop-shadow">
            Join the future of client intake. Build your first agentic bot in 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="h-16 px-12 text-lg bg-white text-purple-600 hover:bg-gray-50 hover:scale-105 shadow-2xl rounded-full font-bold transition-all">
                Get Started Free
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-12 text-lg border-2 border-white text-white hover:bg-white/20 hover:scale-105 rounded-full font-bold transition-all">
              View Demo
            </Button>
          </div>

          <p className="text-white/90 mt-8 text-lg drop-shadow">No credit card required • 2-minute setup • Free forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">I</div>
              <span className="text-xl font-bold">IntakeOS</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 IntakeOS. Powered by Agentic AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Brain, Zap, Globe, MessageSquare, Workflow, Clock, CheckCircle2, X, Eye, ChevronDown, Shield, Smartphone, Image as ImageIcon, FileText, Sparkles, TrendingUp, Users, Building2, Hammer, Stethoscope, Scale, Wrench, BarChart3, Calendar, MapPin, Calculator, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-950">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
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
              <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/50">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Aurora Background */}
        <div className="absolute inset-0 bg-aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
          <div className="aurora-orb aurora-orb-3"></div>
        </div>
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-cyan-300 text-sm font-medium mb-8 shadow-lg">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Vision AI + Agentic Intelligence
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white leading-tight">
              The Receptionist That<br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Never Sleeps.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Stop losing leads to slow replies and messy forms.
            </p>
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              IntakeOS qualifies your clients, parses their documents, and books your calendar—<span className="text-cyan-400 font-semibold">24/7</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-10 text-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 shadow-2xl shadow-cyan-500/50 rounded-full group relative overflow-hidden">
                  <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
                  <span className="relative">Deploy Your Receptionist Free</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-full bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 hover:border-cyan-500/50">
                <Eye className="mr-2 w-5 h-5" />
                Watch 60s Product Tour
              </Button>
            </div>

            {/* Trust Line */}
            <p className="text-slate-500 mt-8 text-sm">No credit card required • 2-minute setup • Free forever</p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Trust Bar - Industry Logos */}
      <section className="relative bg-slate-900 border-y border-white/10 py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-400 text-sm mb-6">Powering the next generation of local businesses</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { icon: Hammer, label: 'Home Services' },
              { icon: Stethoscope, label: 'Medical Intake' },
              { icon: Scale, label: 'Legal Teams' },
              { icon: Wrench, label: 'Contractors' },
              { icon: Building2, label: 'Professional Services' },
            ].map((industry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <industry.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{industry.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Intelligence Showpiece */}
      <section className="relative bg-slate-950 py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left: Mobile Mockup */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative mx-auto w-full max-w-sm">
                {/* Phone Frame */}
                <div className="bg-slate-900 border-8 border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                  {/* Screen */}
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950">
                    {/* Status Bar */}
                    <div className="px-6 py-2 flex justify-between text-xs text-white">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-3 border border-white rounded-sm"></div>
                      </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="p-4 space-y-4 min-h-[500px]">
                      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                        <p className="text-white text-sm">Could you send me a photo of the damage?</p>
                      </div>

                      {/* Uploaded Image */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl rounded-tr-none p-1 max-w-[80%]">
                          <div className="relative h-48 rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-slate-600" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-2 left-2 text-white text-xs">broken_window.jpg</div>
                          </div>
                        </div>
                      </div>

                      {/* AI Response with Vision Analysis */}
                      <div className="bg-white/10 backdrop-blur-lg border border-cyan-500/30 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                        <p className="text-white text-sm mb-3">I can see a broken double-pane window. Let me capture the details:</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-cyan-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Window type: Double-pane</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-cyan-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approx size: 36" x 48"</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-cyan-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Frame material: Vinyl</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl px-6 py-3 shadow-2xl shadow-cyan-500/50 border border-white/20">
                  <div className="text-white font-bold text-sm">Vision AI</div>
                  <div className="text-white/90 text-xs">Analyzing...</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
                <Eye className="w-4 h-4" />
                Multimodal Intelligence
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                She sees what <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">you see.</span>
              </h2>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                IntakeOS isn't just text—it analyzes <span className="text-white font-semibold">photos and PDFs</span> (blueprints, invoices, site photos) to give you a head start on quotes.
              </p>

              <div className="space-y-4">
                {[
                  { icon: ImageIcon, title: 'Site Photos', desc: 'Extracts damage details, measurements, materials' },
                  { icon: FileText, title: 'PDF Blueprints', desc: 'Reads floor plans, specs, and technical drawings' },
                  { icon: Sparkles, title: 'Smart Extraction', desc: 'Converts visual data into structured CRM fields' },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Command Center Section */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              Real-Time Intelligence
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Your Lead <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Command Center.</span>
            </h2>
            <p className="text-xl text-slate-300 mb-2 max-w-3xl mx-auto">
              Total Visibility, Zero Effort.
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Go beyond email pings. Manage your entire intake funnel from a dashboard designed for busy business owners.
            </p>
          </motion.div>

          {/* Dashboard Preview - Tilted Container */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto mb-16 perspective-1000"
          >
            <div className="relative transform hover:scale-[1.02] transition-transform duration-500" style={{ transform: 'rotateX(8deg) rotateY(-4deg)' }}>
              {/* Dashboard Container */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border-b border-white/10 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">Submission Performance</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span>Live</span>
                    </div>
                  </div>
                </div>

                {/* Mock Chart Area */}
                <div className="p-6">
                  <div className="h-48 relative">
                    {/* CSS-based Chart */}
                    <div className="absolute inset-0 flex items-end justify-between gap-2 px-4">
                      {[
                        { day: 'Mon', height: '40%', value: 8 },
                        { day: 'Tue', height: '55%', value: 12 },
                        { day: 'Wed', height: '45%', value: 10 },
                        { day: 'Thu', height: '70%', value: 16 },
                        { day: 'Fri', height: '85%', value: 19 },
                        { day: 'Sat', height: '60%', value: 13 },
                        { day: 'Sun', height: '50%', value: 11 },
                      ].map((bar, idx) => (
                        <motion.div
                          key={bar.day}
                          initial={{ height: 0 }}
                          whileInView={{ height: bar.height }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1, duration: 0.5 }}
                          className="flex-1 relative group"
                        >
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-t-lg opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-slate-950 border border-white/20 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
                                {bar.value} leads
                              </div>
                            </div>
                          </div>
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400">
                            {bar.day}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Chart Footer */}
                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-sm text-slate-300">Daily Submissions</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      Total this week: <span className="font-bold text-white">89</span>
                    </span>
                  </div>
                </div>

                {/* Live Lead Cards */}
                <div className="px-6 pb-6 space-y-3">
                  {[
                    { name: 'John Smith', location: 'Nelson, BC', budget: '$5k-7k', time: '2 mins ago', color: 'emerald' },
                    { name: 'Sarah Johnson', location: 'Castlegar, BC', budget: '$12k-15k', time: '15 mins ago', color: 'cyan' },
                    { name: 'Mike Thompson', location: 'Trail, BC', budget: '$3k-5k', time: '1 hour ago', color: 'indigo' },
                  ].map((lead, idx) => (
                    <motion.div
                      key={lead.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full bg-${lead.color}-400 animate-pulse`}></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{lead.name}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-sm text-slate-400">{lead.location}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">Budget: {lead.budget}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">{lead.time}</span>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-white transition-all opacity-0 group-hover:opacity-100">
                        View Details →
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating Stats Badge */}
              <div className="absolute -right-4 -top-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/50 border border-white/20">
                <div className="text-white font-bold text-2xl">89</div>
                <div className="text-white/90 text-xs">Leads This Week</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {[
              {
                icon: TrendingUp,
                title: 'Lead Analytics',
                description: 'Track your intake volume with 7-day performance charts. Know exactly when your business is busiest.',
                color: 'from-indigo-500 to-purple-500'
              },
              {
                icon: Building2,
                title: 'Centralized Management',
                description: 'One place to manage all your bots, from Softub consultations to blind repairs.',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Eye,
                title: 'Lead Deep-Dives',
                description: "Don't just see a name. View full conversation summaries and extracted data in a clean, professional table.",
                color: 'from-purple-500 to-pink-500'
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:scale-105 transition-all">
              <Eye className="mr-2 w-5 h-5" />
              Take the Dashboard Tour
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid 2.0 with UI Snippets */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">The Dashboard of Truth</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">Not just promises. Real UI. Real features. Real results.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Sync Card with UI Snippet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Zero-Click Sync</h3>
                  <p className="text-emerald-400 text-sm">Instant CRM Integration</p>
                </div>
              </div>

              <p className="text-slate-300 mb-6">Every lead syncs instantly to HubSpot, Slack, Zapier, or your custom webhook. No manual exports. Ever.</p>

              {/* UI Snippet */}
              <div className="bg-slate-950/50 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm font-semibold">Lead synced successfully</span>
                    </div>
                    <p className="text-slate-400 text-xs mb-2">John Smith • Custom Deck Build • $15,000 budget</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-xs">✓ HubSpot</span>
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-xs">✓ Slack</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Logic Card with Confirmation List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Strict Guardrails</h3>
              <p className="text-slate-300 mb-4">Forces confirmation lists. No skipping steps. No incomplete data.</p>

              {/* UI Snippet */}
              <div className="bg-slate-950/50 border border-purple-500/30 rounded-xl p-3 text-xs">
                <p className="text-purple-300 font-semibold mb-2">Let me confirm:</p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Name: John Smith</li>
                  <li>• Email: john@example.com</li>
                  <li>• Service: Deck Build</li>
                  <li>• Budget: $15,000</li>
                </ul>
              </div>
            </motion.div>

            {/* Identity Card with Business Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50 mb-6">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Your Brand, Not Ours</h3>
              <p className="text-slate-300 mb-4">Adapts to your business name and style. No generic "Bot" identity.</p>

              {/* UI Snippet */}
              <div className="bg-slate-950/50 border border-indigo-500/30 rounded-xl p-3">
                <div className="text-white font-semibold text-sm mb-1">Sunset Custom Blinds</div>
                <p className="text-slate-400 text-xs">Hi! I'm here to help with your window covering needs.</p>
              </div>
            </motion.div>

            {/* Natural Language */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Human Conversation</h3>
                  <p className="text-cyan-400 text-sm">No Dropdowns. No Forms.</p>
                </div>
              </div>

              <p className="text-slate-300">Users talk naturally. The AI extracts structured data from freeform text—even vague answers like "I don't know yet."</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Before & After: Cost of Missed Lead */}
      <section className="relative bg-slate-950 py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">The Cost of a Missed Lead</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">Every hour of delay = 50% lower conversion. Stop the bleeding.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Sad Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl blur opacity-50"></div>
              <Card className="relative bg-slate-900 border-red-500/50 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Traditional Forms</h3>
                    <p className="text-red-400 text-sm">The Silent Killer</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Avg Response Time</span>
                    <span className="text-red-400 font-bold">4 hours</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Drop-off Rate</span>
                    <span className="text-red-400 font-bold">50%+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Data Quality</span>
                    <span className="text-red-400 font-bold">Incomplete</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Lead Qualification</span>
                    <span className="text-red-400 font-bold">Manual</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Users abandon mid-form</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>No follow-up on partial submissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Lost to faster competitors</span>
                  </li>
                </ul>
              </Card>
            </motion.div>

            {/* IntakeOS Agent */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-50"></div>
              <Card className="relative bg-slate-900 border-emerald-500/50 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">IntakeOS Agent</h3>
                    <p className="text-emerald-400 text-sm">Instant Qualification</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Avg Response Time</span>
                    <span className="text-emerald-400 font-bold">0.2 seconds</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Completion Rate</span>
                    <span className="text-emerald-400 font-bold">90%+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Data Quality</span>
                    <span className="text-emerald-400 font-bold">Validated</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-slate-300 text-sm">Lead Qualification</span>
                    <span className="text-emerald-400 font-bold">Automatic</span>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Conversational, engaging flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Instant sync to CRM & Slack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>24/7 availability wins the race</span>
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="relative bg-slate-950 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              Product Roadmap
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              We're <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Just Getting Started.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              IntakeOS is evolving fast. Here's what's coming next to make your business even more automated.
            </p>
          </motion.div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: Intelligent Scheduling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <Card className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 font-semibold">
                  Coming Soon
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4">Intelligent Scheduling</h3>
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Google Calendar & Calendly Integration.</span> Your receptionist will soon be able to book consultations directly into your calendar based on your real-time availability.
                </p>

                {/* Timeline Connector (for desktop) */}
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></div>
              </Card>
            </motion.div>

            {/* Card 2: Precision Geo-Fencing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <Card className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-300 font-semibold">
                  Coming Soon
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  <MapPin className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4">Precision Geo-Fencing</h3>
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Google Maps Verification.</span> Automatically verify customer locations and block leads from outside your service area before they even submit.
                </p>

                {/* Timeline Connector (for desktop) */}
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent"></div>
              </Card>
            </motion.div>

            {/* Card 3: AI-Powered Estimates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <Card className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                {/* Coming Soon Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs text-emerald-300 font-semibold">
                  Coming Soon
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform">
                  <Calculator className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Estimates</h3>
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Instant Quote Logic.</span> Using your uploaded price lists, the AI will provide rough 'ballpark' estimates to qualify leads even faster.
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-slate-400 mb-6">
              Have a feature request? We're building this for you.
            </p>
            <Button variant="outline" size="lg" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-purple-500/50 rounded-full">
              Share Your Feedback
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Questions? We've Got Answers.</h2>
            <p className="text-xl text-slate-300">Everything you need to know about IntakeOS</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "How much technical setup is required?",
                a: "If you can write an email, you can build a bot. Our AI Architect builds your entire intake flow in 30 seconds based on your business description."
              },
              {
                q: "Can it actually handle my specific industry?",
                a: "Yes. By filling out your 'Business Profile,' you teach the AI your service areas, pricing, and specialty. It speaks your language, not generic AI-speak."
              },
              {
                q: "How do I get the leads?",
                a: "Every lead appears instantly in your IntakeOS Dashboard. We also ping you via email or Slack, and can sync data directly to your CRM (like HubSpot or Salesforce)."
              },
              {
                q: "Is this better than a simple contact form?",
                a: "Significantly. Forms are static and boring. IntakeOS is conversational, it clarifies typos, handles vague answers, and extracts technical data from photos—things a form simply can't do."
              },
              {
                q: "What if the AI says something wrong?",
                a: "We use 'Strict Logic Guardrails.' The bot is strictly instructed to stick to your Business Profile and the specific fields you require. It's a receptionist, not a creative writer."
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-6 bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-lg mb-2">{faq.q}</h4>
                      {openFaq === idx && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-slate-300 leading-relaxed"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to reclaim <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">10 hours</span> of your week?
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Join thousands of business owners who automated their intake process with IntakeOS.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-12 text-lg bg-white text-indigo-600 hover:bg-gray-50 hover:scale-105 shadow-2xl rounded-full font-bold transition-all">
                  Start Building Free
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-12 text-lg border-2 border-white/30 text-white hover:bg-white/10 hover:scale-105 rounded-full font-bold transition-all">
                <Eye className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            <p className="text-slate-400 text-sm">No credit card required • 2-minute setup • Free forever</p>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Integration', 'Changelog'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2">
                {['Home Services', 'Healthcare', 'Legal', 'Contractors'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Documentation', 'API', 'Support', 'Status'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">I</div>
              <span className="text-xl font-bold text-white">IntakeOS</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 IntakeOS. Built with Vision AI + Agentic Intelligence.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

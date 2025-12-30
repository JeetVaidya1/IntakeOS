'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Camera, CheckCircle2, Clock, FileText, Image as ImageIcon, MessageSquare, Smartphone, Wrench, Droplet, Blinds, Home, Shield, Zap, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function HomeServicesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            IntakeOS
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 rounded-full">
                Start 7-Day Trial
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Photo Upload Focused */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
              <Home className="w-4 h-4" />
              For Contractors, Plumbers & Spa Professionals
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white leading-tight">
              Turn Photos Into<br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Qualified Estimates.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Your customers snap a photo. Your AI receptionist extracts the details.
            </p>
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              Built for busy home service pros who need instant lead qualification—<span className="text-cyan-400 font-semibold">no phone tag required</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-10 text-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 shadow-2xl shadow-cyan-500/50 rounded-full group relative overflow-hidden">
                  <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
                  <span className="relative">Start Your 7-Day Pro Trial</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
                </Button>
              </Link>
              <Link href="#photo-intelligence">
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-full">
                  <Camera className="mr-2 w-5 h-5" />
                  See Photo AI in Action
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual - Phone with Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              <div className="bg-slate-900/80 backdrop-blur-xl border-4 border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Mock Phone Interface */}
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">IntakeOS Bot</div>
                        <div className="text-xs text-slate-400">Online now</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 text-sm text-slate-200">
                        Hi! I can help you get a quote. Can you upload a photo of the area?
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-white/10 border border-white/20 rounded-xl p-3 max-w-[80%]">
                          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden mb-2">
                            <ImageIcon className="w-full h-24 text-slate-600 p-4" />
                          </div>
                          <div className="text-xs text-slate-400">broken_window.jpg</div>
                        </div>
                      </div>
                      <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 text-sm text-slate-200">
                        Perfect! I can see it's a double-pane window. What's your budget range?
                      </div>
                    </div>
                  </div>

                  {/* Right: Extracted Data */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Auto-Extracted Data
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Issue Type', value: 'Broken Window', icon: '🪟' },
                        { label: 'Window Type', value: 'Double-Pane', icon: '📏' },
                        { label: 'Size Estimate', value: '~36" x 48"', icon: '📐' },
                        { label: 'Frame Material', value: 'Vinyl', icon: '🔩' },
                        { label: 'Urgency', value: 'Medium', icon: '⏱️' },
                      ].map((item, idx) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm text-slate-400">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">{item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/50 border border-white/20">
                <div className="text-white font-bold text-2xl">98%</div>
                <div className="text-white/90 text-xs">Accuracy Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industry Showcase */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Built for <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Your Industry.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              From broken pipes to custom blinds, IntakeOS understands your specific workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Wrench,
                industry: 'General Contractors',
                examples: 'Kitchen Remodels, Deck Repairs, Foundation Work',
                color: 'from-orange-500 to-red-500',
                useCase: 'Client uploads photos of damaged deck → AI extracts wood type, square footage, and damage level'
              },
              {
                icon: Droplet,
                industry: 'Plumbers & HVAC',
                examples: 'Leak Detection, Water Heater Installation, AC Repair',
                color: 'from-blue-500 to-cyan-500',
                useCase: 'Homeowner sends water heater photo → AI identifies brand, capacity, and installation type'
              },
              {
                icon: Home,
                industry: 'Spa & Blind Specialists',
                examples: 'Custom Blinds, Hot Tub Installs, Window Treatments',
                color: 'from-purple-500 to-pink-500',
                useCase: 'Customer shares window dimensions → AI measures from photo and suggests blind types'
              },
            ].map((industry, idx) => (
              <motion.div
                key={industry.industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <industry.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{industry.industry}</h3>
                  <p className="text-sm text-slate-400 mb-4">{industry.examples}</p>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-300 italic">"{industry.useCase}"</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Intelligence Section */}
      <section id="photo-intelligence" className="relative bg-slate-950 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
              <Camera className="w-4 h-4" />
              Vision AI Technology
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              What Can Our <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Photo AI</span> See?
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Powered by GPT-4 Vision, our AI analyzes photos and PDFs to extract job-critical details instantly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { capability: 'Measurements & Dimensions', description: 'Window sizes, room dimensions, material lengths', icon: '📏' },
              { capability: 'Material Identification', description: 'Wood types, pipe materials, fabric patterns', icon: '🔍' },
              { capability: 'Damage Assessment', description: 'Crack severity, wear level, replacement urgency', icon: '⚠️' },
              { capability: 'Brand & Model Detection', description: 'Water heater brands, HVAC units, appliance models', icon: '🏷️' },
              { capability: 'Blueprint Parsing', description: 'Floor plans, electrical diagrams, installation guides', icon: '📐' },
              { capability: 'Color & Finish Matching', description: 'Paint colors, stain types, hardware finishes', icon: '🎨' },
            ].map((item, idx) => (
              <motion.div
                key={item.capability}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{item.capability}</h4>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              The Cost of <span className="text-red-400">Slow Response</span> vs. <span className="text-emerald-400">Instant Intake</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Before - Old Way */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Without IntakeOS</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Customer calls 3 times, leaves voicemail',
                    'You play phone tag for 2 days',
                    'Finally connect, but forget to ask about window size',
                    'Schedule on-site visit for measurements',
                    'Customer already hired your competitor',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="text-3xl font-bold text-red-400 mb-1">67%</div>
                  <div className="text-sm text-slate-400">of leads lost to slow response time</div>
                </div>
              </Card>
            </motion.div>

            {/* After - New Way */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">With IntakeOS</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Customer uploads photo at 11pm on Sunday',
                    'AI instantly extracts all measurements',
                    'Bot asks qualifying questions in natural conversation',
                    'Lead appears in your dashboard with photo + data',
                    'You call them Monday morning with a quote ready',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">3x</div>
                  <div className="text-sm text-slate-400">faster lead-to-quote conversion</div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real-World Success Story */}
      <section className="relative bg-slate-950 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-12 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-white/20 backdrop-blur-xl rounded-3xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-6xl">💬</div>
                <div>
                  <div className="text-2xl font-bold text-white mb-2">Sunset Custom Blinds</div>
                  <div className="text-slate-400">Nelson, BC • Window Treatment Specialists</div>
                </div>
              </div>
              <blockquote className="text-xl text-slate-200 leading-relaxed mb-6 italic">
                "Before IntakeOS, I'd spend 20 minutes on the phone just getting window measurements. Now customers snap photos, the AI pulls dimensions, and I show up with the right samples on the first visit. It's like having a full-time assistant who never sleeps."
              </blockquote>
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">89%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Less Phone Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">3.2x</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">More Quotes/Week</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">$47k</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Added Revenue (6mo)</div>
                </div>
              </div>
            </Card>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Common Questions from Contractors</h2>
            <p className="text-xl text-slate-300">Real answers for real businesses</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Can it really read measurements from photos?",
                a: "Yes. Our GPT-4 Vision AI can extract dimensions, identify materials, and assess damage from photos. It's the same technology used by professional inspection tools, but built into your intake flow."
              },
              {
                q: "What if the photo quality is bad?",
                a: "The AI will ask clarifying questions or request a better photo if needed. It's smart enough to know when it doesn't have enough information—no false data."
              },
              {
                q: "Do I need to train the AI for my specific services?",
                a: "Nope. Just fill out your Business Profile with your service areas and pricing structure. The AI adapts to plumbing, electrical, blinds, HVAC—whatever you do."
              },
              {
                q: "Can customers use this on their phone?",
                a: "100%. The intake bot works perfectly on mobile. Customers can upload photos directly from their camera roll or take new ones during the conversation."
              },
              {
                q: "What happens to the photos after submission?",
                a: "They're attached to the lead in your dashboard. You can download them, share with your team, or sync to your CRM. We don't use them for anything else—your data stays yours."
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

      {/* Final CTA */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Ready to Turn Photos Into Profits?
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Join contractors, plumbers, and spa pros who are closing deals faster with AI-powered intake.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-12 text-lg bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 shadow-2xl shadow-cyan-500/50 rounded-full">
                  Start Your 7-Day Pro Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <p className="text-slate-400 text-sm">
              No credit card required to start. Setup in 2 minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                IntakeOS
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered intake for modern businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/solutions/home-services" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    Home Services
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#features" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    Home
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-slate-400 text-sm">
            © 2024 IntakeOS. Built for professionals who move fast.
          </div>
        </div>
      </footer>
    </div>
  );
}

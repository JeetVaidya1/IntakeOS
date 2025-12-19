import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">
            Intake OS
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-slate-900">
            Kill Forms.<br />Start Conversations.
          </h1>
          <p className="text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Turn any intake requirements into an AI agent that collects complete, accurate data—automatically.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            ✓ Free forever plan  ✓ No credit card required  ✓ 2 minute setup
          </p>
        </div>

        {/* Demo Screenshot/Video Placeholder */}
        <div className="rounded-xl border-4 border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="aspect-video bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-xl text-slate-600">Demo Video / Screenshot Here</p>
              <p className="text-sm text-slate-500 mt-2">Show the chat interface in action</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✍️</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Describe Your Needs</h3>
              <p className="text-slate-600 text-lg">
                Tell us what information you need in plain English. No technical skills required.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. AI Builds Your Bot</h3>
              <p className="text-slate-600 text-lg">
                Get a conversational intake form in 30 seconds. Share via link or QR code.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Collect Perfect Data</h3>
              <p className="text-slate-600 text-lg">
                AI asks follow-up questions, validates answers, and ensures complete submissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">
              Stop Losing Leads to Bad Forms
            </h2>
            <div className="space-y-4 text-lg text-slate-600">
              <p className="flex items-start gap-3">
                <span className="text-red-500 text-2xl">✗</span>
                <span>60% of people abandon traditional forms</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-500 text-2xl">✗</span>
                <span>Missing information means wasted follow-up calls</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-500 text-2xl">✗</span>
                <span>Bad data = Bad quotes = Lost business</span>
              </p>
            </div>
          </div>
          
          <Card className="p-8">
            <h3 className="text-2xl font-semibold mb-6">With Intake OS:</h3>
            <div className="space-y-4 text-lg">
              <p className="flex items-start gap-3">
                <span className="text-green-500 text-2xl">✓</span>
                <span>Natural conversations feel easier</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-500 text-2xl">✓</span>
                <span>AI clarifies unclear answers in real-time</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-green-500 text-2xl">✓</span>
                <span>Every submission is complete and accurate</span>
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <p className="text-lg text-slate-700 mb-4 italic">
                "I set this up in 30 seconds for my roofing business. Every lead now comes in perfect. No more missing photos or unclear addresses."
              </p>
              <p className="text-slate-600 font-semibold">— Mike S.</p>
              <p className="text-slate-500 text-sm">Roofing Contractor</p>
            </Card>
            
            <Card className="p-8">
              <p className="text-lg text-slate-700 mb-4 italic">
                "Our intake completion rate went from 40% to 92%. This paid for itself in the first week."
              </p>
              <p className="text-slate-600 font-semibold">— Sarah L.</p>
              <p className="text-slate-500 text-sm">Moving Company Owner</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-xl text-slate-600 text-center mb-12">Start free. Upgrade when you're ready.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 border-2">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-slate-500">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>1 bot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>15 submissions/month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Intake OS branding</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full" size="lg">
                Start Free
              </Button>
            </Link>
          </Card>
          
          <Card className="p-8 border-2 border-indigo-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-6">$29<span className="text-lg text-slate-500">/month</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Unlimited bots</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Unlimited submissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Custom branding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Email notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Kill Forms?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses collecting better data with conversational intake forms.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2025 Intake OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
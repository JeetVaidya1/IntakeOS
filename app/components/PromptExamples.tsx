'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface PromptExamplesProps {
  onSelectTemplate?: (template: string) => void;
}

export function PromptExamples({ onSelectTemplate }: PromptExamplesProps) {
  const [activeTab, setActiveTab] = useState<'examples' | 'conversations'>('examples');

  const industryTemplates = [
    {
      industry: '📸 Wedding Photography',
      icon: '💍',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      description: 'Perfect for photographers and event professionals',
      goodPrompt: `I'm a luxury wedding photographer based in California. I need to collect comprehensive information from potential clients to provide accurate quotes and ensure we're the right fit.

BASIC INFORMATION:
- Couple's names (both partners)
- Wedding date
- Wedding venue name and location (city/state)
- How did you hear about us (referral, Instagram, Google, wedding planner, venue recommendation)

WEDDING DETAILS:
- Wedding type (traditional ceremony, elopement, destination wedding, courthouse, backyard)
- Estimated guest count
- Ceremony start time
- Do you need getting ready coverage (yes/no)
- Do you need reception coverage (yes/no)
- Any special cultural or religious traditions we should capture

PHOTOGRAPHY NEEDS:
- Coverage hours needed (4 hours, 6 hours, 8 hours, 10+ hours, not sure yet)
- Second shooter needed (yes, no, not sure - explain it's helpful for large weddings)
- Do you want engagement photos included
- Album or prints desired (yes - premium album, yes - prints only, digital only for now, not sure)

BUDGET & VISION:
- Photography budget range (under $3000, $3000-5000, $5000-8000, $8000-12000, $12000+, flexible/not sure)
- Photography style preference (romantic and airy, dark and moody, documentary/candid, traditional portraits, bold and colorful, natural/organic)
- Do you have a Pinterest board or inspiration images (yes - will share link, yes - will upload, no but can describe, no strong preference)

LOGISTICS:
- Timeline urgency (wedding is less than 3 months away, 3-6 months away, 6-12 months away, 12+ months away)
- Have you booked your venue yet (yes - booked, yes - touring soon, no - still looking, it's at a family property)
- Additional services needed (videography referral, photo booth, drone coverage, none needed)`,
      badPrompt: 'Need names, date, location, budget',
      exampleConversation: [
        { role: 'bot', text: "Hi there! 👋 Let's start with the happy couple - what are your names?" },
        { role: 'user', text: 'John and Lucy' },
        { role: 'bot', text: "That's a lovely couple name, John and Lucy! 💖 When's the big day?" },
        { role: 'user', text: 'October 15th, 2025' },
        { role: 'bot', text: "October 2025 - that's peak fall wedding season! 🍂 Where will you be celebrating?" },
        { role: 'user', text: 'Hummingbird Nest Ranch' },
        { role: 'bot', text: "Hummingbird Nest Ranch sounds like a stunning venue choice for your wedding! 🌿🥂 How many guests are you expecting?" }
      ]
    },
    {
      industry: '⚖️ Legal Services',
      icon: '📋',
      gradient: 'from-indigo-500 to-blue-500',
      bg: 'from-indigo-50 to-blue-50',
      border: 'border-indigo-200',
      description: 'For attorneys, consultants, and legal professionals',
      goodPrompt: `I'm an immigration attorney specializing in family-based immigration and employment visas. I need comprehensive intake information for initial consultations.

CLIENT INFORMATION:
- Full legal name (as it appears on passport)
- Date of birth and country of birth
- Current phone number and email
- Current U.S. address (if applicable)
- Preferred language for consultation (English, Spanish, Mandarin, other)
- How did you find our firm (Google search, referral from [name], law firm directory, social media, other)

IMMIGRATION STATUS:
- Current immigration status (H-1B, F-1 student, tourist visa, undocumented, green card holder, other)
- Current visa expiration date (if applicable)
- Have you ever been in removal/deportation proceedings (yes/no)
- Any prior visa denials or immigration violations (yes - please explain, no)
- Date of last entry to the United States

DESIRED OUTCOME:
- What is your immigration goal (green card through family, green card through employment, naturalization/citizenship, work visa, fiancé visa, asylum, other)
- Timeline sensitivity (urgent - less than 3 months, moderate - 3-6 months, planning ahead - 6+ months)
- Is this for you only or family members too (just me, me and spouse, me and spouse and children, other family members)

FAMILY INFORMATION (if applicable):
- Marital status (single, married, divorced, widowed)
- If married: spouse's immigration status
- Do you have children (yes - how many and their ages, no)
- Do you have U.S. citizen or green card holder relatives (yes - who and their status, no)

EMPLOYMENT INFORMATION (if applicable):
- Current employer name
- Job title and duties
- How long with current employer
- Does employer sponsor visas (yes, no, not sure)
- Annual salary range

PREVIOUS APPLICATIONS:
- Have you previously applied for any immigration benefits (yes - what and when, no)
- Have you ever been denied a visa or immigration benefit (yes - please explain, no)
- Have you worked with an immigration attorney before (yes - who, no)

CONSULTATION DETAILS:
- Preferred consultation format (in-person at our office, phone call, video call)
- Preferred date/time for consultation
- Do you need an interpreter (yes - what language, no)
- Any urgent deadlines we should know about`,
      badPrompt: 'Collect name, visa type, and what they need',
      exampleConversation: [
        { role: 'bot', text: "Welcome! Let's help you with your immigration needs. What's your full name?" },
        { role: 'user', text: 'Maria Rodriguez' },
        { role: 'bot', text: "Thanks, Maria! What's your current immigration status?" },
        { role: 'user', text: 'H-1B visa' },
        { role: 'bot', text: "Got it - you're on an H-1B work visa. What are you hoping to achieve? Green card, citizenship, or something else?" },
        { role: 'user', text: 'Green card for me and my spouse' },
        { role: 'bot', text: "Perfect - we can help with family-based green card applications. Since you mentioned your spouse, should we include them in this case as well?" }
      ]
    },
    {
      industry: '🏗️ Construction & Contractors',
      icon: '🔧',
      gradient: 'from-orange-500 to-amber-500',
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      description: 'For contractors, builders, and project managers',
      goodPrompt: `I'm a general contractor specializing in commercial and industrial projects including renovations, equipment installations, and new construction. I need comprehensive project information to provide accurate quotes.

CONTACT & COMPANY INFORMATION:
- Your name and title
- Company name (if applicable)
- Phone number and email
- Project location (full address)
- How did you hear about us (Google, referral, past client, industry directory, LinkedIn)

PROJECT OVERVIEW:
- Project name/description
- Type of project (commercial renovation, industrial equipment installation, new construction, facility upgrade, emergency repair, tenant improvement, other)
- Industry/facility type (manufacturing plant, office building, retail space, warehouse, restaurant, medical facility, other)
- Estimated project square footage (under 5,000 sq ft, 5,000-20,000 sq ft, 20,000-50,000 sq ft, 50,000+ sq ft, not sure)

SCOPE OF WORK:
- Detailed description of work needed
- Is this a complete renovation or specific systems only (complete renovation, HVAC only, electrical only, structural, equipment installation, multiple systems, other)
- Do you have architectural/engineering plans already (yes - complete plans, yes - preliminary plans, no - need design-build, no - need help developing plans)
- Do you need us to provide engineering services (yes, no, already contracted separately, not sure what's needed)

PROJECT TEAM & MANAGEMENT:
- Who is managing this project (you directly, project manager, construction manager, architect, engineer, not determined yet)
- Is there an architect or engineer already involved (yes - who, no - need referral, no - not needed, design-build preferred)
- Do you need value engineering to optimize costs (yes, no, not sure what this means)
- Do you want us to review third-party designs/plans before construction (yes, no, plans are already final)

TIMELINE & SCHEDULE:
- Desired project completion date
- Is this date firm or flexible (firm deadline - why, flexible, very flexible)
- When do you want to start (immediately, within 1 month, 1-3 months, 3-6 months, 6+ months, timing flexible)
- Are there any seasonal constraints (must avoid winter, must complete before busy season, facility shutdown required, 24/7 operation - work around it)
- Will this be phased construction (yes - multiple phases, no - all at once, open to recommendations)

BUDGET INFORMATION:
- Total project budget range (under $100K, $100K-$250K, $250K-$500K, $500K-$1M, $1M-$5M, $5M+, need estimate to determine)
- Budget for Phase 0 planning/engineering (under $5K, $5K-$10K, $10K-$25K, $25K-$50K, $50K+, not sure, need recommendation)
- Funding source (company capital budget, loan/financing needed, investor funded, grant funded, multiple sources)
- Is budget firm or can it flex for unforeseen conditions (firm - cannot exceed, some flexibility, very flexible)

SITE CONDITIONS:
- Is facility operational during construction (yes - must remain operational, yes - can accommodate shutdown periods, no - facility is empty, partially operational)
- Any hazardous materials concerns (asbestos, lead paint, chemical storage, underground tanks, none known, environmental assessment needed)
- Site access restrictions (limited access hours, security clearance required, residential area - quiet hours, none)
- Existing utility shutdowns required (yes - can coordinate, yes - very limited windows, no shutdowns allowed, not sure)

PERMITS & COMPLIANCE:
- Do you have permits (yes - approved, yes - in progress, no - need help obtaining, no - think we're exempt, not sure if needed)
- Special code requirements (healthcare/hospital codes, food service, clean room, OSHA industrial, seismic upgrade, accessibility/ADA, other)
- Required certifications (LEED, prevailing wage, DBE requirements, union labor, none)

ADDITIONAL SERVICES:
- Do you need help with (equipment procurement, startup/commissioning, operator training, maintenance planning, warranty management, none of these, not sure)
- Post-construction needs (ongoing maintenance contract, service agreement, just warranty, spare parts stocking, none needed)`,
      badPrompt: 'Get project details and budget',
      exampleConversation: [
        { role: 'bot', text: "Let's talk about your project! What should we call it?" },
        { role: 'user', text: 'Industrial Plant Boiler Replacement' },
        { role: 'bot', text: "Industrial Plant Boiler Replacement - that's a significant project! 🏭 What type of work is this exactly?" },
        { role: 'user', text: 'Full boiler system replacement and equipment installation' },
        { role: 'bot', text: "A full boiler replacement in an industrial plant - this will need careful planning. What's your timeline for completion?" },
        { role: 'user', text: 'December 2025' },
        { role: 'bot', text: "December 2025 - that gives us solid lead time to plan this right. What's your budget for the initial planning phase (Phase 0)?" }
      ]
    },
    {
      industry: '💻 SaaS & Tech',
      icon: '🚀',
      gradient: 'from-purple-500 to-violet-500',
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      description: 'For software companies and tech consultants',
      goodPrompt: `I run a custom software development agency specializing in web applications, mobile apps, and SaaS products. I need comprehensive information for project scoping and accurate quotes.

COMPANY & CONTACT INFORMATION:
- Company name and industry
- Your name and role (CEO, CTO, Product Manager, Founder, other)
- Company size (solo founder, 2-10 employees, 11-50, 51-200, 200+)
- Email and phone number
- Company website (if you have one)
- How did you find us (Google search, referral from [who], LinkedIn, Clutch, portfolio, other)

PROJECT OVERVIEW:
- What problem are you trying to solve (detailed description)
- Who is the end user/customer (B2B clients, B2C consumers, internal team, enterprise customers, specific industry)
- What is your business model (SaaS subscription, one-time purchase, freemium, marketplace/commission, ads, other)
- Is this a new product or enhancement to existing (brand new product, major new feature, enhancements to existing, rebuild/migration, MVP/prototype)

TECHNICAL REQUIREMENTS:
- Platform needed (web application, iOS app, Android app, both iOS and Android, desktop application, backend/API only, full stack, not sure yet)
- Current tech stack if existing product (React, Vue, Angular, Node.js, Python/Django, Ruby on Rails, .NET, Java/Spring, PHP, other, greenfield project)
- Integrations needed (payment processing - Stripe/PayPal, authentication - Auth0/SSO, email - SendGrid/Mailchimp, CRM - Salesforce, calendar, APIs, other, none, not sure)
- Third-party services (AWS, Google Cloud, Azure, Heroku, Vercel, Firebase, Supabase, other, need recommendations)
- Database requirements (PostgreSQL, MySQL, MongoDB, Firebase, complex data modeling needed, simple data storage, not sure)

DESIGN & USER EXPERIENCE:
- Do you have designs ready (yes - complete Figma/Sketch files, yes - wireframes only, no - need design services, no - have brand guidelines to follow, no - need full design)
- Design style preference (modern/minimalist, corporate/professional, playful/creative, luxurious/premium, match existing brand, need guidance)
- Do you need user research/UX (yes - comprehensive user research, yes - basic usability testing, no - we know our users well, not sure)

PROJECT SCOPE & FEATURES:
- Core features needed (list the must-have features)
- Nice-to-have features (list features that could wait for v2)
- Admin panel needed (yes - comprehensive admin, yes - basic management, no admin needed)
- User roles and permissions (multiple user types with different permissions, single user type, admin + users only, complex role system)
- Content management (need CMS functionality, static content only, heavy content creation features)

TIMELINE & BUDGET:
- When do you need this launched (ASAP - under 3 months, 3-6 months, 6-12 months, 12+ months, flexible)
- Why this timeline (investor deadline, conference/event, competitive pressure, customer commitment, internal goal, flexible)
- Estimated budget range (under $25K, $25K-$50K, $50K-$100K, $100K-$250K, $250K+, need estimate first)
- Funding status (bootstrapped/self-funded, VC backed, enterprise budget, grant funded, pre-revenue, other)
- Preferred engagement model (fixed price project, monthly retainer, time and materials, equity partnership, not sure - need advice)

TEAM & RESOURCES:
- Do you have technical team members (yes - full team, yes - some developers, yes - CTO/technical cofounder only, no - fully outsourced, hiring in parallel)
- Who will manage this project on your side (you directly, dedicated PM, technical lead, need help with PM, not sure)
- Do you need ongoing support post-launch (yes - full maintenance and updates, yes - just hosting and bug fixes, yes - training our team to manage, no - hand off completely)

EXISTING ASSETS:
- Do you have (existing codebase to build on, API documentation, brand guidelines, content/copywriting, user data to migrate, analytics setup, none of these)
- Code quality of existing system if applicable (well-maintained and documented, works but needs refactoring, legacy system - partial rebuild needed, complete rebuild required)

COMPLIANCE & SECURITY:
- Any special requirements (HIPAA healthcare data, SOC 2 compliance, GDPR, PCI-DSS payments, accessibility WCAG, none, not sure what's needed)
- Security needs (standard best practices fine, handling sensitive data - extra security, financial/payment data, need security audit, enterprise-level security)

SUCCESS METRICS:
- How will you measure success (user growth targets, revenue targets, engagement metrics, operational efficiency, customer satisfaction, other)
- Expected user scale at launch (under 100 users, 100-1000, 1K-10K, 10K-100K, 100K+, not sure)`,
      badPrompt: 'Company name, what they need, timeline, budget',
      exampleConversation: [
        { role: 'bot', text: "Thanks for reaching out! What's your company name?" },
        { role: 'user', text: 'TechFlow Solutions' },
        { role: 'bot', text: "Great to meet you, TechFlow Solutions! What challenge are you looking to solve?" },
        { role: 'user', text: 'We need to build a custom CRM for our sales team' },
        { role: 'bot', text: "A custom CRM - that's exciting! 📊 What's your current tech stack, so we can ensure compatibility?" },
        { role: 'user', text: 'React frontend, Node.js backend, PostgreSQL database' },
        { role: 'bot', text: "Perfect - we work extensively with that stack. Do you have existing designs or specs, or do you need us to help with that too?" }
      ]
    },
    {
      industry: '🏥 Healthcare & Wellness',
      icon: '💊',
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      description: 'For healthcare providers and wellness coaches',
      goodPrompt: `I'm a certified sleep coach helping clients overcome insomnia and improve sleep quality through science-based techniques. I need comprehensive information for personalized sleep improvement programs.

CONTACT INFORMATION:
- Full name
- Age range (18-30, 31-45, 46-60, 61+)
- Email and phone number
- Time zone and preferred contact time
- How did you find me (Google, Instagram, referral from [name], podcast, article, TikTok, other)

SLEEP CHALLENGE:
- What is your primary sleep issue (can't fall asleep - racing mind, can't fall asleep - not tired, wake up multiple times, wake too early can't go back, poor sleep quality, nightmares/sleep terrors, snoring/sleep apnea suspected, irregular schedule, other)
- How long have you struggled with this (less than 3 months, 3-6 months, 6-12 months, 1-3 years, 3+ years, my whole life)
- Rate severity (mild - occasionally affects me, moderate - affects me most nights, severe - every night significantly impacted, debilitating - impacts daily functioning)

CURRENT SLEEP PATTERNS:
- What time do you typically try to fall asleep (before 9pm, 9-10pm, 10-11pm, 11pm-midnight, after midnight, varies widely)
- How long does it take you to fall asleep (under 15 min, 15-30 min, 30-60 min, 1-2 hours, 2+ hours, varies)
- How many hours of actual sleep do you get per night (under 4, 4-5, 5-6, 6-7, 7-8, 8+, very inconsistent)
- What time do you wake up (before 5am, 5-6am, 6-7am, 7-8am, after 8am, varies daily)
- Do you nap during the day (yes - regularly, yes - occasionally, no - never, no - I want to but can't)

WHAT YOU'VE TRIED:
- Sleep aids tried (melatonin, prescription sleep medication - which ones, CBD, herbal supplements, magnesium, over-the-counter sleep aids, sleep apps, none, other)
- Behavioral approaches tried (meditation, CBT-I, sleep hygiene changes, limiting screen time, sleep restriction, stimulus control, therapy, reading before bed, white noise, none, other)
- How well did they work (very effective initially then stopped, somewhat helpful, no improvement, made it worse, haven't been consistent enough to tell)

CURRENT MEDICATIONS & HEALTH:
- Do you currently take sleep medication (yes - prescription [name and dosage], yes - over the counter, no - but have before, no - never have)
- Other medications or supplements (list any regular medications)
- Do you have diagnosed conditions (anxiety, depression, chronic pain, ADHD, sleep apnea, restless leg syndrome, PTSD, hormone imbalance, thyroid issues, none, other)
- Are you currently in therapy or counseling (yes, no, was previously)

LIFESTYLE & ENVIRONMENT:
- Work schedule (regular 9-5, irregular shifts, night shifts, rotating shifts, work from home, unemployed/retired, student)
- Typical bedtime routine (have consistent routine, minimal routine, no routine - varies, fall asleep on couch/TV, pass out from exhaustion)
- Bedroom environment (dark and cool, somewhat dark, street lights/light pollution, noisy environment, share bed with partner/pet, comfortable mattress, uncomfortable mattress, temperature issues)
- Evening habits (screen time until bed, evening exercise, caffeine after 2pm, alcohol before bed, large meals before bed, work in bedroom, TV in bedroom)

STRESS & MENTAL HEALTH:
- Current stress level (low, moderate, high, extreme/overwhelming)
- Primary stressors (work, finances, relationships, health, family, major life changes, trauma, general anxiety, other)
- When you can't sleep, what's going through your mind (racing thoughts about tomorrow, worrying about not sleeping, replaying the day, creative ideas, nothing specific - just alert, anxiety/panic, other)
- Do you experience anxiety (yes - diagnosed, yes - undiagnosed but I know I have it, sometimes, rarely, no)

GOALS & PREFERENCES:
- Primary goal (fall asleep faster, stay asleep through night, wake feeling rested, establish consistent schedule, reduce medication dependence, manage stress better, all of these)
- What would successful sleep look like for you (detailed description)
- Preferred approach (science-based behavioral techniques, holistic/natural methods, combination approach, open to anything that works)
- Commitment level (ready to make significant changes, open to moderate changes, prefer minimal disruption, just want quick fixes, not sure what's required)

PROGRAM PREFERENCES:
- Preferred format (1-on-1 video coaching, group program, self-paced online course, combination, phone sessions, in-person if local)
- How soon do you want to start (immediately, within 2 weeks, within a month, just exploring for now)
- Investment range (under $500, $500-$1000, $1000-$2000, $2000+, need to know program details first)`,
      badPrompt: 'Name, sleep problem, what they want',
      exampleConversation: [
        { role: 'bot', text: "Welcome! I'm here to help you sleep better. What's your name?" },
        { role: 'user', text: 'Sarah Chen' },
        { role: 'bot', text: "Thanks Sarah! What's your biggest sleep challenge right now?" },
        { role: 'user', text: 'I can\'t fall asleep - my mind races for hours' },
        { role: 'bot', text: "Racing mind at bedtime - that's so frustrating. 😔 How long have you been dealing with this?" },
        { role: 'user', text: 'About 6 months' },
        { role: 'bot', text: "Six months is a long time to struggle. What have you tried so far to calm your mind at night?" }
      ]
    },
    {
      industry: '🎨 Creative Services',
      icon: '✨',
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'from-cyan-50 to-blue-50',
      border: 'border-cyan-200',
      description: 'For designers, artists, and creative agencies',
      goodPrompt: `I'm a brand designer specializing in complete rebrands for small businesses and startups. I create cohesive brand identities including logos, color systems, typography, and brand guidelines.

BUSINESS INFORMATION:
- Business name
- Industry/type of business (retail, restaurant, professional services, e-commerce, SaaS, nonprofit, B2B, B2C, other)
- How long in business (brand new - pre-launch, under 1 year, 1-3 years, 3-5 years, 5+ years)
- Your name and role (owner, founder, marketing director, hired to oversee rebrand, other)
- Email and phone
- Website URL if you have one
- How did you find me (Instagram, Google, referral from [who], Behance, Dribbble, past client, other)

CURRENT BRAND SITUATION:
- Do you have existing branding (yes - full brand identity, yes - just a logo, yes - DIY branding, no - starting from scratch)
- What don't you like about your current brand (looks dated/old, too generic/forgettable, doesn't match our quality, inconsistent, did it myself and it shows, appeals to wrong audience, competitors look better, other)
- What DO you like about current brand that we should keep (colors, certain elements, general vibe, nothing - full refresh)
- Do you have existing brand guidelines (yes - comprehensive, yes - basic document, no - nothing documented, not sure what this means)

TARGET AUDIENCE:
- Who is your ideal customer (age range, income level, lifestyle, values)
- Where do they spend time (Instagram, LinkedIn, Pinterest, TikTok, in-person shops, high-end boutiques, mass market retailers, other)
- What do they value (luxury/exclusivity, affordability, sustainability, convenience, craftsmanship, innovation, tradition, other)

BRAND PERSONALITY & STYLE:
- How should your brand feel (modern/cutting-edge, timeless/classic, playful/fun, serious/professional, luxurious/premium, approachable/friendly, bold/edgy, minimal/clean, warm/organic, other)
- Industry perception you want (industry leader, accessible expert, premium/exclusive, disruptor/innovative, trusted/established, creative/unique, other)
- Descriptive words for your brand (pick 3-5: innovative, trustworthy, elegant, playful, bold, sustainable, authentic, luxurious, approachable, professional, creative, other)

COMPETITIVE LANDSCAPE:
- Who are your main competitors (list 2-3 competitors)
- What do you like about competitor brands (their specific design elements, colors, overall vibe, nothing)
- How do you want to differentiate (more premium, more approachable, more modern, different audience, unique angle, other)
- Brands you admire (not necessarily competitors - any brands whose visual identity you love)

PROJECT SCOPE & DELIVERABLES:
- What do you need (logo design - primary and variations, color palette, typography system, brand guidelines document, business cards, letterhead, social media templates, website design, packaging, signage, other)
- Logo type preference (just text/wordmark, icon + text, icon only - like Apple/Nike, combination mark, flexible - show me options, not sure)
- How many logo concepts to explore (see 2-3 directions, see 5+ options, trust your expertise - one strong direction, not sure)

EXISTING ASSETS & CONSTRAINTS:
- Do you have (existing tagline to keep, color constraints - building/space colors to match, existing packaging to coordinate with, franchising rules, corporate parent company, none of these)
- Do you need to maintain elements (yes - must keep certain equity, no - complete freedom, some flexibility)
- Any specific requirements (must include specific symbol/icon, must work in 1-color, must work very small - app icon, must work very large - signage, needs to work internationally, other)

CONTENT & MESSAGING:
- Do you have brand messaging/positioning (yes - clear mission and values, somewhat - needs refining, no - need help with this too)
- Do you need copywriting (yes - tagline, yes - full messaging, yes - website copy, no - we have copywriter, no - handling internally)
- Brand story/origin (compelling founder story, unique process/approach, mission-driven, family legacy, other - tell me)

TIMELINE & BUDGET:
- When do you need this completed (ASAP - under 1 month, 1-2 months, 2-3 months, 3-6 months, no hard deadline)
- Why this timeline (launching business, rebranding event, trade show, investor presentation, website launch, organic timing, other)
- Budget range (under $5K, $5K-$10K, $10K-$25K, $25K-$50K, $50K+, need scope first to determine)
- What's included in budget (design only, design + website, design + print materials, full rebrand + implementation, not sure yet)

IMPLEMENTATION:
- Who will implement the designs (us - we have designer, us - we'll do it ourselves, you - need full-service, vendors - need print-ready files, not sure yet)
- Do you need (trademark search, brand strategy workshop, stakeholder presentations, brand training for team, ongoing brand support, launch announcement materials, none of these)

SUCCESS CRITERIA:
- How will you know the rebrand succeeded (attract new customer segment, premium pricing justified, increased brand recognition, team pride in brand, stand out from competitors, sales increase, other)
- Biggest fear about rebranding (losing existing customers, looking too different, not resonating, wasting money, making wrong choice, timeline delays, other)`,
      badPrompt: 'Business name, what they want designed, budget',
      exampleConversation: [
        { role: 'bot', text: "Excited to help with your rebrand! What's your business name?" },
        { role: 'user', text: 'Sweet Petals Bakery' },
        { role: 'bot', text: "Sweet Petals Bakery - what a lovely name! 🌸 What don't you like about your current branding?" },
        { role: 'user', text: 'It feels too corporate and doesn\'t match our handmade, artisanal vibe' },
        { role: 'bot', text: "I hear you - handmade artisanal should feel warm and authentic, not corporate. What personality do you want your new brand to have?" },
        { role: 'user', text: 'Elegant but approachable, artisanal, feminine' },
        { role: 'bot', text: "Beautiful! 'Elegant but approachable artisanal' - I can already envision this. Who's your ideal customer?" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <Card className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              The Secret to Amazing Bots: Detailed Prompts
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed">
              Your bot's conversation quality is directly determined by your prompt quality. The more specific and detailed you are, the smarter and more helpful your bot becomes.
            </p>
          </div>
        </div>

        {/* Good vs Bad Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bad Prompt */}
          <div className="p-6 bg-white/80 rounded-xl border-2 border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900">❌ Vague Prompt (Poor Results)</h3>
            </div>
            <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <p className="text-sm text-red-800 font-mono">"Need names, date, location, budget"</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Bot won't understand your industry</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Generic, robotic questions</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Misses important context</span>
              </p>
            </div>
          </div>

          {/* Good Prompt */}
          <div className="p-6 bg-white/80 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">✅ Detailed Prompt (Great Results)</h3>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg mb-4 border border-emerald-200">
              <p className="text-sm text-emerald-800 font-mono">"I'm a wedding photographer. I need couple's names, wedding date, venue, guest count, package interest (basic/premium/luxury), budget, Pinterest boards..."</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Shows domain expertise</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Asks intelligent, contextual questions</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Connects information meaningfully</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('examples')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'examples'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Industry Templates
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'conversations'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Example Conversations
        </button>
      </div>

      {/* Industry Templates Grid */}
      {activeTab === 'examples' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {industryTemplates.map((template, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-br ${template.bg} border-2 ${template.border} shadow-xl hover:shadow-2xl transition-all duration-300 group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{template.industry}</h3>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </div>
                </div>
              </div>

              {/* Good Prompt Example */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Good Prompt
                  </Badge>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border border-emerald-200 text-sm text-slate-700 font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {template.goodPrompt}
                </div>
              </div>

              <Button
                onClick={() => onSelectTemplate?.(template.goodPrompt)}
                className={`w-full bg-gradient-to-r ${template.gradient} hover:opacity-90 shadow-lg`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use This Template
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Example Conversations */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {industryTemplates.map((template, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-br ${template.bg} border-2 ${template.border} shadow-xl`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center text-xl shadow-lg`}>
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{template.industry}</h3>
                  <p className="text-xs text-slate-600">Example conversation flow</p>
                </div>
              </div>

              <div className="space-y-3">
                {template.exampleConversation.map((message, msgIdx) => (
                  <div key={msgIdx} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                        : 'bg-white border-2 border-purple-200'
                    }`}>
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-white/80 text-slate-700 border border-slate-200'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-emerald-300">
                <p className="text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Notice how the bot shows domain knowledge and connects each answer
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

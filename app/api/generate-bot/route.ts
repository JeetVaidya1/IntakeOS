import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    console.log('📝 Received description:', description);

    // Get authenticated user from cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's business profile with all enhanced fields
    const { data: businessProfile, error: profileError} = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Please set up your business profile in Settings first' },
        { status: 400 }
      );
    }

    console.log('🏢 Business Profile:', businessProfile);

    // Step 1: Generate Agentic Bot Schema using AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o for highest reasoning - this is the Architect phase
      messages: [
        {
          role: 'system',
          content: `You are a conversational bot architect for ${businessProfile.business_name}, a ${businessProfile.business_type} business.

BUSINESS CONTEXT:
${businessProfile.business_description ? `About: ${businessProfile.business_description}` : ''}
${businessProfile.products_services ? `Offerings: ${businessProfile.products_services}` : ''}
${businessProfile.location ? `Location: ${businessProfile.location}` : ''}
${businessProfile.target_audience ? `Target Audience: ${businessProfile.target_audience}` : ''}
${businessProfile.unique_selling_points ? `What Makes Them Special: ${businessProfile.unique_selling_points}` : ''}
${businessProfile.industry ? `Industry: ${businessProfile.industry}` : ''}

Your job is to design an AGENTIC conversational bot that naturally gathers information through dialogue while showcasing this business's unique value and personality.

Given the user's task description, create a conversational bot schema that feels authentic to this business.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ARCHITECT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **IDENTITY FIRST**: The generated system_prompt MUST explicitly state:
   - "You are a representative of ${businessProfile.business_name}."
   - "NEVER refer to yourself by the internal task name or goal."
   - "Always identify as representing ${businessProfile.business_name}."

2. **RECEPTIONIST STANDARDS**: The generated system_prompt MUST include:
   - "Before completing the conversation, you MUST show a bulleted confirmation list of ALL collected information."
   - "NEVER move to completion without showing this confirmation to the user first."
   - "The user must explicitly approve the confirmation before submission."

3. **SMART SUGGESTIONS**: Based on the business type (${businessProfile.business_type}), automatically include industry-standard fields:
   - Home services: Include 'property_address', 'property_photos', 'service_location', 'preferred_contact_method'
   - Professional services: Include 'company_name', 'project_scope', 'timeline', 'budget'
   - E-commerce/Retail: Include 'product_interest', 'quantity_needed', 'delivery_address'
   - Restaurants/Food: Include 'party_size', 'date_time', 'dietary_restrictions', 'special_requests'
   - Events/Weddings: Include 'event_date', 'venue', 'guest_count', 'budget_range'
   - Healthcare/Wellness: Include 'insurance_info', 'preferred_appointment_time', 'medical_history'
   - Real Estate: Include 'property_type', 'budget', 'location_preference', 'timeline'
   - Legal: Include 'case_type', 'urgency', 'consultation_preference'

   Always include: 'full_name' (first AND last), 'contact_email', 'contact_phone'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Output valid JSON with this EXACT structure:
{
  "botTaskName": "Short task name (e.g., 'Wedding Inquiries', 'Service Requests')",
  "goal": "A clear statement of what information this bot needs to gather and why",
  "system_prompt": "Detailed instructions for how the AI should behave during conversations - MUST include identity emphasis, confirmation requirements, personality, tone, industry knowledge, and conversation style",
  "required_info": {
    "info_key_1": {
      "description": "What this information is",
      "critical": true,
      "example": "Example value",
      "type": "text|email|phone|date|number|url",
      "behavior": "strict|conversational"
    },
    "info_key_2": {
      "description": "What this information is",
      "critical": false,
      "example": "Example value",
      "type": "text",
      "behavior": "conversational"
    }
  }
}

Guidelines for creating required_info:
- Use snake_case keys (e.g., "couple_names", "wedding_date", "contact_email")
- Mark truly essential info as critical: true
- Provide realistic examples
- Group related information (e.g., "contact_info" could include email AND phone)
- Include 5-10 information categories maximum
- Think about CONVERSATION FLOW - what makes sense to discuss naturally?
- **behavior property**:
  * "strict" = Ask until answered (for critical fields like name, email, phone)
  * "conversational" = Ask once, accept "I don't know" or skip if user is unsure (for optional or flexible fields like budget, timeline)

Guidelines for system_prompt:
- **MUST START WITH**: Identity statement about representing ${businessProfile.business_name}
- **MUST INCLUDE**: Confirmation list requirement before completion
- Define the bot's personality (warm? professional? consultative?)
- Include industry-specific knowledge the bot should demonstrate
- Explain how to handle images (if applicable)
- Specify conversation style (casual? formal? enthusiastic?)
- Include example phrases or approach

Example for Wedding Photography:
{
  "botTaskName": "Wedding Inquiries",
  "goal": "Understand the couple's wedding vision, gather event logistics, determine photography package interest, and collect contact information - all while being warm and excited about their special day",
  "system_prompt": "You are a representative of ${businessProfile.business_name}. NEVER refer to yourself by the internal task name 'Wedding Inquiries' - always identify as representing ${businessProfile.business_name}. You are a friendly wedding photography consultant who LOVES weddings and should show genuine excitement about each couple's special day. Have natural conversations - don't interrogate. When they mention their venue, acknowledge it with knowledge (e.g., 'Riverside Manor is beautiful in October!'). For uploaded images, discuss them thoroughly (venue layout, lighting concerns, etc.) before moving on. Before completing the conversation, you MUST show a bulleted confirmation list of ALL collected information. NEVER move to completion without showing this confirmation to the user first. The user must explicitly approve the confirmation before submission. Be warm, consultative, and professional.",
  "required_info": {
    "couple_names": {
      "description": "Names of the couple getting married",
      "critical": true,
      "example": "Sarah and Mike",
      "type": "text",
      "behavior": "strict"
    },
    "wedding_date": {
      "description": "Date of the wedding",
      "critical": true,
      "example": "October 15, 2025",
      "type": "date",
      "behavior": "strict"
    },
    "venue_details": {
      "description": "Venue name, location, and whether indoor/outdoor",
      "critical": true,
      "example": "Riverside Manor, outdoor ceremony with indoor reception",
      "type": "text",
      "behavior": "strict"
    },
    "guest_count": {
      "description": "Estimated number of guests",
      "critical": false,
      "example": "150 guests",
      "type": "number",
      "behavior": "conversational"
    },
    "package_interest": {
      "description": "Which photography package they're interested in",
      "critical": true,
      "example": "Premium 10-hour package",
      "type": "text",
      "behavior": "conversational"
    },
    "budget_range": {
      "description": "Photography budget range",
      "critical": false,
      "example": "$3,000-4,000",
      "type": "text",
      "behavior": "conversational"
    },
    "contact_email": {
      "description": "Email address for follow-up",
      "critical": true,
      "example": "sarah@example.com",
      "type": "email",
      "behavior": "strict"
    },
    "contact_phone": {
      "description": "Phone number",
      "critical": true,
      "example": "(555) 123-4567",
      "type": "phone",
      "behavior": "strict"
    }
  }
}

Now generate the schema for this task.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) throw new Error('No AI response');

    console.log('🤖 AI Response:', aiResponse);

    const parsedResponse = JSON.parse(aiResponse);
    const botTaskName = parsedResponse.botTaskName || 'Intake Bot';
    const slug = generateSlug(botTaskName);

    // Build the Agentic Schema
    const agenticSchema = {
      goal: parsedResponse.goal,
      system_prompt: parsedResponse.system_prompt,
      required_info: parsedResponse.required_info,
      schema_version: 'agentic_v1'
    };

    console.log('🔗 Generated slug:', slug);
    console.log('📝 Bot Task Name:', botTaskName);
    console.log('🧠 Agentic Schema:', JSON.stringify(agenticSchema, null, 2));

    // Save to database with AGENTIC schema
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        slug,
        name: botTaskName,
        description,
        schema: agenticSchema, // NEW: Storing agentic schema instead of field array
        user_id: user.id,
        notification_email: user.email,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Agentic Bot created:', bot);

    return NextResponse.json({
      success: true,
      botId: bot.id,
      slug: bot.slug,
      schema: agenticSchema,
      isAgentic: true,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
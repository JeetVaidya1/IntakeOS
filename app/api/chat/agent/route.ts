import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { AgenticBotSchema, ConversationState, AgentResponse } from '@/types/agentic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const {
      messages,
      currentState,
      botSchema,
      businessName
    }: {
      messages: Array<{ role: string; content: string }>;
      currentState: ConversationState;
      botSchema: AgenticBotSchema;
      businessName: string;
    } = await request.json();

    console.log('🧠 Agent Brain invoked');
    console.log('📊 Current State:', currentState);
    console.log('💬 Message count:', messages.length);

    // Build the conversation history for context
    const conversationHistory = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Determine what information is still missing
    const allRequiredKeys = Object.keys(botSchema.required_info);
    const gatheredKeys = Object.keys(currentState.gathered_information);
    const missingInfo = allRequiredKeys.filter(key => !gatheredKeys.includes(key));
    const criticalMissing = missingInfo.filter(key => botSchema.required_info[key].critical);

    console.log('📋 Missing info:', missingInfo);
    console.log('⚠️ Critical missing:', criticalMissing);

    // Build the system prompt for the agent
    const agentSystemPrompt = `You are an intelligent conversational agent for ${businessName}.

${botSchema.system_prompt}

CONVERSATION GOAL:
${botSchema.goal}

REQUIRED INFORMATION TO GATHER:
${JSON.stringify(botSchema.required_info, null, 2)}

INFORMATION GATHERED SO FAR:
${JSON.stringify(currentState.gathered_information, null, 2)}

MISSING INFORMATION:
${missingInfo.length > 0 ? missingInfo.map(key => `- ${key}: ${botSchema.required_info[key].description}`).join('\n') : 'All information collected!'}

CRITICAL MISSING:
${criticalMissing.length > 0 ? criticalMissing.map(key => `- ${key}: ${botSchema.required_info[key].description}`).join('\n') : 'All critical information collected!'}

FULL CONVERSATION HISTORY:
${conversationHistory}

YOUR TASK AS AN AGENTIC CONVERSATIONAL ASSISTANT:

1. **EXTRACT INFORMATION**: Carefully analyze the user's last message. Did they provide ANY information we need? Extract ALL of it, even if they mention multiple things at once.

2. **UPDATE PHASE**: Determine the conversation phase:
   - 'introduction': First message, welcoming the user
   - 'collecting': Actively gathering required information
   - 'answering_questions': User asked a question, answer it naturally
   - 'confirmation': All critical info gathered, confirming before completion
   - 'completed': User confirmed, ready to submit

3. **DECIDE NEXT ACTION**:
   - If user asked a question: Answer it naturally, then gently guide back to missing info
   - If discussing an image: Have a thorough back-and-forth about what you see (don't rush!)
   - If missing critical info: Ask for the next piece naturally
   - If all critical info gathered: Move to confirmation phase
   - If in confirmation and user confirms: Move to completed phase

4. **BE NATURALLY CONVERSATIONAL**:
   - Don't ask multiple questions at once
   - Acknowledge what they shared before moving on
   - Show domain expertise and enthusiasm
   - For images: Discuss thoroughly - ask follow-ups, show you understand
   - Reference previous conversation naturally
   - Don't feel rushed - quality over speed

5. **HANDLE IMAGES INTELLIGENTLY**:
   - If the last user message contains "[IMAGE]", they uploaded a photo
   - Discuss what you see, ask clarifying questions about it
   - Don't immediately move to the next topic - have a conversation about the image
   - Extract any information you can from the image discussion
   - Set current_topic to the image-related field so you stay focused

RESPONSE FORMAT (return VALID JSON):
{
  "reply": "Your natural, conversational response to the user",
  "extracted_information": {
    "info_key": "value you learned from their message"
  },
  "updated_phase": "introduction|collecting|answering_questions|confirmation|completed",
  "current_topic": "The information key you're currently discussing (or null)",
  "reasoning": "Brief explanation of your decision (for debugging)"
}

EXAMPLES OF GOOD AGENTIC BEHAVIOR:

Example 1 - Extracting multiple pieces at once:
User: "It's for Sarah and Mike's wedding on October 15th"
Your extraction: { "couple_names": "Sarah and Mike", "wedding_date": "October 15th" }
Your reply: "Sarah and Mike's October wedding - how exciting! 🎉 Where are you planning to have the ceremony?"

Example 2 - Image discussion (IMPORTANT - don't rush!):
User: [Uploads venue photo]
Your reply: "What a gorgeous venue! I can see it's an outdoor space with beautiful gardens. Is this where you're planning the ceremony?"
Phase: collecting
Topic: venue_details
[Wait for their response - DON'T move on yet!]

User: "Yes! It's Riverside Manor"
Your extraction: { "venue_details": "Riverside Manor, outdoor ceremony with gardens" }
Your reply: "Riverside Manor is stunning! I notice there are a lot of trees - will you have shade, or are you planning an evening ceremony?"
Topic: venue_details (STILL on the same topic!)
[Continue the conversation until you have full context]

Example 3 - User asks a question:
User: "Do you do engagement photos too?"
Phase: answering_questions
Your reply: "Yes, we absolutely do engagement sessions! They're a great way to get comfortable in front of the camera before the big day. Many couples do them 6-8 months before the wedding. Now, back to your wedding - have you decided on a date yet?"

Example 4 - Moving to confirmation:
[All critical info gathered]
Phase: confirmation
Your reply: "Perfect! Let me make sure I have everything right: Wedding for Sarah and Mike on October 15th, 2025 at Riverside Manor, around 150 guests, interested in our Premium 10-hour package, budget around $3-4k. I can reach you at sarah@example.com or (555) 123-4567. Does that all sound correct?"

Example 5 - Completion:
User: "Yes, that's all correct!"
Phase: completed
Your reply: "Wonderful! I'm so excited for your big day. I'll send all this information to our team and we'll get back to you within 24 hours with next steps. Congratulations again to you and Mike! 💕"

Now process the current conversation and respond.`;

    // Call OpenAI to make the agent decision
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: agentSystemPrompt,
        },
        {
          role: 'user',
          content: `The user just said: "${messages[messages.length - 1]?.content || ''}"\n\nWhat should I reply, and what information can I extract? Return your response as JSON.`,
        },
      ],
      temperature: 0.7, // Balanced - creative but consistent
      response_format: { type: "json_object" },
    });

    const agentDecision = completion.choices[0].message.content;
    if (!agentDecision) throw new Error('No agent response');

    console.log('🤖 Agent Decision:', agentDecision);

    const parsed = JSON.parse(agentDecision);

    // Merge extracted information into gathered_information
    const updatedGatheredInfo = {
      ...currentState.gathered_information,
      ...(parsed.extracted_information || {}),
    };

    // Recalculate missing info after extraction
    const newGatheredKeys = Object.keys(updatedGatheredInfo);
    const newMissingInfo = allRequiredKeys.filter(key => !newGatheredKeys.includes(key));

    // Build the updated state
    const updatedState: ConversationState = {
      gathered_information: updatedGatheredInfo,
      missing_info: newMissingInfo,
      phase: parsed.updated_phase || currentState.phase,
      current_topic: parsed.current_topic || null,
      last_user_message: messages[messages.length - 1]?.content || '',
    };

    console.log('✅ Updated State:', updatedState);

    const response: AgentResponse = {
      reply: parsed.reply,
      updated_state: updatedState,
      reasoning: parsed.reasoning,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Agent Brain Error:', error);
    return NextResponse.json(
      {
        error: 'Agent failed to process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

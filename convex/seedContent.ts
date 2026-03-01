import { mutation } from "./_generated/server";

const tweets = [
  {
    text: "I have 8 agents running on my laptop right now.\n\nNot chatbots. Not assistants. Agents with names, memory, and their own communication channels.\n\nOne orchestrates everything. One handles sales outreach. One writes content. One literally exists just to say \"no\" when the others try to spend too much money.\n\nEach one has an identity file that defines who they are, what they care about, and what they're allowed to do.\n\nThey talk to each other through Discord. I mostly just watch.\n\nTook about 3 weeks to stop micromanaging them. That was the hardest part.",
    pillar: "Build in Public",
    scheduledTime: "8-9 AM",
  },
  {
    text: "Most people treat their agents like interns. Give them a task, watch them do it, fix their mistakes, repeat.\n\nThat's not an agent. That's a chatbot with extra steps.\n\nThe shift happened for me when I stopped giving instructions and started writing identity files.\n\nWho is this agent? What does it care about? What should it refuse to do?\n\nOnce I defined that, I stopped babysitting.\n\nThe agent started making better decisions than my instructions would have allowed.",
    pillar: "Hot Take",
    scheduledTime: "12-1 PM",
  },
  {
    text: "5 things nobody told me about running multiple agents:\n\n1. They need separate memory. If one agent can see what all the others are doing, it gets confused and starts \"helping\" where it shouldn't.\n\n2. Identity files matter more than prompts. A well-defined agent with a mediocre prompt outperforms a generic agent with a perfect prompt.\n\n3. You need a budget enforcer. I built an agent whose only job is to block tasks that cost too much. Best decision I made.\n\n4. Discord channels > Slack > email for agent communication. Each agent gets its own channel. Clean separation.\n\n5. The first week is chaos. The third week is when things start compounding. Don't quit in week one.",
    pillar: "Educational",
    scheduledTime: "3-4 PM",
  },
  {
    text: "The agent that saves me the most time isn't the one that writes content or does research.\n\nIt's the one that says no.\n\nI have a finance agent whose only job is to enforce spending limits. Every other agent has to get approval before doing anything that costs money.\n\nNo negotiations. No exceptions. Just rules.\n\nYesterday it blocked a task, and the sales agent automatically reformulated a cheaper version that worked better.\n\nConstraints don't slow agents down. They make them creative.",
    pillar: "Observation",
    scheduledTime: "8-9 PM",
  },
  {
    text: "No co-founder. No team. No funding round.\n\nJust me and 8 agents.\n\nThe agents handle research, outreach, content, quality checks, and budget enforcement. I handle strategy and saying yes or no.\n\nPeople keep telling me to hire. To raise money. To \"build a proper team.\"\n\nBut I've seen what happens when you scale headcount before you scale systems. You end up managing people instead of building things.\n\nI'd rather spend 3 weeks teaching an agent to do something right than 3 months managing a person who does it differently every time.\n\nThis isn't about replacing people. It's about not needing to hire until you absolutely have to.",
    pillar: "Build in Public",
    scheduledTime: "9:30 PM",
  },
];

export const seedContent = mutation({
  handler: async (ctx) => {
    // Get Flint agent
    const flint = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", "Flint"))
      .first();

    let count = 0;
    for (const tweet of tweets) {
      await ctx.db.insert("content", {
        text: tweet.text,
        platform: "twitter" as const,
        pillar: tweet.pillar,
        scheduledTime: tweet.scheduledTime,
        status: "draft" as const,
        agentId: flint?._id,
        createdAt: Date.now() - (tweets.length - count) * 60000,
      });
      count++;
    }
    return { seeded: count };
  },
});

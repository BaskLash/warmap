// Central blog data source. Add a new post by appending to BLOGS — the
// overview page, dynamic post route, and sitemap all read from this list.
//
// `content` is markdown. Supported syntax (kept intentionally narrow):
//   ## heading
//   ### subheading
//   - / * list item
//   blank line       → paragraph break
//   **bold**, *italic*, [text](https://url)
//
// Anything else is rendered as plain paragraph text.

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string; // ISO YYYY-MM-DD
  readTime: number; // minutes
  category: string;
  author: string;
}

export const BLOGS: BlogPost[] = [
  {
    slug: "why-you-never-see-the-full-war",
    title: "Why You Never See the Full War",
    description:
      "You don’t lack information. You lack visibility. Here’s why the real picture of global conflicts never reaches you.",
    date: "2026-04-25",
    readTime: 4,
    category: "Geopolitics",
    author: "WarTrackerLive Team",
    content: `You think you see what’s happening in the world.

You open Google. You read the news. You scroll through headlines.

But what you see is not reality.

It’s a filtered version of it.

## You only see what you look for

If something happens somewhere in the world — a conflict, a shooting, an escalation — you won’t see it unless you actively search for it.

You have to guess the right keyword.

The right country.

The right moment.

If you don’t, it never reaches you.

## The world doesn’t wait for your search

Events don’t happen when you type them into Google.

They happen continuously — across countries, cities, and regions you’re not actively thinking about.

While you’re unaware, situations evolve.

Conflicts escalate.

And entire narratives form without you ever seeing the beginning.

## News shows fragments, not the full picture

Traditional news gives you pieces.

One article.

One perspective.

One moment in time.

But war is not a single moment.

It’s a chain of events — reactions, responses, consequences.

And when you only see one piece, you misunderstand the whole.

## Why this platform exists

This platform was built to remove that limitation.

You don’t have to search anymore.

You don’t have to guess what matters.

You see events as they start gaining attention — automatically.

## See conflicts as they unfold

Instead of isolated headlines, you see:

- Multiple sources reporting on the same event
- Different perspectives forming in real time
- A live map showing where things are happening

You don’t just read about the world.

You watch it unfold.

---

You don’t need more information.

You need better visibility.

And that’s exactly what this platform gives you.`,
  },
  {
    slug: "the-delay-between-reality-and-news",
    title: "The Delay Between Reality and News",
    description:
      "What you call ‘news’ is often already outdated. Here’s why real-time awareness changes everything.",
    date: "2026-04-25",
    readTime: 5,
    category: "Geopolitics",
    author: "WarTrackerLive Team",
    content: `Something happens.

A conflict escalates. A shot is fired. A situation changes.

But you don’t see it.

Not immediately.

## News is always behind reality

Before information reaches you, it passes through layers:

Verification. Editing. Publishing.

Each step adds delay.

By the time you read it, the situation has already moved forward.

## You’re reacting to the past

Most people believe they are informed in real time.

In reality, they are reacting to something that has already happened.

A snapshot.

Not the current state.

## Why delay is dangerous

When you only see delayed information:

- You miss how events started
- You miss how they evolve
- You miss how different events connect

You only see outcomes — not the process behind them.

## Real awareness happens in motion

Understanding comes from seeing change as it happens.

Not after.

Not summarized.

But while it’s still unfolding.

## What this platform does differently

This platform removes the delay.

Instead of waiting for a single article, you see:

- Multiple trusted sources picking up an event
- Updates appearing as attention grows
- Information forming in real time

## From delayed news to live understanding

You’re no longer reading history.

You’re observing reality.

As it happens.

---

The difference is simple:

News tells you what happened.

This platform shows you what is happening.`,
  },
  {
    slug: "why-one-source-is-never-enough",
    title: "Why One Source Is Never Enough",
    description:
      "If you rely on a single source, you don’t understand the event—you inherit its perspective.",
    date: "2026-04-25",
    readTime: 5,
    category: "Geopolitics",
    author: "WarTrackerLive Team",
    content: `You read one article.

Maybe two.

And you think you understand what’s happening.

But you don’t.

## Every source tells a different story

No report is truly neutral.

Every source decides:

- What to include
- What to leave out
- How to frame the situation

That’s not manipulation.

It’s unavoidable.

## The illusion of understanding

When you rely on a single source, something subtle happens:

You stop questioning the perspective.

You accept it as reality.

And without realizing it, you adopt its bias.

## Conflicts are multi-sided

War is not one narrative.

It’s multiple sides, multiple interpretations, and constant change.

If you only see one version, you don’t understand the event.

You only understand one angle.

## Real clarity comes from comparison

Understanding emerges when you see differences:

- Where sources agree
- Where they contradict each other
- Where information is missing

That contrast is where real insight begins.

## Built for perspective

This platform brings multiple trusted sources together around the same event.

You don’t need to search for balance.

You see it instantly.

## Watch narratives form in real time

Instead of one fixed story, you see:

- Competing perspectives
- Evolving interpretations
- Real-time shifts in reporting

You don’t just consume information.

You analyze it.

---

The truth is rarely in a single headline.

It exists between them.

And that’s exactly where this platform puts you.`,
  },
];

export function getBlog(slug: string): BlogPost | undefined {
  return BLOGS.find((b) => b.slug === slug);
}

export function listBlogs(): BlogPost[] {
  return [...BLOGS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
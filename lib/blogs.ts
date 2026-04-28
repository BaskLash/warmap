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
      slug: "2026-04-product-launch-insights-user-growth",
  title: "What We Learned After Launch: Growth, Bots, and Real User Behavior",
  description:
    "A behind-the-scenes look at our product launch: how we reduced costs, improved quality, and discovered what really drives user engagement.",
  date: "2026-04-28",
  readTime: 4,
  category: "Product Updates",
  author: "WarTrackerLive Team",
  content: `Launching a new product is never just about going live.

It’s about observing, adapting, and learning — fast.

Over the past week, we’ve gathered valuable insights into how our platform performs under real-world conditions. Some of the results were expected. Others completely changed how we think about growth and user experience.

## The reality of early traffic

Like many new platforms, our initial traffic wasn’t purely human.

Bots played a noticeable role in the beginning — increasing API usage and creating noise in our data. But instead of ignoring it, we focused on optimizing our infrastructure.

The result?

We’ve reduced API usage so significantly that operating costs are now minimal — without sacrificing performance or quality.

## Efficiency without compromise

Cutting costs often comes at the expense of user experience.

Not here.

Our priority was clear from the start:
Maintain high quality while improving efficiency.

By refining how and when our systems make requests, we’ve built a setup that is both cost-effective and reliable — ensuring that every real user interaction remains smooth and responsive.

## What actually drives engagement

One of the most important insights came from user behavior.

We initially assumed that requiring users to log in would be a natural step.

But reality told a different story.

Direct access to the platform — without friction — led to noticeably higher engagement.

Users don’t want barriers.

They want immediate value.

## Why we’re doubling down on data

Right now, we’re just getting started.

To make smarter decisions moving forward, we’re preparing to implement deeper analytics across the platform. This will help us answer critical questions:

- Which features are actually being used?
- Where do users drop off?
- What creates real value — and what doesn’t?

Instead of guessing, we’ll let real data guide our next steps.

## Building based on reality, not assumptions

Too many products are built on what creators *think* users want.

We’re taking a different approach.

Every feature, every change, every improvement will be driven by actual usage — not assumptions.

Because in the end, success isn’t defined by what exists…

…but by what people truly use.

---

We’re just at the beginning.

And the platform is evolving quickly.

If you want to experience it yourself and see how it works in real time, now is the perfect moment to try it.`,
},
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
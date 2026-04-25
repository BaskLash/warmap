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
  readTime: string;
  category: string;
  author: string;
}

export const BLOGS: BlogPost[] = [
  {
    slug: "why-learning-platforms-keep-you-stuck",
    title: "Why Most Learning Platforms Keep You Stuck",
    description:
      "Online courses are built to retain you, not to graduate you. Here's the trap — and how to walk out.",
    date: "2026-04-22",
    readTime: "5 min read",
    category: "Mindset",
    author: "Olivier Lüthy",
    content: `You've bought the course. You've watched the videos at 1.5x. You've taken the notes nobody will ever read again. And you still can't do the thing.

That's not a *you* problem. That's the design working exactly as intended.

## The dopamine of starting

Every learning platform on the planet has discovered the same psychological loophole: the feeling of starting a course is almost identical to the feeling of progress. Press play, hear the intro music, watch the dashboard fill up — your brain pays out the same neurochemicals it would if you'd actually built something.

So you keep starting. You collect modules like trophies. The library grows. **Your output doesn't.**

## The illusion of completion

Completion is a metric the platform invented. It's a percent bar, not a skill. You can hit 100% on a JavaScript course and still freeze at a real bug. You can finish a marketing curriculum and still not know how to write a sales page someone will pay for.

Real skill is messier. It looks like:

- a half-built thing on your screen at 1 a.m.
- seventeen errors you don't understand
- no instructor to call

The progress bar can't capture that, so it doesn't try.

## The platform's incentive isn't yours

Be honest with yourself for thirty seconds: the company selling you the course is *not* optimising for your transformation. They're optimising for your monthly subscription.

Their best customer isn't the one who graduates. It's the one who keeps coming back, perpetually almost ready. If you actually got good, you'd cancel. So the product is engineered to keep you almost good. Always one more module away from the breakthrough.

## What real learning costs you

Real learning costs ego. It costs the moment you have to ship something embarrassing. It costs the email you send to a stranger asking for feedback you might not survive. It costs sitting with the gap between the version you imagined and the version you can produce today.

No course will sell you that, because nobody will buy it.

## The walk-out

Pick the smallest possible version of the thing you've been studying. Ship it **this week**. Not next quarter — this week. Hand it to someone whose opinion stings.

If you survive the sting, you've learnt more in seven days than the last seven months of curriculum gave you. If you don't ship, the platform was right about you. They priced the dream correctly.`,
  },
  {
    slug: "illusion-of-progress-modern-education",
    title: "The Illusion of Progress in Modern Education",
    description:
      "Degrees, dashboards, certificates — modern education is brilliant at simulating forward motion. The question is whether you've moved.",
    date: "2026-04-15",
    readTime: "6 min read",
    category: "Education",
    author: "Olivier Lüthy",
    content: `If the last decade had a soundtrack, it would be the click of someone enrolling in something. Bootcamps, masters, micro-credentials, AI tutors, productivity stacks — a billion-dollar industry that trades almost exclusively in the *feeling* of getting somewhere.

The uncomfortable question nobody on the marketing page wants you to ask: **are you actually getting somewhere?**

## Movement is not progress

It is entirely possible to spend ten years in continuous, sincere, well-intentioned motion and end up exactly where you started. Education is the most respectable way to do this. Nobody will ever criticise you for taking another course. Your parents will brag about it. Your manager will promote you for it.

Meanwhile, the person across the street who skipped all of it and just built things every weekend has become someone you'd hire. They don't have your credentials. They have the thing your credentials were *supposed* to lead to.

## Why credentials don't fix capability gaps

A credential is a story the institution tells the market about you. Capability is a story your work tells the market about you.

When these two diverge — and they often do — the market eventually picks the second one.

This is bad news if you've been borrowing money to acquire stories. It's extraordinary news if you don't have the credentials and you've been afraid to compete.

## The smartest people you know didn't follow the script

Look around. The people whose work actually impresses you — the founders, the engineers nobody can replace, the writers you actually read — almost universally took a weird, jagged path. They:

- left programs early
- taught themselves things the curriculum hadn't caught up to
- built unimpressive things until they could build impressive things

Their secret wasn't intelligence. It was a **refusal to confuse legibility with growth**. They didn't need their progress to fit on a transcript.

## Stop asking what to learn next

If you're constantly asking what to learn next, you're using education as a way to delay being judged. There's nothing to learn next. There's a thing to make, badly, this month, and a thing to fix about it next month.

The curriculum you actually need is the feedback loop you're avoiding. It looks nothing like a course. It looks like reality, applied to you, on a schedule you can't pause.

## What real progress feels like

Real progress feels like being slightly worse than you'd hoped, in public, repeatedly, until you're not. It rarely comes with a certificate. It almost always comes with embarrassment.

If you're not embarrassed by what you shipped six months ago, *you didn't ship enough*.`,
  },
  {
    slug: "execution-beats-knowledge",
    title: "Why Execution Beats Knowledge Every Time",
    description:
      "Knowing more is not the bottleneck. Doing what you already know is. Stop reading. Start shipping.",
    date: "2026-04-08",
    readTime: "5 min read",
    category: "Action",
    author: "Olivier Lüthy",
    content: `You already know enough.

That sentence is unflattering and probably true. You don't need another book, another framework, another expert thread on social media. You need to do the thing you've been quietly avoiding for the last six months.

## Knowledge is a hiding place

Reading is safe. Reading lets you feel productive without exposing you to a single judgement. Nobody can give your essay a 1-star review if you haven't written the essay. Nobody can ignore your launch if you haven't launched.

**Knowledge is the most socially acceptable form of procrastination ever invented.**

The smarter you are, the better you are at hiding here. You'll convince yourself you're "preparing". You're not preparing. You're stalling. And every day you stall, the cost compounds.

## The library full of unbuilt projects

Open your notes app. Count:

- the half-started projects
- the business ideas
- the outlines
- the "one day" lists

That graveyard is more honest about who you are right now than any résumé you'll ever write.

Each unfinished idea is a small bet you placed against yourself. You bet you wouldn't follow through. So far you've been right. The good news is you can change that this week.

## The first 1% is a private fight

Nobody warns you that the first version of anything will be embarrassing. The gap between the thing in your head and the thing on the screen is the actual cost of execution. Most people meet that gap, flinch, and quit.

The ones who win are not the ones who flinch less. They're the ones who keep going *anyway*, while flinching. They produce a version that's worse than they hoped, then a version that's almost decent, then a version that's quietly excellent. Nobody saw the first three.

## Ship the worst version

Your job today is not to be impressive. It's to put a real, working, incomplete thing in front of a real human being. The version that mortifies you. The one you'd ask a friend not to share.

Do it because the only feedback that matters comes from the version that exists, and the only version that exists is the one you ship.

## The math nobody runs

Take the number of hours you've spent learning the thing. Subtract the hours you've spent doing the thing. The bigger that gap, the more your future depends on closing it.

There is no version of you, in any future, who succeeds without shipping. **Not one.** Knowledge alone has never paid out, in any industry, to any person, in any era. Execution is the only line item that ever has.

Close the tab. Open the work.`,
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

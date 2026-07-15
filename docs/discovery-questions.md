# Discovery Conversation: Food Review App Idea

## Context
Your partner wants to build a food review app "similar-ish to Beli." The idea is still just a shared vision — nothing sketched or built yet. Before either of you can design features or scope a build, you need to understand *her* specific take: what she likes about apps like Beli, what she'd change, and what she actually wants day-to-day from using it. This isn't a technical spec — it's a set of casual conversation starters you can bring up naturally (over dinner, on a walk, etc.) to draw out her vision, focused especially on the three areas you flagged as least settled: the core rating mechanic, social/sharing features, and discovery/recommendations.

## How to use this
Don't run through it like an interview — pick a thread, let her answer pull you into the next relevant question, and jot down anything that surprises you. The "why it matters" notes are for you, not her — they explain what each answer will tell you about scope and direction.

## 1. The core rating mechanic
Beli's signature feature is ranking restaurants against each other (comparative "this vs. that" ranking) rather than assigning stars. This is the single biggest design decision in the whole app, so it's worth getting concrete.

- When you think about rating a restaurant, do you picture giving it a score, a star rating, or comparing it to other places you've been (like Beli's "which was better" duels)?
- Do you want one overall score per place, or separate scores for things like food, vibe, service, value?
- Should ratings be tied to a specific *visit* (so the same restaurant can have multiple entries over time) or one rating per restaurant that updates?
- Do you want to rate dishes individually, not just the restaurant as a whole?
- How important is it that your ranked list reflects "best to worst" ordering vs. just a collection of reviews?

*Why it matters: this determines the entire data model and the core interaction loop of the app — it's the hardest thing to change later.*

## 2. Social & sharing features
Beli's other big hook is the social graph — seeing where friends have been, their rankings, and getting recommendations from people you trust.

- Do you picture this as something just the two of you use, a small friend group, or open to anyone (like a public app)?
- Do you want to see friends' rankings/lists, or is this more of a private journal for yourself?
- Should reviews be visible to everyone, just friends, or private by default with an option to share?
- Do you want group features — e.g. "where should we eat tonight" polls, shared wish lists for date nights or trips?
- How do you feel about leaderboards or comparisons (e.g. "you and Sarah have both been to 12 of the same restaurants")?

*Why it matters: this decides whether you're building a personal tool, a couple's/friend tool, or a social network — each has very different scope.*

## 3. Discovery & recommendations
This is where Beli tries to answer "where should I eat next" using your (and your friends') taste data.

- When you're deciding where to eat, what do you wish an app told you that Google/Yelp doesn't?
- Do you want personalized recommendations based on your past ratings, or more of a "browse a map/list" experience?
- How important is a "want to try" or wishlist feature, separate from places you've already rated?
- Should recommendations lean on friends' taste (social proof) or an algorithm based on your own history?
- Do you care about filtering by cuisine, price, occasion (date night, quick lunch, group dinner), or dietary needs?

*Why it matters: recommendations can be a simple filtered list (cheap to build) or a taste-matching algorithm (a real engineering project) — good to know which she's imagining.*

## 4. Light scope check (optional, keep it casual)
Not a focus area, but worth a quick gut-check so you don't design something way bigger or smaller than she wants:

- Is this something you'd want to actually use daily, or more of a fun side project to build together?
- If you could only launch with 3 features, which would you not want to compromise on?

## Next step
After this conversation, come back and we can turn her answers into an actual feature list / rough app structure — at that point it'll be a real implementation planning task.

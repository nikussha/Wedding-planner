import { PrismaClient } from '@prisma/client';

/**
 * Starting copy for the editable marketing lists.
 *
 * REVIEW EVERY LINE BEFORE LAUNCH. These are neutral defaults written so that
 * nothing claims anything untrue about the business: no prices, no awards, no
 * years in business, no client quotes, no service region. Everything here is
 * editable in the admin panel under Services, Process and FAQ.
 *
 * Each list is only seeded when its table is empty, so running the seed again
 * never duplicates rows or overwrites edits. Testimonials are deliberately
 * not seeded: invented client quotes are fabricated reviews the moment the
 * site is live, so that section stays hidden until there is something real.
 */

const SERVICE_TIERS = [
  {
    slug: 'full-planning',
    name: 'Full planning',
    forWho:
      'For couples who want a partner from the first idea to the last dance, with someone holding every thread.',
    startsAt: 'From booking, however far ahead that is',
    includedBefore: [
      'Unlimited planning conversations',
      'Venue search, visits and contract review',
      'Supplier shortlisting, quotes and negotiation',
      'Full design direction: palette, florals, styling, stationery',
      'Budget built and tracked to the final invoice',
      'Guest list, invitations and RSVP management',
      'Timeline for the day and for every supplier',
    ],
    includedOnDay: [
      'Planner and assistant on site from set-up to send-off',
      'Supplier arrivals, briefing and problem-solving',
      'Ceremony and reception run to the timeline',
      'Family, guests and speeches looked after',
    ],
    excluded: [
      'Supplier fees and venue hire, which are paid directly',
      'Travel and accommodation for weddings outside the usual region',
    ],
  },
  {
    slug: 'partial-planning',
    name: 'Partial planning',
    forWho:
      'For couples who have made a start — perhaps the venue and a few suppliers — and want help carrying the rest.',
    startsAt: 'Typically three to six months before the day',
    includedBefore: [
      'Review of what is already booked, with gaps identified',
      'Supplier recommendations for whatever is still open',
      'Design direction built around decisions already made',
      'Budget review and tracking from this point on',
      'Timeline for the day and for every supplier',
    ],
    includedOnDay: [
      'Planner on site for set-up and the full day',
      'Supplier arrivals, briefing and problem-solving',
      'Ceremony and reception run to the timeline',
    ],
    excluded: [
      'Venue search and contract negotiation',
      'Guest list and RSVP management',
      'Supplier fees and venue hire, which are paid directly',
    ],
  },
  {
    slug: 'on-the-day',
    name: 'On-the-day coordination',
    forWho:
      'For couples who have planned it all themselves and want to hand it over so they can be guests at their own wedding.',
    startsAt: 'Six to eight weeks before the day',
    includedBefore: [
      'Handover meeting and a read of every supplier contract',
      'Confirmation calls with each supplier',
      'A master timeline written and circulated',
      'Walk-through of the venue and the layout',
    ],
    includedOnDay: [
      'On site from set-up until the party is underway',
      'Supplier arrivals, briefing and problem-solving',
      'Ceremony and reception run to the timeline',
      'A point of contact so nobody asks the couple anything',
    ],
    excluded: [
      'Planning, design or supplier sourcing before the handover',
      'Budget management',
      'Supplier fees and venue hire, which are paid directly',
    ],
  },
];

const PROCESS_STEPS = [
  {
    title: 'Say hello',
    body: 'Send a note or book a consultation. Tell us the date you have in mind, where you are imagining it, and what you have decided so far.',
  },
  {
    title: 'We talk it through',
    body: 'A relaxed conversation about the day you want and how much help you need. No obligation, and no pressure at the end of it.',
  },
  {
    title: 'A proposal, written for you',
    body: 'You get the right level of help, what it includes, and what it costs — in writing, so you can take your time with it.',
  },
  {
    title: 'We get to work',
    body: 'From the day you say yes until the last guest leaves, the planning is ours to carry and yours to enjoy.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How much does a wedding planner cost?',
    answer:
      'It depends on how much of the planning you want to hand over. On-the-day coordination is the smallest commitment, full planning the largest. Every proposal is written for your wedding, and you will have the figure in writing before you decide anything.',
  },
  {
    question: 'Do we really need a planner?',
    answer:
      'Plenty of couples plan beautifully on their own. A planner earns their place when you are short on time, planning from another city, working with a venue that needs everything brought in, or simply want to be a guest at your own wedding rather than its manager.',
  },
  {
    question: 'How far ahead should we get in touch?',
    answer:
      'Sooner is easier, because the best dates and suppliers go first. That said, there is useful work to do at almost any stage — including a few weeks out, when coordination is what is needed.',
  },
  {
    question: 'What happens at the consultation?',
    answer:
      'A conversation, nothing more. We talk about the day you are imagining, what you have booked already, and where you would like help. You leave knowing what working together would look like.',
  },
  {
    question: 'Can you work with the suppliers we have already booked?',
    answer:
      'Yes. Anyone you have chosen stays. We brief them, build the timeline around them, and look after them on the day.',
  },
];

/** Seeds each list only when it is empty, so edits are never overwritten. */
export async function seedMarketingContent(prisma: PrismaClient): Promise<void> {
  if ((await prisma.serviceTier.count()) === 0) {
    for (const [index, tier] of SERVICE_TIERS.entries()) {
      await prisma.serviceTier.create({
        data: {
          ...tier,
          order: index,
          includedBefore: tier.includedBefore.join('\n'),
          includedOnDay: tier.includedOnDay.join('\n'),
          excluded: tier.excluded.join('\n'),
        },
      });
    }
    console.log(`Seeded ${SERVICE_TIERS.length} service tiers.`);
  }

  if ((await prisma.processStep.count()) === 0) {
    await prisma.processStep.createMany({
      data: PROCESS_STEPS.map((step, index) => ({ ...step, order: index })),
    });
    console.log(`Seeded ${PROCESS_STEPS.length} process steps.`);
  }

  if ((await prisma.faqItem.count()) === 0) {
    await prisma.faqItem.createMany({
      data: FAQ_ITEMS.map((item, index) => ({ ...item, order: index })),
    });
    console.log(`Seeded ${FAQ_ITEMS.length} FAQ items.`);
  }
}

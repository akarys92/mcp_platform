/**
 * Demo tool executor.
 * No external APIs — pure in-process fun.
 */

const EIGHT_BALL_RESPONSES = [
  // Positive
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes — definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  // Neutral
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  // Negative
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const EXCUSES = [
  "My {pet} ate my {item}.",
  "I was stuck in an elevator with {person}.",
  "My internet went out and I had to drive to a coffee shop, but the coffee shop was closed for a {event}.",
  "I was abducted by aliens. They were very polite about it.",
  "Mercury is in retrograde.",
  "I got lost in a Wikipedia rabbit hole about {topic}.",
  "My calendar said it was tomorrow.",
  "I was on a different call that I also forgot about.",
  "A squirrel got into my office and I had to negotiate its surrender.",
  "I accidentally joined a meeting in a parallel universe.",
  "My smart home locked me in my bedroom. Again.",
  "I was busy updating my LinkedIn headline.",
  "I thought we agreed this was an email, not a meeting.",
  "I was practicing my excuse-generation skills. Ironic, I know.",
  "A street magician made my laptop disappear.",
  "I was held up saving a kitten from a tree. No, two kittens.",
];

const PETS = ["dog", "cat", "hamster", "parrot", "goldfish", "iguana"];
const ITEMS = ["laptop charger", "calendar", "to-do list", "badge", "motivation"];
const PEOPLE = ["the CEO", "a fire marshal", "a very chatty delivery driver", "someone who looked exactly like me"];
const EVENTS = ["polar bear awareness festival", "surprise health inspection", "flash mob rehearsal"];
const TOPICS = ["the history of forks", "Mongolian throat singing", "competitive duck herding", "the economics of pirate ships"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string): string {
  return template
    .replace("{pet}", pick(PETS))
    .replace("{item}", pick(ITEMS))
    .replace("{person}", pick(PEOPLE))
    .replace("{event}", pick(EVENTS))
    .replace("{topic}", pick(TOPICS));
}

type DemoToolHandler = (args: Record<string, unknown>) => string;

const DEMO_TOOL_MAP: Record<string, DemoToolHandler> = {
  demo_magic_8_ball: (args) => {
    const question = (args.question as string) || "Will this demo go well?";
    const answer = pick(EIGHT_BALL_RESPONSES);
    return `🎱 Question: "${question}"\n\n${answer}`;
  },

  demo_roll_dice: (args) => {
    const count = Math.min(20, Math.max(1, (args.count as number) || 1));
    const sides = Math.min(100, Math.max(2, (args.sides as number) || 6));
    const rolls = Array.from({ length: count }, () =>
      Math.floor(Math.random() * sides) + 1
    );
    const total = rolls.reduce((a, b) => a + b, 0);
    const diceNotation = `${count}d${sides}`;

    return [
      `🎲 Rolling ${diceNotation}...`,
      "",
      `Results: ${rolls.join(", ")}`,
      `Total: ${total}`,
      count > 1 ? `Average: ${(total / count).toFixed(1)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  },

  demo_coin_flip: (args) => {
    const count = Math.min(100, Math.max(1, (args.count as number) || 1));
    const flips = Array.from({ length: count }, () =>
      Math.random() < 0.5 ? "Heads" : "Tails"
    );
    const heads = flips.filter((f) => f === "Heads").length;
    const tails = count - heads;

    if (count === 1) {
      return `🪙 ${flips[0]}!`;
    }

    return [
      `🪙 Flipping ${count} coins...`,
      "",
      `Results: ${flips.join(", ")}`,
      `Heads: ${heads} | Tails: ${tails}`,
    ].join("\n");
  },

  demo_random_excuse: (args) => {
    const situation = (args.situation as string) || "being late";
    const excuse = fillTemplate(pick(EXCUSES));

    return [
      `📋 Situation: "${situation}"`,
      "",
      `Suggested excuse:`,
      `"Sorry about ${situation}. ${excuse}"`,
      "",
      `⚠️ Einstellen Connect is not responsible for any HR consequences.`,
    ].join("\n");
  },
};

/**
 * Execute a demo tool by name.
 */
export function executeDemoTool(
  toolName: string,
  args: Record<string, unknown>
): string {
  const handler = DEMO_TOOL_MAP[toolName];
  if (!handler) {
    throw new Error(`Unknown demo tool: ${toolName}`);
  }
  return handler(args);
}

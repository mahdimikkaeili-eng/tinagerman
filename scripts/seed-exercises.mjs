import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const derDieDas = {
  modes: [
    {
      id: 'ddd-sort',
      type: 'bucket',
      level: 'A1',
      title: 'Sort the nouns',
      instructions: 'Tap the correct article for each noun. Listen to the audio to train your ear.',
      buckets: ['der', 'die', 'das'],
      items: [
        { word: 'Hund', answer: 'der', emoji: '\u{1F415}', hint: 'Most male animals are der.' },
        { word: 'Blume', answer: 'die', emoji: '\u{1F338}', hint: 'Nouns ending in -e are usually die.' },
        { word: 'Auto', answer: 'das', emoji: '\u{1F697}', hint: 'Many borrowed words ending in -o are das.' },
        { word: 'Sonne', answer: 'die', emoji: '\u{2600}', hint: 'Ends in -e, and the sun is feminine in German.' },
        { word: 'Buch', answer: 'das', emoji: '\u{1F4D6}', hint: 'Learn this one by heart: das Buch.' },
        { word: 'Apfel', answer: 'der', emoji: '\u{1F34E}', hint: 'Most fruit is die, but der Apfel is an exception.' },
        { word: 'Haus', answer: 'das', emoji: '\u{1F3E0}', hint: 'Buildings are often das: das Haus, das Hotel.' },
        { word: 'Tür', answer: 'die', emoji: '\u{1F6AA}', hint: 'Doors and walls are die: die Tür, die Wand - but das Fenster.' },
        { word: 'Schlüssel', answer: 'der', emoji: '\u{1F511}', hint: 'Nouns ending in -el are often der.' },
        { word: 'Wasser', answer: 'das', emoji: '\u{1F4A7}', hint: 'Drinks are usually das: das Wasser, das Bier.' },
        { word: 'Katze', answer: 'die', emoji: '\u{1F408}', hint: 'Ends in -e, and female animals are die.' },
        { word: 'Mädchen', answer: 'das', emoji: '\u{1F467}', hint: 'Every -chen word is das, even for a girl.' },
        { word: 'Baum', answer: 'der', emoji: '\u{1F333}', hint: 'der Baum, der Wald - nature words are often der.' },
        { word: 'Uhr', answer: 'die', emoji: '\u{23F0}', hint: 'die Uhr - remember it with die Zeit.' },
        { word: 'Brot', answer: 'das', emoji: '\u{1F35E}', hint: 'das Brot, das Ei - many basic foods are das.' },
      ],
    },
    {
      id: 'ddd-sentence',
      type: 'choice',
      level: 'A2',
      title: 'Fill the gap',
      instructions: 'Choose the correct article in the sentence.',
      questions: [
        {
          prompt: '___ Hund schläft im Garten.',
          speak: 'Der Hund schläft im Garten.',
          options: ['Der', 'Die', 'Das'],
          answer: 'Der',
          explain: 'der Hund - masculine, and it is the subject, so nominative.',
        },
        {
          prompt: 'Ich trinke ___ Milch.',
          speak: 'Ich trinke die Milch.',
          options: ['der', 'die', 'das'],
          answer: 'die',
          explain: 'die Milch is feminine. Feminine does not change in the accusative.',
        },
        {
          prompt: 'Wo ist ___ Buch?',
          speak: 'Wo ist das Buch?',
          options: ['der', 'die', 'das'],
          answer: 'das',
          explain: 'das Buch - neuter. Learn every noun together with its article.',
        },
        {
          prompt: 'Ich sehe ___ Mann.',
          speak: 'Ich sehe den Mann.',
          options: ['der', 'den', 'das'],
          answer: 'den',
          explain: 'This is the trap: masculine der becomes den in the accusative.',
        },
        {
          prompt: '___ Sonne scheint heute.',
          speak: 'Die Sonne scheint heute.',
          options: ['Der', 'Die', 'Das'],
          answer: 'Die',
          explain: 'die Sonne is feminine - but careful, der Mond is masculine.',
        },
        {
          prompt: 'Er kauft ___ Auto.',
          speak: 'Er kauft das Auto.',
          options: ['der', 'die', 'das'],
          answer: 'das',
          explain: 'das Auto stays das in the accusative. Only masculine changes.',
        },
      ],
    },
  ],
};

const weilDassWenn = {
  modes: [
    {
      id: 'wdw-basic',
      type: 'choice',
      level: 'A2',
      title: 'Choose the connector',
      instructions: 'Pick the word that connects the two parts of the sentence.',
      questions: [
        {
          prompt: 'Ich bleibe zu Hause, ___ es regnet.',
          speak: 'Ich bleibe zu Hause, weil es regnet.',
          options: ['weil', 'dass', 'wenn'],
          answer: 'weil',
          explain: 'weil gives a reason - it answers the question warum.',
        },
        {
          prompt: 'Ich glaube, ___ er heute kommt.',
          speak: 'Ich glaube, dass er heute kommt.',
          options: ['weil', 'dass', 'wenn'],
          answer: 'dass',
          explain: 'After glauben, denken, sagen and hoffen you use dass.',
        },
        {
          prompt: '___ ich Zeit habe, gehe ich schwimmen.',
          speak: 'Wenn ich Zeit habe, gehe ich schwimmen.',
          options: ['Weil', 'Dass', 'Wenn'],
          answer: 'Wenn',
          explain: 'wenn sets a condition or a repeated time - it answers when or if.',
        },
        {
          prompt: 'Sie lernt Deutsch, ___ sie in Wien arbeiten möchte.',
          speak: 'Sie lernt Deutsch, weil sie in Wien arbeiten möchte.',
          options: ['weil', 'dass', 'wenn'],
          answer: 'weil',
          explain: 'Again a reason - so weil.',
        },
      ],
    },
    {
      id: 'wdw-order',
      type: 'choice',
      level: 'B1',
      title: 'Word order',
      instructions: 'After weil, dass and wenn the verb goes to the very end. Find the correct sentence.',
      questions: [
        {
          prompt: 'Ich komme später, weil ...',
          speak: 'Ich komme später, weil ich noch arbeiten muss.',
          options: ['ich noch arbeiten muss', 'ich muss noch arbeiten', 'muss ich noch arbeiten'],
          answer: 'ich noch arbeiten muss',
          explain: 'The conjugated verb muss goes last, after the infinitive arbeiten.',
        },
        {
          prompt: 'Er sagt, dass ...',
          speak: 'Er sagt, dass der Kurs sehr gut ist.',
          options: ['der Kurs sehr gut ist', 'ist der Kurs sehr gut', 'der Kurs ist sehr gut'],
          answer: 'der Kurs sehr gut ist',
          explain: 'ist moves to the end of the subordinate clause.',
        },
        {
          prompt: 'Wenn das Wetter schön ist, ...',
          speak: 'Wenn das Wetter schön ist, gehen wir spazieren.',
          options: ['gehen wir spazieren', 'wir gehen spazieren', 'wir spazieren gehen'],
          answer: 'gehen wir spazieren',
          explain: 'The subordinate clause is position 1, so the main clause starts with the verb.',
        },
        {
          prompt: 'Ich weiß nicht, ob ...',
          speak: 'Ich weiß nicht, ob sie morgen Zeit hat.',
          options: ['sie morgen Zeit hat', 'hat sie morgen Zeit', 'sie hat morgen Zeit'],
          answer: 'sie morgen Zeit hat',
          explain: 'ob works like dass - the verb hat goes to the end.',
        },
      ],
    },
  ],
};

const items = [
  {
    slug: 'der-die-das-german-articles',
    title: 'Der, Die or Das? German Articles Game',
    level: 'A1',
    topic: 'articles',
    summary:
      'The hardest part of German for beginners. Sort 15 everyday nouns into der, die and das, hear how each one sounds, and learn the patterns behind the rules.',
    content: JSON.stringify(derDieDas),
    published: true,
  },
  {
    slug: 'weil-dass-wenn-german-word-order',
    title: 'Weil, Dass, Wenn: German Word Order',
    level: 'A2',
    topic: 'word-order',
    summary:
      'Why does the verb jump to the end? Practise the three most common German connectors and stop making the mistake almost every learner makes.',
    content: JSON.stringify(weilDassWenn),
    published: true,
  },
];

async function main() {
  for (const it of items) {
    await prisma.exercise.upsert({
      where: { slug: it.slug },
      update: it,
      create: it,
    });
    console.log('seeded: ' + it.slug);
  }
  const n = await prisma.exercise.count();
  console.log('total exercises in db: ' + n);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

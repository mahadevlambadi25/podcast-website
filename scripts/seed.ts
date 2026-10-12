import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Automatically load .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function toLexical(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: text.split('\n\n').filter(Boolean).map((paragraph) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            version: 1,
          },
        ],
        direction: 'ltr',
      })),
      direction: 'ltr',
    },
  };
}

async function seed() {
  console.log('==> Starting Unchartered database seed...');
  const { getPayload } = await import('payload');
  const { default: configPromise } = await import('../src/payload.config');
  const { siteConfig } = await import('../src/config/site');

  const payload = await getPayload({ config: configPromise });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const seedDemo = process.env.SEED_DEMO !== 'false';

  if (!adminEmail || !adminPassword) {
    console.error(
      '❌ FATAL: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be explicitly provided in your environment variables (.env.local or process environment).'
    );
    process.exit(1);
  }

  const resolvedAdminEmail = adminEmail;
  const resolvedAdminPassword = adminPassword;

  // 1. Seed or verify Admin User
  console.log(`--> Checking admin user: ${resolvedAdminEmail}`);
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: resolvedAdminEmail } },
    limit: 1,
  });

  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: resolvedAdminEmail,
        password: resolvedAdminPassword,
        role: 'admin',
      },
    });
    console.log(`    Created admin user: ${resolvedAdminEmail}`);
  } else {
    console.log(`    Admin user already exists.`);
  }

  // 2. Seed Topics
  console.log('--> Seeding Topics taxonomy...');
  const topicSeeds = [
    { name: 'Technology', slug: 'technology', description: 'Architectures, frontier AI, silicon, and enterprise cloud infrastructure.' },
    { name: 'Manufacturing', slug: 'manufacturing', description: 'Heavy industry, advanced robotics, supply chains, and operational excellence.' },
    { name: 'Healthcare', slug: 'healthcare', description: 'Biotechnology, genomic medicine, pharmaceuticals, and health systems.' },
    { name: 'Finance', slug: 'finance', description: 'Venture capital, sovereign wealth funds, private equity, and fintech.' },
    { name: 'Consumer', slug: 'consumer', description: 'Global consumer brands, direct-to-consumer networks, and retail innovation.' },
    { name: 'Infrastructure', slug: 'infrastructure', description: 'Energy transition, grid resilience, logistics, and physical capital assets.' },
    { name: 'Entrepreneurship', slug: 'entrepreneurship', description: 'Zero-to-one company building, high-growth scaling, and founder psychology.' },
    { name: 'Real Estate', slug: 'real-estate', description: 'Urban development, commercial portfolios, and architectural legacy.' },
    { name: 'Hospitality', slug: 'hospitality', description: 'Global luxury, experiential travel, and high-touch service leadership.' },
    { name: 'Education', slug: 'education', description: 'Future of work, higher education reform, and executive learning.' },
    { name: 'Retail', slug: 'retail', description: 'Omnichannel commerce, supply ecosystems, and luxury merchandising.' },
  ];

  const createdTopics: Record<string, string | number> = {};

  for (const t of topicSeeds) {
    const existing = await payload.find({
      collection: 'topics',
      where: { slug: { equals: t.slug } },
      limit: 1,
    });

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'topics',
        data: t,
      });
      createdTopics[t.slug] = created.id;
    } else {
      createdTopics[t.slug] = existing.docs[0].id;
    }
  }
  console.log(`    ${Object.keys(createdTopics).length} topics ready.`);

  // 3. Seed Site Settings defaults
  console.log('--> Initializing Site Settings...');
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      brandName: siteConfig.brandName,
      tagline: siteConfig.tagline,
      publisherName: siteConfig.publisher.name,
      publisherUrl: siteConfig.publisher.url,
      attribution: siteConfig.publisher.attribution,
      heroHeadline: 'Where Industry Titans Share the Architecture of Legacy',
      heroMission: siteConfig.tagline,
      youtubeChannelUrl: siteConfig.socials.youtube,
      linkedinUrl: siteConfig.socials.linkedin,
      twitterUrl: siteConfig.socials.twitter,
      contactEmail: siteConfig.contact.email,
      nominationRecipientEmail: siteConfig.contact.nominationRecipientEmail,
    },
  });

  if (!seedDemo) {
    console.log('SEED_DEMO is false. Skipping sample guests and episodes.');
    console.log('==> Seed process finished successfully.');
    process.exit(0);
  }

  // 4. Create sample Media asset for portraits & thumbnails
  console.log('--> Seeding Sample Media Assets...');
  let sampleMediaId: string | number | null = null;
  const existingMedia = await payload.find({
    collection: 'media',
    limit: 1,
  });

  if (existingMedia.totalDocs > 0) {
    sampleMediaId = existingMedia.docs[0].id;
  } else {
    try {
      import('path').then();
      const pathModule = await import('path');
      const sampleFile = pathModule.resolve('public/placeholders/portrait-placeholder.svg');
      const createdMedia = await payload.create({
        collection: 'media',
        filePath: sampleFile,
        data: {
          alt: 'Sample Executive Leader Portrait',
          caption: 'Editorial Press Archives',
        },
      });
      sampleMediaId = createdMedia.id;
      console.log(`    Created sample media ID: ${sampleMediaId}`);
    } catch (err) {
      console.log('    Could not create file media directly, will seed with skipValidation context if needed.');
    }
  }

  // 5. Seed 4 Sample Guests
  console.log('--> Seeding 4 Sample Guests...');
  const sampleGuestsData = [
    {
      fullName: 'Elena Rostova',
      slug: 'elena-rostova',
      role: 'Co-Founder & CEO',
      company: 'Quantum Dynamics',
      shortOverview: 'Pioneer in cryogenic silicon architectures and sovereign quantum networks with over two decades steering deep-tech transformations across North America and Europe.',
      biography: toLexical('Elena Rostova has dedicated 22 years to bridging theoretical quantum mechanics and industrial semiconductor fabrication. Prior to founding Quantum Dynamics in 2018, she led advanced exploratory physics at Bell Labs and served as Chief Technology Officer at Cerulean Microelectronics. Under her leadership, Quantum Dynamics achieved the first fault-tolerant 256-qubit logical cluster operating at room-scale dilution refrigeration.'),
      industries: [createdTopics['technology'], createdTopics['infrastructure']].filter(Boolean),
      keyInsights: [
        { quote: 'In deep technology, the greatest trap is optimizing for a demo rather than industrial-scale yield.', context: 'Engineering Strategy' },
        { quote: 'True innovation rarely begins with consensus; it begins when physics validates what the market considered impossible.', context: 'Leadership' }
      ],
      links: {
        linkedin: 'https://www.linkedin.com',
        website: 'https://quantumdynamics.example.com',
      },
      featured: true,
      status: 'published' as const,
    },
    {
      fullName: 'Marcus Vance',
      slug: 'marcus-vance',
      role: 'Managing Partner',
      company: 'Aether Capital',
      shortOverview: 'Institutional investor allocating over $4B across deep infrastructure, robotics, and energy transitions across global venture and growth markets.',
      biography: toLexical('Marcus Vance is the founder and Managing Partner of Aether Capital, a multistage investment partnership managing sovereign and institutional mandates. Known for high-conviction, concentrated portfolio management, Vance has stewarded early investments in twelve category-defining enterprises across autonomous manufacturing, fusion energy, and aerospace propulsion.'),
      industries: [createdTopics['finance'], createdTopics['entrepreneurship']].filter(Boolean),
      keyInsights: [
        { quote: 'Capital is commoditized; sovereign strategic patience is the only durable moat in foundational technologies.', context: 'Capital Allocation' },
        { quote: 'Founders who manage through crisis don’t look for certainty—they master decision velocity.', context: 'Executive Resilience' }
      ],
      links: {
        linkedin: 'https://www.linkedin.com',
      },
      featured: true,
      status: 'published' as const,
    },
    {
      fullName: 'Dr. Soraya Al-Mansoor',
      slug: 'soraya-al-mansoor',
      role: 'Chairperson & Chief Scientist',
      company: 'Helix Therapeutics',
      shortOverview: 'Molecular biologist and biotechnology executive advancing synthetic genomics, computational protein design, and targeted cellular medicine.',
      biography: toLexical('Dr. Soraya Al-Mansoor is internationally celebrated for her pioneering work in programmable mRNA synthesis. A former Rhodes Scholar and professor at Oxford University, she transitioned to enterprise biotechnology to build Helix Therapeutics. Helix currently operates four global research campuses engineering therapies for formerly intractable autoimmune disorders.'),
      industries: [createdTopics['healthcare'], createdTopics['technology']].filter(Boolean),
      keyInsights: [
        { quote: 'Engineering biology requires the profound humility to listen to four billion years of cellular evolution.', context: 'Scientific Discovery' },
        { quote: 'Scientific leadership is about translating mathematical elegance into patient survival.', context: 'Mission Focus' }
      ],
      links: {
        website: 'https://helixtherapeutics.example.com',
        linkedin: 'https://www.linkedin.com',
      },
      featured: true,
      status: 'published' as const,
    },
    {
      fullName: 'Thomas Sterling',
      slug: 'thomas-sterling',
      role: 'Executive Chairman',
      company: 'Sterling Industrial Group',
      shortOverview: 'Built one of the world’s largest precision manufacturing conglomerates, modernizing automated supply chains, foundries, and robotics across four continents.',
      biography: toLexical('Thomas Sterling transformed a regional family-owned tooling facility into Sterling Industrial Group, an international manufacturing enterprise employing 35,000 specialists across forty factories worldwide. A pioneer in cyber-physical automation, Sterling serves on multiple sovereign trade advisory councils.'),
      industries: [createdTopics['manufacturing'], createdTopics['infrastructure']].filter(Boolean),
      keyInsights: [
        { quote: 'Software eats the world, but physics still builds the factory floor and the power grid.', context: 'Industrial Realism' },
        { quote: 'Culture is not a poster on the cafeteria wall; it is what your shift managers do when production stops.', context: 'Operational Excellence' }
      ],
      links: {
        linkedin: 'https://www.linkedin.com',
      },
      featured: true,
      status: 'published' as const,
    },
  ];

  const createdGuestIds: Record<string, string | number> = {};

  for (const g of sampleGuestsData) {
    const existing = await payload.find({
      collection: 'guests',
      where: { slug: { equals: g.slug } },
      limit: 1,
    });

    if (existing.totalDocs === 0) {
      const created = await payload.create({
        collection: 'guests',
        data: {
          ...g,
          ...(sampleMediaId ? { portrait: sampleMediaId } : {}),
        } as any,
        context: { skipValidation: true },
      });
      createdGuestIds[g.slug] = created.id;
      console.log(`    Created guest: ${g.fullName}`);
    } else {
      createdGuestIds[g.slug] = existing.docs[0].id;
      console.log(`    Guest exists: ${g.fullName}`);
    }
  }

  // 5. Seed 4 Sample Episodes
  console.log('--> Seeding 4 Sample Episodes...');
  const sampleEpisodesData = [
    {
      title: 'Episode 1: The Quantum Horizon — Building Sovereign Compute Beyond Silicon',
      slug: 'the-quantum-horizon-sovereign-compute',
      guests: [createdGuestIds['elena-rostova']],
      youtubeUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      fallbackWatchUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      episodeNumber: 1,
      season: 1,
      shortSummary: 'Elena Rostova, CEO of Quantum Dynamics, reveals the engineering bottlenecks in commercial quantum computing, scaling cryogenic chipsets, and why compute sovereignty has become a national defense imperative.',
      description: toLexical('In this inaugural broadcast of Unchartered, we sit down with Elena Rostova at the Quantum Dynamics research facility. Rostova unpacks the reality of commercial quantum systems, why classical silicon will still dominate consumer workloads, and how cryogenic engineering represents the true frontier of enterprise computing.'),
      keyTakeaways: [
        { takeaway: 'Cryogenic yield challenges will determine commercial quantum viability by 2028.' },
        { takeaway: 'Why compute sovereignty has shifted from an economic policy to a primary defense priority.' },
        { takeaway: 'The transition from academic experimentation to ISO-certified industrial quantum clusters.' },
      ],
      quotes: [
        { quote: 'Everyone talks about qubits; the real battle is in cryogenic thermal dissipation at 15 millikelvin.', speaker: 'Elena Rostova' }
      ],
      transcript: 'Elena Rostova: Thank you for having me. When we founded Quantum Dynamics, everyone asked whether quantum computing would replace GPU clusters...\nHost: And your answer was always a decisive no.\nElena Rostova: Exactly. Quantum is not a faster CPU; it is an entirely different domain of mathematics designed for simulation of physics and cryptography...',
      publishedAt: '2026-03-01T12:00:00.000Z',
      topics: [createdTopics['technology'], createdTopics['infrastructure']].filter(Boolean),
      tags: [{ tag: 'Quantum' }, { tag: 'Semiconductors' }, { tag: 'DeepTech' }, { tag: 'SAMPLE' }],
      featured: true,
      status: 'published' as const,
    },
    {
      title: 'Episode 2: Capital Allocation in the Age of Frontier Innovation',
      slug: 'capital-allocation-frontier-innovation',
      guests: [createdGuestIds['marcus-vance']],
      youtubeUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      fallbackWatchUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      episodeNumber: 2,
      season: 1,
      shortSummary: 'Marcus Vance of Aether Capital discusses macroeconomic shifts, deploying multi-billion-dollar sovereign pools into hard assets, and identifying generational founders capable of navigating industrial complexity.',
      description: toLexical('In Episode 2, Marcus Vance deconstructs the illusion of quick software exits and makes the contrarian case for decade-long horizons in capital allocation. We explore how geopolitical realignments are reshaping LP expectations and what metrics separate visionary deep-tech founders from academic researchers.'),
      keyTakeaways: [
        { takeaway: 'The death of the 3-year SaaS venture fund model in deep industrial verticals.' },
        { takeaway: 'How institutional LPs evaluate geopolitical risk in supply chain and semiconductor portfolios.' },
        { takeaway: 'Why decision velocity under incomplete information is the single most predictive founder metric.' },
      ],
      quotes: [
        { quote: 'When capital was cheap, everybody looked like a strategic genius. Now, operational rigor is once again the only thing that matters.', speaker: 'Marcus Vance' }
      ],
      transcript: 'Host: Marcus, welcome to Unchartered. You have allocated billions into physical industries when the market wanted enterprise apps.\nMarcus Vance: It comes down to first principles. Software that does not touch physical atoms has hit diminishing economic returns...',
      publishedAt: '2026-03-08T12:00:00.000Z',
      topics: [createdTopics['finance'], createdTopics['entrepreneurship']].filter(Boolean),
      tags: [{ tag: 'VentureCapital' }, { tag: 'Macroeconomics' }, { tag: 'Strategy' }, { tag: 'SAMPLE' }],
      featured: true,
      status: 'published' as const,
    },
    {
      title: 'Episode 3: Re-engineering Biology — From Genetic Code to Scaled Therapeutics',
      slug: 'reengineering-biology-scaled-therapeutics',
      guests: [createdGuestIds['soraya-al-mansoor']],
      youtubeUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      fallbackWatchUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      episodeNumber: 3,
      season: 1,
      shortSummary: 'Dr. Soraya Al-Mansoor breaks down generative biology, FDA acceleration pathways for bespoke genetic medicine, and the discipline required to scale synthetic manufacturing without compromising safety.',
      description: toLexical('Dr. Soraya Al-Mansoor joins Unchartered to discuss the historic inflection point in synthetic biology. We trace the shift from empirical trial-and-error chemistry to generative algorithmic biology, examining the regulatory and production hurdles of delivering personalized cellular therapies globally.'),
      keyTakeaways: [
        { takeaway: 'Computational protein folding has compressed drug discovery timelines by over 70%.' },
        { takeaway: 'The critical bottleneck has migrated from molecular design to cold-chain bioreactor manufacturing.' },
        { takeaway: 'How modern biotech chairs structure research teams to balance academic rigor with commercial speed.' },
      ],
      quotes: [
        { quote: 'We are moving from discovering medicine to programming it.', speaker: 'Dr. Soraya Al-Mansoor' }
      ],
      transcript: 'Host: Dr. Al-Mansoor, synthetic genomics has gone from a fringe science to mainstream pharmaceutical pipeline in under a decade.\nDr. Soraya Al-Mansoor: That speed is intoxicating, but biology has zero tolerance for arrogance. Every shortcut in clinical validation comes back to haunt you...',
      publishedAt: '2026-03-15T12:00:00.000Z',
      topics: [createdTopics['healthcare'], createdTopics['technology']].filter(Boolean),
      tags: [{ tag: 'Biotechnology' }, { tag: 'Genomics' }, { tag: 'Healthcare' }, { tag: 'SAMPLE' }],
      featured: true,
      status: 'published' as const,
    },
    {
      title: 'Episode 4: The Factory of 2035 — Autonomous Robotics and Industrial Mastery',
      slug: 'factory-2035-autonomous-robotics-industrial-mastery',
      guests: [createdGuestIds['thomas-sterling']],
      youtubeUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      fallbackWatchUrl: 'https://www.youtube.com/watch?v=sample-placeholder',
      episodeNumber: 4,
      season: 1,
      shortSummary: 'Thomas Sterling, Executive Chairman of Sterling Industrial Group, shares five decades of lessons transforming manufacturing plants into autonomous robotic powerhouses and building generational resilience.',
      description: toLexical('In Episode 4, Thomas Sterling takes us behind the gates of heavy manufacturing. Sterling recounts the painful decisions behind automating legacy foundries, preserving skilled workforce institutional knowledge, and defending corporate sovereignty during supply chain shocks.'),
      keyTakeaways: [
        { takeaway: 'Why brownfield factory automation requires ten times more organizational empathy than greenfield construction.' },
        { takeaway: 'The economic trade-offs of onshoring manufacturing versus distributed redundancy.' },
        { takeaway: 'What high-reliability manufacturing principles can teach software and finance leaders.' },
      ],
      quotes: [
        { quote: 'If your automated system cannot handle a thirty-minute power fluctuation, you do not have an automated factory—you have an expensive sculpture.', speaker: 'Thomas Sterling' }
      ],
      transcript: 'Host: Thomas, your factories produce the parts that hold together global infrastructure.\nThomas Sterling: And that means we have zero margin for ideological fantasy. A turbine either operates for thirty years under 2,000 degrees, or it fails...',
      publishedAt: '2026-03-22T12:00:00.000Z',
      topics: [createdTopics['manufacturing'], createdTopics['infrastructure']].filter(Boolean),
      tags: [{ tag: 'Manufacturing' }, { tag: 'Robotics' }, { tag: 'SupplyChains' }, { tag: 'SAMPLE' }],
      featured: false,
      status: 'published' as const,
    },
  ];

  for (const ep of sampleEpisodesData) {
    const existing = await payload.find({
      collection: 'episodes',
      where: { slug: { equals: ep.slug } },
      limit: 1,
    });

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'episodes',
        data: ep as any,
      });
      console.log(`    Created episode: ${ep.title}`);
    } else {
      console.log(`    Episode exists: ${ep.title}`);
    }
  }

  console.log('==> Database seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed script encountered an error:', err);
  process.exit(1);
});

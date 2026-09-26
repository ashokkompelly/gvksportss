import { pageDefaults, mergeContent, brandTagline } from '../../../../shared/siteContent.js';
import { eventExperience } from '../../../../shared/eventExperience.js';
import { transaction, store, likePattern } from './index.js';
import { migrateTeamAndPages } from './migrate-team-pages.js';
await transaction(async () => {
  if (
    !(await store.one('migrations', {
      version: 1,
    }))
  )
    await transaction(async () => {
      const insert = async (kind, data) =>
        await store.insert('resources', {
          kind: kind,
          data: JSON.stringify({
            published: true,
            ...data,
          }),
        });
      await insert('pages', {
        slug: 'home',
        title: 'Better skills. Sharper minds.',
        body: 'Discover chess and badminton coaching, friendly competition, and sports experiences for your community.',
      });
      await insert('pages', {
        slug: 'about',
        title: 'Two sports. One shared ambition.',
        body: 'GVK Sportss brings chess and badminton experiences to schools, gated communities and corporates. We bring people together to play, learn and grow.',
      });
      await insert('programs', {
        title: 'Badminton coaching',
        sport: 'Badminton',
        level: 'All levels',
        description:
          'Build your technique, footwork and match confidence with structured practice.',
        mode: 'In person',
      });
      await insert('programs', {
        title: 'Chess foundations',
        sport: 'Chess',
        level: 'Beginner',
        description: 'Learn the rules, spot tactical patterns and build confident decision-making.',
        mode: 'In person / online',
      });
      await insert('programs', {
        title: 'Chess development',
        sport: 'Chess',
        level: 'Intermediate',
        description:
          'Develop openings, strategic thinking and endgame skills through guided game analysis.',
        mode: 'In person / online',
      });
      await insert('gallery', {
        title: 'GVK Sportss brand launch artwork',
        url: '/brand-launch.jpeg',
        description:
          'Supplied brand artwork. Dates shown on the poster are not a current event listing.',
      });
      await store.insert('migrations', {
        version: 1,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 2,
    }))
  )
    await transaction(async () => {
      const insert = async (kind, data) =>
        await store.insert('resources', {
          kind: kind,
          data: JSON.stringify({
            published: true,
            ...data,
          }),
        });
      const now = new Date();
      const plusDays = (days, hours = 9) => {
        const d = new Date(now.getTime() + days * 86400000);
        d.setHours(hours, 0, 0, 0);
        return d.toISOString();
      };

      // Rich Badminton & Chess Programs
      await insert('programs', {
        title: 'Badminton High-Performance Squad',
        sport: 'Badminton',
        level: 'Advanced / Competitive',
        description:
          'Olympic BWF court drills, 360° video smash biomechanics analysis, and speed radar tracking.',
        mode: 'In person (Financial District HQ)',
      });
      await insert('programs', {
        title: 'Chesslang FIDE Grandmaster Masterclass',
        sport: 'Chess',
        level: 'Advanced (1600+ Elo)',
        description:
          'Official Chesslang digital platform integration, Grandmaster tactical analysis, and tournament preparation.',
        mode: 'In person + Chesslang Online',
      });
      await insert('programs', {
        title: 'Grassroots Junior Badminton (Ages 5-12)',
        sport: 'Badminton',
        level: 'Beginner / Intermediate',
        description:
          'Rhythm, footwork agility, hand-eye coordination, and foundational stroke technique in a fun environment.',
        mode: 'In person (All Centers)',
      });

      // Upcoming Events
      await insert('events', {
        title: 'Hyderabad Open Badminton Championship 2026',
        sport: 'Badminton',
        description:
          'Annual state-ranking tournament featuring singles & doubles across Under-13, Under-17, and Open categories. Trophies and cash prizes.',
        start: plusDays(7, 9),
        location: 'GVK Sportss Arena — Financial District HQ',
        capacity: 64,
        membersOnly: false,
      });
      await insert('events', {
        title: 'GVK × Chesslang Blitz Arena Tournament',
        sport: 'Chess',
        description:
          'FIDE-rated blitz championship with live digital board broadcast on Chesslang. 9-round Swiss format (3 mins + 2 sec increment).',
        start: plusDays(12, 14),
        location: 'GVK Chess Lounge & Chesslang Digital Portal',
        capacity: 50,
        membersOnly: false,
      });
      await insert('events', {
        title: 'Corporate Sports League — Badminton Cup',
        sport: 'Badminton',
        description:
          'Weekend corporate team tournament for Hyderabad tech and business teams. Mixed doubles and men’s doubles categories.',
        start: plusDays(20, 10),
        location: 'GVK Sportss Arena — Financial District HQ',
        capacity: 32,
        membersOnly: false,
      });

      // Upcoming Coaching Slots
      await insert('slots', {
        title: 'Morning Badminton Elite Training Batch',
        sport: 'Badminton',
        start: plusDays(1, 6),
        end: plusDays(1, 8),
        location: 'Court 1 & 2, Financial District Arena',
        capacity: 8,
        membersOnly: false,
      });
      await insert('slots', {
        title: 'Chesslang Tactical Opening Masterclass',
        sport: 'Chess',
        start: plusDays(2, 17),
        end: plusDays(2, 19),
        location: 'GVK Chess Center & Chesslang Classroom',
        capacity: 12,
        membersOnly: false,
      });
      await insert('slots', {
        title: 'Evening Smash & Video Analysis Clinic',
        sport: 'Badminton',
        start: plusDays(3, 18),
        end: plusDays(3, 20),
        location: 'Center Court, Financial District Arena',
        capacity: 6,
        membersOnly: false,
      });

      // Membership Plans
      await insert('plans', {
        title: 'Badminton Unlimited Court Pass',
        description:
          'Daily court booking access, video analysis clinic discount, and priority tournament entries.',
        price: 3499,
        durationDays: 30,
      });
      await insert('plans', {
        title: 'Chesslang Full Academy Digital Access',
        description:
          'Full Chesslang portal license, weekly FIDE mentor game reviews, and unlimited blitz arena entries.',
        price: 2499,
        durationDays: 30,
      });
      await store.insert('migrations', {
        version: 2,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 3,
    }))
  )
    await transaction(async () => {
      const page = await store.one(
        'resources',
        {
          kind: 'pages',
          data: {
            $regex: likePattern('%"slug":"about"%'),
          },
        },
        ['id', 'data'],
      );
      if (page) {
        const data = JSON.parse(page.data);
        if (data.title === 'Two sports. One shared ambition.') {
          data.title = 'Trainers & Team';
          await store.update(
            'resources',
            {
              id: page.id,
            },
            {
              data: JSON.stringify(data),
            },
          );
        }
      }
      await store.insert('migrations', {
        version: 3,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 4,
    }))
  )
    await transaction(async () => {
      const page = await store.one(
        'resources',
        {
          kind: 'pages',
          data: {
            $regex: likePattern('%"slug":"home"%'),
          },
        },
        ['id', 'data'],
      );
      if (page) {
        const data = JSON.parse(page.data);
        data.config = {
          eyebrow: 'CHESS + BADMINTON • HYDERABAD',
          heroDescription:
            'Elevate your game with world-class coaching, Olympic-grade badminton courts, and interactive chess coaching powered by the Chesslang platform.',
          primaryAction: {
            label: 'Explore Coaching Batches',
            href: '/coaching',
          },
          secondaryAction: {
            label: 'Tournaments & Events',
            href: '/events',
          },
          heroImage: '/logo.jpeg',
          heroImageAlt: 'GVK Sportss Gold and Black Emblem',
          heroLabel: 'THE GVK STANDARD',
          heroStandard: 'Discipline. Technique. Mastery.',
          heroFoot: [
            '01 / 8 BWF Synthetic Courts',
            '02 / Chesslang Platform Coaching',
            '03 / FIDE & BWF Certified Coaches',
          ],
          metrics: [
            {
              value: '8 Courts',
              label: 'Olympic-Grade BWF Mats',
            },
            {
              value: 'Chesslang',
              label: 'Platform Coaching',
            },
            {
              value: '15+ Coaches',
              label: 'BWF & FIDE Certified Mentors',
            },
            {
              value: '500+',
              label: 'Active Academy Athletes',
            },
          ],
          sportsEyebrow: 'CHOOSE YOUR DISCIPLINE',
          sportsTitle: 'Precision on court.\nStrategy on board.',
          sportsDescription:
            'Whether smashing at 350+ km/h or outmaneuvering an opponent in a Sicilian defense, GVK provides championship-level mentoring.',
          sports: [
            {
              number: '01 / BADMINTON HIGH-PERFORMANCE',
              title: 'Badminton Academy',
              description:
                'BWF Level 2 certified coaching, slow-motion biomechanics video smash analysis, radar speed tracking, and Olympic-spec synthetic shock-absorbing courts.',
              badges: ['BWF Certified', 'Video Analysis', 'Smash Radar'],
              href: '/coaching?sport=Badminton',
            },
            {
              number: '02 / CHESS COACHING',
              title: 'Chess Masterclass',
              description:
                'Integrated with the Chesslang platform for digital coaching. FIDE-rated trainers, interactive live board sessions, tactical puzzle homework, and regular game debriefs.',
              badges: ['Chesslang Platform Coaching', 'FIDE Mentors', 'Interactive Boards'],
              href: '/coaching?sport=Chess',
            },
          ],
          communityEyebrow: 'SPORTS FOR EVERY COMMUNITY',
          communityTitle: 'Bring championship energy into play.',
          communityAction: {
            label: 'Plan an Experience',
            href: '/contact',
          },
          communities: [
            {
              icon: 'school',
              title: 'Schools & Academies',
              description:
                'Curriculum-integrated badminton and chess coaching, inter-school tournaments, and youth scout camps.',
            },
            {
              icon: 'users',
              title: 'Gated Communities',
              description:
                'Resident leagues, weekend clinics, certified coaches on-site, and friendly multi-age championships.',
            },
            {
              icon: 'building',
              title: 'Corporate Leagues',
              description:
                'Executive stress-relief wellness, corporate badminton cups, and workplace chess tournaments.',
            },
          ],
        };
        await store.update(
          'resources',
          {
            id: page.id,
          },
          {
            data: JSON.stringify(data),
          },
        );
      }
      await store.insert('migrations', {
        version: 4,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 5,
    }))
  )
    await transaction(async () => {
      const footer = {
        brandName: 'GVK SPORTSS',
        brandTagline: 'PLAY · LEARN · GROW',
        brandDescription:
          'Premier sports training academy specializing in professional badminton court coaching, official Chesslang digital masterclasses, and competitive sports championships.',
        whatsappLabel: 'WhatsApp Vamshi Krishna',
        whatsappNumber: '919492063258',
        whatsappMessage:
          'Hi Vamshi Krishna, I would like to enquire about GVK Sportss coaching sessions.',
        quickLinksTitle: 'Academy Links',
        quickLinks: [
          {
            label: 'Badminton Coaching',
            href: '/coaching?sport=Badminton',
          },
          {
            label: 'Chess Coaching',
            href: '/coaching?sport=Chess',
          },
          {
            label: 'Tournaments & Leagues',
            href: '/events',
          },
          {
            label: 'Coaching Faculty & Mentors',
            href: '/about',
          },
          {
            label: 'Moments & Highlights',
            href: '/gallery',
          },
          {
            label: 'Admin Staff Portal',
            href: '/admin',
          },
        ],
        programsTitle: 'Programs',
        programs: [
          {
            label: 'Grassroots Youth (5-10 yrs)',
            href: '/coaching',
          },
          {
            label: 'Elite Competitive Squad',
            href: '/coaching',
          },
          {
            label: 'Adult High-Fitness Batches',
            href: '/coaching',
          },
          {
            label: 'Chess Coaching & Puzzles',
            href: '/coaching?sport=Chess',
          },
          {
            label: 'School & Corporate Leagues',
            href: '/contact?interest=Schools',
          },
        ],
        contactTitle: 'Contact Arena',
        contactName: 'Vamshi Krishna · Coaching Desk',
        phones: ['+91 94920 63258', '+91 91234 56789'],
        emails: ['info@gvksportss.com', 'coaching@gvksportss.com'],
        address: [
          'GVK Sportss Arena',
          'Plot 42, Financial District, Gachibowli,',
          'Hyderabad, Telangana 500032',
        ],
        hours: ['Operating Hours:', 'Mon – Sun: 6:00 AM – 10:00 PM'],
        copyright: 'GVK Sportss Academy. All rights reserved. Play. Learn. Grow.',
        bottomLinks: [
          {
            label: 'Our Team',
            href: '/about',
          },
          {
            label: 'Directions',
            href: '/contact',
          },
          {
            label: 'Member Login',
            href: '/login',
          },
        ],
      };
      const existing = await store.one(
        'resources',
        {
          kind: 'pages',
          data: {
            $regex: likePattern('%"slug":"footer"%'),
          },
        },
        ['id', 'data'],
      );
      if (existing) {
        const data = JSON.parse(existing.data);
        data.config = footer;
        await store.update(
          'resources',
          {
            id: existing.id,
          },
          {
            data: JSON.stringify(data),
          },
        );
      } else {
        await store.insert('resources', {
          kind: 'pages',
          data: JSON.stringify({
            published: true,
            slug: 'footer',
            title: 'Site Footer',
            body: 'Footer configuration',
            config: footer,
          }),
        });
      }
      await store.insert('migrations', {
        version: 5,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 6,
    }))
  )
    await transaction(async () => {
      const media = {
        badminton:
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
        chess:
          'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1200&q=85',
        event:
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=85',
      };
      const updates = [
        ['Badminton High-Performance Squad', media.badminton],
        ['Grassroots Junior Badminton (Ages 5-12)', media.badminton],
        ['Chesslang FIDE Grandmaster Masterclass', media.chess],
        ['Hyderabad Open Badminton Championship 2026', media.event],
        ['GVK × Chesslang Blitz Arena Tournament', media.event],
        ['Corporate Sports League — Badminton Cup', media.event],
      ];
      for (const [title, image] of updates) {
        const row = await store.one(
          'resources',
          {
            data: {
              $regex: likePattern(`%"title":"${title}"%`),
            },
          },
          ['id', 'data'],
        );
        if (row) {
          const data = JSON.parse(row.data);
          data.image = image;
          await store.update(
            'resources',
            {
              id: row.id,
            },
            {
              data: JSON.stringify(data),
            },
          );
        }
      }
      const home = await store.one(
        'resources',
        {
          kind: 'pages',
          data: {
            $regex: likePattern('%"slug":"home"%'),
          },
        },
        ['id', 'data'],
      );
      if (home) {
        const data = JSON.parse(home.data);
        data.config.sports = data.config.sports.map((sport) => ({
          ...sport,
          image: sport.href.includes('Badminton') ? media.badminton : media.chess,
        }));
        await store.update(
          'resources',
          {
            id: home.id,
          },
          {
            data: JSON.stringify(data),
          },
        );
      }
      await store.insert('migrations', {
        version: 6,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 7,
    }))
  )
    await transaction(async () => {
      const eventImages = {
        Badminton:
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=85',
        Chess:
          'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1400&q=85',
      };
      for (const [sport, image] of Object.entries(eventImages)) {
        const rows = await store.all(
          'resources',
          {
            kind: 'events',
            data: {
              $regex: likePattern(`%\"sport\":\"${sport}\"%`),
            },
          },
          {},
          ['id', 'data'],
        );
        for (const row of rows) {
          const data = JSON.parse(row.data);
          data.image = image;
          await store.update(
            'resources',
            {
              id: row.id,
            },
            {
              data: JSON.stringify(data),
            },
          );
        }
      }
      await store.insert('migrations', {
        version: 7,
      });
    });
  if (
    !(await store.one('migrations', {
      version: 8,
    }))
  )
    await transaction(async () => {
      const images = [
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85',
      ];
      const home = await store.one(
        'resources',
        {
          kind: 'pages',
          data: {
            $regex: likePattern('%"slug":"home"%'),
          },
        },
        ['id', 'data'],
      );
      if (home) {
        const data = JSON.parse(home.data);
        data.config.communities = data.config.communities.map((community, index) => ({
          ...community,
          image: community.image || images[index % images.length],
        }));
        await store.update(
          'resources',
          {
            id: home.id,
          },
          {
            data: JSON.stringify(data),
          },
        );
      }
      await store.insert('migrations', {
        version: 8,
      });
    });

  // Event-led positioning for existing installations and fresh databases.
  if (
    !(await store.one('migrations', {
      version: 9,
    }))
  )
    await transaction(async () => {
      const pages = await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      );
      for (const row of pages) {
        const page = JSON.parse(row.data);
        if (page.slug === 'home') {
          page.title = 'Your event. Our expertise. Unforgettable moments.';
          page.body = eventExperience.slides[0].description;
          page.config = {
            ...page.config,
            eventExperience,
          };
        } else if (page.slug === 'footer') {
          page.config = {
            ...page.config,
            brandTagline: 'EVENTS · SPORTS · COACHING',
            brandDescription:
              'Sports event management for tournaments, corporate sports days, schools and communities. Bringing people together through sport, with badminton and chess coaching also available.',
            whatsappMessage: 'Hi, I would like to plan a sports event with GVK Sportss.',
            quickLinksTitle: 'Explore GVK',
            quickLinks: [
              {
                label: 'Plan an Event',
                href: '/contact?interest=Event%20management',
              },
              {
                label: 'Tournaments & Events',
                href: '/events',
              },
              {
                label: 'Our Team',
                href: '/about',
              },
              {
                label: 'Moments & Highlights',
                href: '/gallery',
              },
              {
                label: 'Coaching',
                href: '/coaching',
              },
            ],
            programsTitle: 'Events & Coaching',
            programs: [
              {
                label: 'Corporate Sports Days',
                href: '/contact?interest=Corporate%20sports%20event',
              },
              {
                label: 'School & Community Events',
                href: '/contact?interest=School%20or%20community%20event',
              },
              {
                label: 'Badminton Coaching',
                href: '/coaching?sport=Badminton',
              },
              {
                label: 'Chess Coaching',
                href: '/coaching?sport=Chess',
              },
            ],
            contactName: 'Vamshi Krishna · Events & Coaching',
            copyright: 'GVK Sportss. All rights reserved.',
          };
        } else continue;
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 9,
      });
    });

  // Lead with chess events and coaching while retaining badminton as a secondary service.
  if (
    !(await store.one('migrations', {
      version: 10,
    }))
  )
    await transaction(async () => {
      for (const row of await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      )) {
        const page = JSON.parse(row.data);
        if (page.slug === 'home') {
          page.title = 'GVK Sportss - Sports Event Management Company';
          page.body = eventExperience.slides[0].description;
          page.config = {
            ...page.config,
            eventExperience,
          };
        } else if (page.slug === 'footer') {
          page.config = {
            ...page.config,
            brandDescription:
              'Sports event management company specialising in chess tournaments for schools, gated communities and corporates. Personal chess training through Chesslang with a free demo session. Badminton events and certified coaching also available.',
            whatsappLabel: 'WhatsApp Gajula Vamshi Krishna',
            whatsappMessage:
              'Hi Gajula Vamshi Krishna, I would like to enquire about GVK Sportss chess events or coaching.',
            contactName: 'Gajula Vamshi Krishna - Events & Chess Coaching',
            programsTitle: 'Chess & Badminton Services',
            programs: [
              {
                label: 'Chess Events & Tournaments',
                href: '/events',
              },
              {
                label: 'Chess Coaching - Chesslang',
                href: '/coaching?sport=Chess',
              },
              {
                label: 'Free Chess Demo Session',
                href: '/contact?interest=Free%20chess%20demo',
              },
              {
                label: 'Badminton Events',
                href: '/contact?interest=Badminton%20events',
              },
              {
                label: 'Badminton Coaching',
                href: '/coaching?sport=Badminton',
              },
            ],
          };
        } else continue;
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 10,
      });
    });

  // Persist every live section so the admin editor and public pages share one source.
  if (
    !(await store.one('migrations', {
      version: 11,
    }))
  )
    await transaction(async () => {
      const rows = await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      );
      for (const [slug, defaults] of Object.entries(pageDefaults)) {
        const row = rows.find((row) => JSON.parse(row.data).slug === slug);
        const old = row ? JSON.parse(row.data) : null;
        const savedConfig = old?.config || {};
        const config = mergeContent(defaults.config, savedConfig);
        if (slug === 'home' && !savedConfig.hero && savedConfig.eventExperience) {
          const legacy = savedConfig.eventExperience;
          if (Array.isArray(legacy.slides))
            config.hero.slides = legacy.slides.map((slide, index) => ({
              ...slide,
              id: 'slide-' + index,
              published: true,
            }));
          if (Array.isArray(legacy.services))
            config.audiences.cards = legacy.services.map((card, index) => ({
              id: 'audience-' + index,
              published: true,
              icon: card.icon,
              title: card.title,
              description: card.description,
              href: '/contact?interest=' + encodeURIComponent(card.interest),
            }));
          if (Array.isArray(legacy.steps))
            config.process.steps = legacy.steps.map((step, index) => ({
              ...step,
              id: 'step-' + index,
              published: true,
            }));
        }
        const page = {
          ...defaults,
          ...old,
          config,
        };
        // Replace only the original seeded About copy; preserve custom administrator edits.
        if (slug === 'about' && old?.title === 'Two sports. One shared ambition.') {
          page.title = defaults.title;
          if (
            old.body ===
            'GVK Sportss brings chess and badminton experiences to schools, gated communities and corporates. We bring people together to play, learn and grow.'
          )
            page.body = defaults.body;
        }
        if (row)
          await store.update(
            'resources',
            {
              id: row.id,
            },
            {
              data: JSON.stringify(page),
            },
          );
        else
          await store.insert('resources', {
            kind: 'pages',
            data: JSON.stringify(page),
          });
      }
      await store.insert('migrations', {
        version: 11,
      });
    });

  // Introduce the brand slide once without resetting administrator slide edits.
  if (
    !(await store.one('migrations', {
      version: 12,
    }))
  )
    await transaction(async () => {
      const row = (
        await store.all(
          'resources',
          {
            kind: 'pages',
          },
          {},
          ['id', 'data'],
        )
      ).find((row) => JSON.parse(row.data).slug === 'home');
      if (row) {
        const page = JSON.parse(row.data);
        const slides = (page.config.hero.slides || []).map((slide) => ({
          ...slide,
          containImage: slide.containImage ?? false,
        }));
        if (!slides.some((slide) => slide.id === 'gvk-brand-intro'))
          slides.unshift(structuredClone(pageDefaults.home.config.hero.slides[0]));
        page.config.hero.slides = slides;
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 12,
      });
    });

  // Add the header editor without changing existing page or navigation edits.
  if (
    !(await store.one('migrations', {
      version: 13,
    }))
  )
    await transaction(async () => {
      const exists = (
        await store.all(
          'resources',
          {
            kind: 'pages',
          },
          {},
          ['data'],
        )
      ).some((row) => JSON.parse(row.data).slug === 'header');
      if (!exists)
        await store.insert('resources', {
          kind: 'pages',
          data: JSON.stringify(pageDefaults.header),
        });
      await store.insert('migrations', {
        version: 13,
      });
    });

  // Update public contact content once, preserving account/login email addresses.
  if (
    !(await store.one('migrations', {
      version: 14,
    }))
  )
    await transaction(async () => {
      const replaceEmails = (value) => {
        if (typeof value === 'string')
          return value.replace(/[A-Z0-9._%+-]+@gvksportss\.com/gi, 'gvksportss@gmail.com');
        if (Array.isArray(value)) return value.map(replaceEmails);
        if (value && typeof value === 'object')
          return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, replaceEmails(item)]),
          );
        return value;
      };
      for (const row of await store.all('resources', {}, {}, ['id', 'data'])) {
        const data = replaceEmails(JSON.parse(row.data));
        if (data.slug === 'footer') data.config.emails = ['gvksportss@gmail.com'];
        if (data.slug === 'home')
          data.config.instagram ??= structuredClone(pageDefaults.home.config.instagram);
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(data),
          },
        );
      }
      await store.insert('migrations', {
        version: 14,
      });
    });

  // Replace the feed section with a prominent, editable footer profile link.
  if (
    !(await store.one('migrations', {
      version: 15,
    }))
  )
    await transaction(async () => {
      const rows = await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      );
      const home = rows.map((row) => JSON.parse(row.data)).find((page) => page.slug === 'home');
      for (const row of rows) {
        const page = JSON.parse(row.data);
        if (page.slug === 'footer') {
          page.config.instagramEnabled ??= true;
          page.config.instagramHandle ??= home?.config?.instagram?.handle || 'gvk_sportss';
          page.config.instagramLabel ??= 'Follow our event highlights';
        } else if (page.slug === 'home') {
          delete page.config.instagram;
        } else continue;
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 15,
      });
    });

  // Event artwork is managed per event, never inherited from a sport default.
  if (
    !(await store.one('migrations', {
      version: 16,
    }))
  )
    await transaction(async () => {
      for (const row of await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      )) {
        const page = JSON.parse(row.data);
        if (page.slug !== 'events' || !page.config?.fallbackImages) continue;
        delete page.config.fallbackImages;
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 16,
      });
    });

  // Remove the two shared stock photos previously assigned by migration 7.
  // Preserve every other image chosen for an individual event.
  if (
    !(await store.one('migrations', {
      version: 17,
    }))
  )
    await transaction(async () => {
      const seededImages = new Set([
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=85',
        'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1400&q=85',
      ]);
      for (const row of await store.all(
        'resources',
        {
          kind: 'events',
        },
        {},
        ['id', 'data'],
      )) {
        const event = JSON.parse(row.data);
        if (!seededImages.has(event.image)) continue;
        event.image = '';
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(event),
          },
        );
      }
      await store.insert('migrations', {
        version: 17,
      });
    });

  // Enable the launch ceremony without replacing existing homepage content.
  if (
    !(await store.one('migrations', {
      version: 18,
    }))
  )
    await transaction(async () => {
      for (const row of await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      )) {
        const page = JSON.parse(row.data);
        if (page.slug !== 'home') continue;
        page.config.launch ??= structuredClone(pageDefaults.home.config.launch);
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 18,
      });
    });

  // Apply the official tagline to existing branding and selected hero slides once.
  if (
    !(await store.one('migrations', {
      version: 19,
    }))
  )
    await transaction(async () => {
      for (const row of await store.all(
        'resources',
        {
          kind: 'pages',
        },
        {},
        ['id', 'data'],
      )) {
        const page = JSON.parse(row.data);
        if (!['header', 'footer', 'home'].includes(page.slug)) continue;
        page.config ??= {};
        if (page.slug === 'header') {
          page.config.brand ??= structuredClone(pageDefaults.header.config.brand);
          page.config.brand.tagline = brandTagline;
          page.config.brand.showTagline = true;
        } else if (page.slug === 'footer') {
          page.config.brandTagline = brandTagline;
        } else {
          page.config.launch ??= structuredClone(pageDefaults.home.config.launch);
          page.config.launch.tagline = brandTagline;
          for (const [index, slide] of (page.config.hero?.slides || []).entries()) {
            slide.tagline = index === 0 || index === 2 ? brandTagline : '';
            if (slide.title === 'PLAY, Learn, Grow') slide.title = 'Your game. Your community.';
          }
        }
        await store.update(
          'resources',
          {
            id: row.id,
          },
          {
            data: JSON.stringify(page),
          },
        );
      }
      await store.insert('migrations', {
        version: 19,
      });
    });
});

await migrateTeamAndPages(store);

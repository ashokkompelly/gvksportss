import { db, transaction } from './index.js';
if (!db.prepare('SELECT 1 FROM migrations WHERE version=1').get())
  transaction(() => {
    const insert = (kind, data) =>
      db
        .prepare('INSERT INTO resources(kind,data) VALUES(?,?)')
        .run(kind, JSON.stringify({ published: true, ...data }));
    insert('pages', {
      slug: 'home',
      title: 'Better skills. Sharper minds.',
      body: 'Discover chess and badminton coaching, friendly competition, and sports experiences for your community.',
    });
    insert('pages', {
      slug: 'about',
      title: 'Two sports. One shared ambition.',
      body: 'GVK Sportss brings chess and badminton experiences to schools, gated communities and corporates. We bring people together to play, learn and grow.',
    });
    insert('programs', {
      title: 'Badminton coaching',
      sport: 'Badminton',
      level: 'All levels',
      description: 'Build your technique, footwork and match confidence with structured practice.',
      mode: 'In person',
    });
    insert('programs', {
      title: 'Chess foundations',
      sport: 'Chess',
      level: 'Beginner',
      description: 'Learn the rules, spot tactical patterns and build confident decision-making.',
      mode: 'In person / online',
    });
    insert('programs', {
      title: 'Chess development',
      sport: 'Chess',
      level: 'Intermediate',
      description:
        'Develop openings, strategic thinking and endgame skills through guided game analysis.',
      mode: 'In person / online',
    });
    insert('gallery', {
      title: 'GVK Sportss brand launch artwork',
      url: '/brand-launch.jpeg',
      description:
        'Supplied brand artwork. Dates shown on the poster are not a current event listing.',
    });
    db.prepare('INSERT INTO migrations(version) VALUES(1)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=2').get())
  transaction(() => {
    const insert = (kind, data) =>
      db
        .prepare('INSERT INTO resources(kind,data) VALUES(?,?)')
        .run(kind, JSON.stringify({ published: true, ...data }));

    const now = new Date();
    const plusDays = (days, hours = 9) => {
      const d = new Date(now.getTime() + days * 86400000);
      d.setHours(hours, 0, 0, 0);
      return d.toISOString();
    };

    // Rich Badminton & Chess Programs
    insert('programs', {
      title: 'Badminton High-Performance Squad',
      sport: 'Badminton',
      level: 'Advanced / Competitive',
      description: 'Olympic BWF court drills, 360° video smash biomechanics analysis, and speed radar tracking.',
      mode: 'In person (Financial District HQ)',
    });

    insert('programs', {
      title: 'Chesslang FIDE Grandmaster Masterclass',
      sport: 'Chess',
      level: 'Advanced (1600+ Elo)',
      description: 'Official Chesslang digital platform integration, Grandmaster tactical analysis, and tournament preparation.',
      mode: 'In person + Chesslang Online',
    });

    insert('programs', {
      title: 'Grassroots Junior Badminton (Ages 5-12)',
      sport: 'Badminton',
      level: 'Beginner / Intermediate',
      description: 'Rhythm, footwork agility, hand-eye coordination, and foundational stroke technique in a fun environment.',
      mode: 'In person (All Centers)',
    });

    // Upcoming Events
    insert('events', {
      title: 'Hyderabad Open Badminton Championship 2026',
      sport: 'Badminton',
      description: 'Annual state-ranking tournament featuring singles & doubles across Under-13, Under-17, and Open categories. Trophies and cash prizes.',
      start: plusDays(7, 9),
      location: 'GVK Sportss Arena — Financial District HQ',
      capacity: 64,
      membersOnly: false,
    });

    insert('events', {
      title: 'GVK × Chesslang Blitz Arena Tournament',
      sport: 'Chess',
      description: 'FIDE-rated blitz championship with live digital board broadcast on Chesslang. 9-round Swiss format (3 mins + 2 sec increment).',
      start: plusDays(12, 14),
      location: 'GVK Chess Lounge & Chesslang Digital Portal',
      capacity: 50,
      membersOnly: false,
    });

    insert('events', {
      title: 'Corporate Sports League — Badminton Cup',
      sport: 'Badminton',
      description: 'Weekend corporate team tournament for Hyderabad tech and business teams. Mixed doubles and men’s doubles categories.',
      start: plusDays(20, 10),
      location: 'GVK Sportss Arena — Financial District HQ',
      capacity: 32,
      membersOnly: false,
    });

    // Upcoming Coaching Slots
    insert('slots', {
      title: 'Morning Badminton Elite Training Batch',
      sport: 'Badminton',
      start: plusDays(1, 6),
      end: plusDays(1, 8),
      location: 'Court 1 & 2, Financial District Arena',
      capacity: 8,
      membersOnly: false,
    });

    insert('slots', {
      title: 'Chesslang Tactical Opening Masterclass',
      sport: 'Chess',
      start: plusDays(2, 17),
      end: plusDays(2, 19),
      location: 'GVK Chess Center & Chesslang Classroom',
      capacity: 12,
      membersOnly: false,
    });

    insert('slots', {
      title: 'Evening Smash & Video Analysis Clinic',
      sport: 'Badminton',
      start: plusDays(3, 18),
      end: plusDays(3, 20),
      location: 'Center Court, Financial District Arena',
      capacity: 6,
      membersOnly: false,
    });

    // Membership Plans
    insert('plans', {
      title: 'Badminton Unlimited Court Pass',
      description: 'Daily court booking access, video analysis clinic discount, and priority tournament entries.',
      price: 3499,
      durationDays: 30,
    });

    insert('plans', {
      title: 'Chesslang Full Academy Digital Access',
      description: 'Full Chesslang portal license, weekly FIDE mentor game reviews, and unlimited blitz arena entries.',
      price: 2499,
      durationDays: 30,
    });

    db.prepare('INSERT INTO migrations(version) VALUES(2)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=3').get())
  transaction(() => {
    const page = db.prepare("SELECT id,data FROM resources WHERE kind='pages' AND data LIKE '%\"slug\":\"about\"%'").get();
    if (page) {
      const data = JSON.parse(page.data);
      if (data.title === 'Two sports. One shared ambition.') {
        data.title = 'Trainers & Team';
        db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), page.id);
      }
    }
    db.prepare('INSERT INTO migrations(version) VALUES(3)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=4').get())
  transaction(() => {
    const page = db.prepare("SELECT id,data FROM resources WHERE kind='pages' AND data LIKE '%\"slug\":\"home\"%'").get();
    if (page) {
      const data = JSON.parse(page.data);
      data.config = {
        eyebrow: 'CHESS + BADMINTON • HYDERABAD',
        heroDescription: 'Elevate your game with world-class coaching, Olympic-grade badminton courts, and interactive chess coaching powered by the Chesslang platform.',
        primaryAction: { label: 'Explore Coaching Batches', href: '/coaching' },
        secondaryAction: { label: 'Tournaments & Events', href: '/events' },
        heroImage: '/logo.jpg',
        heroImageAlt: 'GVK Sportss Gold and Black Emblem',
        heroLabel: 'THE GVK STANDARD',
        heroStandard: 'Discipline. Technique. Mastery.',
        heroFoot: ['01 / 8 BWF Synthetic Courts', '02 / Chesslang Platform Coaching', '03 / FIDE & BWF Certified Coaches'],
        metrics: [
          { value: '8 Courts', label: 'Olympic-Grade BWF Mats' },
          { value: 'Chesslang', label: 'Platform Coaching' },
          { value: '15+ Coaches', label: 'BWF & FIDE Certified Mentors' },
          { value: '500+', label: 'Active Academy Athletes' },
        ],
        sportsEyebrow: 'CHOOSE YOUR DISCIPLINE',
        sportsTitle: 'Precision on court.\nStrategy on board.',
        sportsDescription: 'Whether smashing at 350+ km/h or outmaneuvering an opponent in a Sicilian defense, GVK provides championship-level mentoring.',
        sports: [
          { number: '01 / BADMINTON HIGH-PERFORMANCE', title: 'Badminton Academy', description: 'BWF Level 2 certified coaching, slow-motion biomechanics video smash analysis, radar speed tracking, and Olympic-spec synthetic shock-absorbing courts.', badges: ['BWF Certified', 'Video Analysis', 'Smash Radar'], href: '/coaching?sport=Badminton' },
          { number: '02 / CHESS COACHING', title: 'Chess Masterclass', description: 'Integrated with the Chesslang platform for digital coaching. FIDE-rated trainers, interactive live board sessions, tactical puzzle homework, and regular game debriefs.', badges: ['Chesslang Platform Coaching', 'FIDE Mentors', 'Interactive Boards'], href: '/coaching?sport=Chess' },
        ],
        communityEyebrow: 'SPORTS FOR EVERY COMMUNITY',
        communityTitle: 'Bring championship energy into play.',
        communityAction: { label: 'Plan an Experience', href: '/contact' },
        communities: [
          { icon: 'school', title: 'Schools & Academies', description: 'Curriculum-integrated badminton and chess coaching, inter-school tournaments, and youth scout camps.' },
          { icon: 'users', title: 'Gated Communities', description: 'Resident leagues, weekend clinics, certified coaches on-site, and friendly multi-age championships.' },
          { icon: 'building', title: 'Corporate Leagues', description: 'Executive stress-relief wellness, corporate badminton cups, and workplace chess tournaments.' },
        ],
      };
      db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), page.id);
    }
    db.prepare('INSERT INTO migrations(version) VALUES(4)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=5').get())
  transaction(() => {
    const footer = {
      brandName: 'GVK SPORTSS',
      brandTagline: 'PLAY · LEARN · GROW',
      brandDescription: 'Premier sports training academy specializing in professional badminton court coaching, official Chesslang digital masterclasses, and competitive sports championships.',
      whatsappLabel: 'WhatsApp Vamshi Krishna',
      whatsappNumber: '919492063258',
      whatsappMessage: 'Hi Vamshi Krishna, I would like to enquire about GVK Sportss coaching sessions.',
      quickLinksTitle: 'Academy Links',
      quickLinks: [
        { label: 'Badminton Coaching', href: '/coaching?sport=Badminton' },
        { label: 'Chess Coaching', href: '/coaching?sport=Chess' },
        { label: 'Tournaments & Leagues', href: '/events' },
        { label: 'Coaching Faculty & Mentors', href: '/about' },
        { label: 'Moments & Highlights', href: '/gallery' },
        { label: 'Admin Staff Portal', href: '/admin' },
      ],
      programsTitle: 'Programs',
      programs: [
        { label: 'Grassroots Youth (5-10 yrs)', href: '/coaching' },
        { label: 'Elite Competitive Squad', href: '/coaching' },
        { label: 'Adult High-Fitness Batches', href: '/coaching' },
        { label: 'Chess Coaching & Puzzles', href: '/coaching?sport=Chess' },
        { label: 'School & Corporate Leagues', href: '/contact?interest=Schools' },
      ],
      contactTitle: 'Contact Arena',
      contactName: 'Vamshi Krishna · Coaching Desk',
      phones: ['+91 94920 63258', '+91 91234 56789'],
      emails: ['info@gvksportss.com', 'coaching@gvksportss.com'],
      address: ['GVK Sportss Arena', 'Plot 42, Financial District, Gachibowli,', 'Hyderabad, Telangana 500032'],
      hours: ['Operating Hours:', 'Mon – Sun: 6:00 AM – 10:00 PM'],
      copyright: 'GVK Sportss Academy. All rights reserved. Play. Learn. Grow.',
      bottomLinks: [
        { label: 'Our Team', href: '/about' },
        { label: 'Directions', href: '/contact' },
        { label: 'Member Login', href: '/login' },
      ],
    };
    const existing = db.prepare("SELECT id,data FROM resources WHERE kind='pages' AND data LIKE '%\"slug\":\"footer\"%'").get();
    if (existing) {
      const data = JSON.parse(existing.data);
      data.config = footer;
      db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), existing.id);
    } else {
      db.prepare('INSERT INTO resources(kind,data) VALUES(?,?)').run('pages', JSON.stringify({ published: true, slug: 'footer', title: 'Site Footer', body: 'Footer configuration', config: footer }));
    }
    db.prepare('INSERT INTO migrations(version) VALUES(5)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=6').get())
  transaction(() => {
    const media = {
      badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
      chess: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1200&q=85',
      event: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=85',
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
      const row = db.prepare('SELECT id,data FROM resources WHERE data LIKE ?').get(`%"title":"${title}"%`);
      if (row) {
        const data = JSON.parse(row.data);
        data.image = image;
        db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), row.id);
      }
    }
    const home = db.prepare("SELECT id,data FROM resources WHERE kind='pages' AND data LIKE '%\"slug\":\"home\"%'").get();
    if (home) {
      const data = JSON.parse(home.data);
      data.config.sports = data.config.sports.map((sport) => ({
        ...sport,
        image: sport.href.includes('Badminton') ? media.badminton : media.chess,
      }));
      db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), home.id);
    }
    db.prepare('INSERT INTO migrations(version) VALUES(6)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=7').get())
  transaction(() => {
    const eventImages = {
      Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=85',
      Chess: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1400&q=85',
    };
    for (const [sport, image] of Object.entries(eventImages)) {
      const rows = db.prepare('SELECT id,data FROM resources WHERE kind=\'events\' AND data LIKE ?').all(`%\"sport\":\"${sport}\"%`);
      for (const row of rows) {
        const data = JSON.parse(row.data);
        data.image = image;
        db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), row.id);
      }
    }
    db.prepare('INSERT INTO migrations(version) VALUES(7)').run();
  });

if (!db.prepare('SELECT 1 FROM migrations WHERE version=8').get())
  transaction(() => {
    const images = [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85',
    ];
    const home = db.prepare("SELECT id,data FROM resources WHERE kind='pages' AND data LIKE '%\"slug\":\"home\"%'").get();
    if (home) {
      const data = JSON.parse(home.data);
      data.config.communities = data.config.communities.map((community, index) => ({
        ...community,
        image: community.image || images[index % images.length],
      }));
      db.prepare('UPDATE resources SET data=? WHERE id=?').run(JSON.stringify(data), home.id);
    }
    db.prepare('INSERT INTO migrations(version) VALUES(8)').run();
  });

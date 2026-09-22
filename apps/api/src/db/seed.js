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

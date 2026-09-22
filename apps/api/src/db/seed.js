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

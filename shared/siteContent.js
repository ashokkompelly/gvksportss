export const brandTagline = "Just play Don't stop";

// Shared defaults seed persisted page content and define the admin form structure.
export const pageDefaults = {
  home: {
    slug: 'home',
    title: 'GVK Sportss | Sports Event Management Company',
    body: 'GVK Sportss organises chess tournaments for schools, gated communities and corporates. From planning to tournament day, we help turn your ideas into a memorable sporting experience.',
    published: true,
    config: {
      launch: {
        enabled: true,
        eyebrow: 'THE GRAND OPENING',
        title: 'A new arena.\nA new beginning.',
        description: 'The stage is set. Join us as we open the doors to GVK Sportss.',
        tagline: brandTagline,
        buttonLabel: 'Launch Website',
        skipLabel: 'Enter website',
        countdownLabel: 'THE MOMENT IS HERE',
        welcomeLabel: 'WELCOME TO GVK SPORTSS',
      },
      hero: {
        enabled: true,
        captionLabel: 'THE GVK EVENT EXPERIENCE',
        primaryAction: {
          label: 'Plan your event',
          href: '/contact?interest=Sports%20event%20management',
        },
        secondaryAction: {
          label: 'Explore events',
          href: '/events',
        },
        highlights: ['Schools', 'Gated communities', 'Corporates'],
        slides: [
          {
            id: 'gvk-brand-intro',
            tagline: brandTagline,
            published: true,
            label: 'GVK SPORTSS · SPORTS EVENT MANAGEMENT COMPANY',
            title: 'Your game. Your community.',
            description:
              'Bringing people together through chess and badminton. Explore our events for schools, gated communities and corporates, alongside personal chess training and certified badminton coaching.',
            image: '/logo.jpg',
            alt: 'GVK Sportss gold logo with chess and badminton symbols',
            caption: 'Chess. Badminton. One sporting community.',
            containImage: true,
          },
          {
            label: 'SPORTS EVENT MANAGEMENT COMPANY',
            title: 'Chess events that bring people together.',
            description:
              'GVK Sportss organises chess tournaments for schools, gated communities and corporates. From planning to tournament day, we help turn your ideas into a memorable sporting experience.',
            image:
              'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1800&q=85',
            alt: 'Chess pieces arranged on a board for play',
            caption: 'Schools. Gated communities. Corporates.',
            id: 'slide-0',
            tagline: '',
            published: true,
            containImage: false,
          },
          {
            label: 'CHESS COACHING · CHESSLANG PLATFORM',
            title: 'Learn the game. Grow your confidence.',
            description:
              'Explore personal chess training with Gajula Vamshi Krishna through the Chesslang platform, alongside online coaching and workshops. A free demo session is available.',
            image:
              'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1600&q=85',
            alt: 'Chess players studying a position across the board',
            caption: 'Personal chess training. Free demo session available.',
            id: 'slide-1',
            tagline: brandTagline,
            published: true,
            containImage: false,
          },
          {
            label: 'BADMINTON EVENTS & COACHING',
            title: 'Bring your people onto the court.',
            description:
              'We also provide badminton tournaments, corporate and community events, and coaching with certified coaches. Talk to our team about your next event or training session.',
            image:
              'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=85',
            alt: 'Badminton court prepared for play',
            caption: 'Badminton events and certified coaching.',
            id: 'slide-2',
            tagline: '',
            published: true,
            containImage: false,
          },
        ],
      },
      audiences: {
        enabled: true,
        eyebrow: 'CHESS EVENTS FOR YOUR PEOPLE',
        title: 'Your people. Your tournament.\nOur team behind it.',
        description:
          'Chess tournaments come first at GVK. We help schools, gated communities and corporates plan an event around their people.',
        actionLabel: 'Let’s plan it',
        cards: [
          {
            icon: 'school',
            title: 'Chess for schools',
            description:
              'School chess tournaments, coaching programmes and workshops that bring students together to learn and compete.',
            id: 'audience-0',
            published: true,
            href: '/contact?interest=School%20chess%20events%20and%20programs',
          },
          {
            icon: 'users',
            title: 'Chess for gated communities',
            description:
              'Resident chess tournaments, community events and workshops for your neighbourhood.',
            id: 'audience-1',
            published: true,
            href: '/contact?interest=Gated%20community%20chess%20events',
          },
          {
            icon: 'building',
            title: 'Chess for corporates',
            description:
              'Corporate chess events and tournaments that bring colleagues together through friendly competition.',
            id: 'audience-2',
            published: true,
            href: '/contact?interest=Corporate%20chess%20events',
          },
        ],
      },
      services: {
        enabled: true,
        eyebrow: 'OUR SERVICES',
        title: 'What we can do for you.',
        description:
          'A sports event management company with chess at its heart, supported by badminton events and coaching.',
        groups: [
          {
            sport: 'Chess',
            label: 'OUR LEAD SPORT',
            description:
              'Tournaments, learning and shared experiences — built around your school, community or company.',
            items: [
              {
                id: 'service-0-0',
                published: true,
                label: 'Chess Tournaments',
                href: '/contact?interest=Chess%3A%20Chess%20Tournaments',
              },
              {
                id: 'service-0-1',
                published: true,
                label: 'Chess Coaching – Chesslang platform',
                href: '/contact?interest=Chess%3A%20Chess%20Coaching%20%E2%80%93%20Chesslang%20platform',
              },
              {
                id: 'service-0-2',
                published: true,
                label: 'Corporate Chess Events',
                href: '/contact?interest=Chess%3A%20Corporate%20Chess%20Events',
              },
              {
                id: 'service-0-3',
                published: true,
                label: 'School Chess Programs',
                href: '/contact?interest=Chess%3A%20School%20Chess%20Programs',
              },
              {
                id: 'service-0-4',
                published: true,
                label: 'Gated Community Chess Events',
                href: '/contact?interest=Chess%3A%20Gated%20Community%20Chess%20Events',
              },
              {
                id: 'service-0-5',
                published: true,
                label: 'Chess Workshops',
                href: '/contact?interest=Chess%3A%20Chess%20Workshops',
              },
              {
                id: 'service-0-6',
                published: true,
                label: 'Online Chess Coaching',
                href: '/contact?interest=Chess%3A%20Online%20Chess%20Coaching',
              },
              {
                id: 'service-0-7',
                published: true,
                label: 'Free Demo Session',
                href: '/contact?interest=Chess%3A%20Free%20Demo%20Session',
              },
            ],
            id: 'group-0',
            published: true,
          },
          {
            sport: 'Badminton',
            label: 'ALSO AT GVK',
            description:
              'Badminton events and coaching with certified coaches. Simple, focused support for your next game.',
            items: [
              {
                id: 'service-1-0',
                published: true,
                label: 'Badminton Tournaments',
                href: '/contact?interest=Badminton%3A%20Badminton%20Tournaments',
              },
              {
                id: 'service-1-1',
                published: true,
                label: 'Corporate Badminton Events',
                href: '/contact?interest=Badminton%3A%20Corporate%20Badminton%20Events',
              },
              {
                id: 'service-1-2',
                published: true,
                label: 'Community Tournaments',
                href: '/contact?interest=Badminton%3A%20Community%20Tournaments',
              },
              {
                id: 'service-1-3',
                published: true,
                label: 'Badminton Coaching',
                href: '/contact?interest=Badminton%3A%20Badminton%20Coaching',
              },
              {
                id: 'service-1-4',
                published: true,
                label: 'Certified Coaching Programs',
                href: '/contact?interest=Badminton%3A%20Certified%20Coaching%20Programs',
              },
            ],
            id: 'group-1',
            published: true,
          },
        ],
      },
      calendar: {
        enabled: true,
        eyebrow: 'JOIN THE ACTION',
        title: 'On the event calendar.',
        description: '',
        preferredSport: 'Chess',
        action: {
          label: 'View all events',
          href: '/events',
        },
        eventAction: {
          label: 'Explore & register',
          href: '/events',
        },
        badge: 'Upcoming event',
        emptyTitle: 'The next great event could be yours.',
        emptyDescription:
          'Have a tournament or sports day in mind? Let’s start planning it together.',
        emptyAction: {
          label: 'Host an event',
          href: '/contact?interest=Host%20an%20event',
        },
      },
      process: {
        enabled: true,
        eyebrow: 'FROM IDEA TO EVENT DAY',
        title: 'Great events start with a conversation.',
        description: '',
        action: {
          label: 'Talk to our team',
          href: '/contact?interest=Event%20planning',
        },
        steps: [
          {
            title: 'Share your vision',
            description: 'Tell us your audience, preferred dates, sports and budget.',
            id: 'step-0',
            published: true,
          },
          {
            title: 'Build the event',
            description: 'We work with you on the format, venue needs, schedule and coordination.',
            id: 'step-1',
            published: true,
          },
          {
            title: 'Enjoy the day',
            description: 'Bring your people together while our team coordinates the action.',
            id: 'step-2',
            published: true,
          },
        ],
      },
      training: {
        enabled: true,
        eyebrow: 'CHESS COACHING AT GVK',
        title: 'Personal attention. A stronger game.',
        description: '',
        badge: 'Free demo session available',
        trainerTitle: 'Train with Gajula Vamshi Krishna',
        paragraphs: [
          'Founder of GVK Sportss and a personal chess trainer, Gajula Vamshi Krishna brings chess learning and sporting events together. His training through the Chesslang platform helps learners explore the game with personal guidance.',
          'Choose online chess coaching, workshops or school programmes, and start with a free demo session.',
        ],
        primaryAction: {
          label: 'Book a free demo',
          href: '/contact?interest=Free%20chess%20demo%20with%20Gajula%20Vamshi%20Krishna',
        },
        secondaryAction: {
          label: 'Meet our team',
          href: '/about',
        },
        platform: {
          eyebrow: 'CHESSLANG PLATFORM',
          title: 'Learn wherever you play.',
          description:
            'Personal chess training and online sessions through Chesslang, alongside GVK’s tournaments and workshops.',
          action: {
            label: 'Explore chess coaching',
            href: '/coaching?sport=Chess',
          },
        },
        secondary: {
          title: 'Badminton coaching is available too.',
          description: 'Build your skills with certified coaches.',
          action: {
            label: 'Explore badminton',
            href: '/coaching?sport=Badminton',
          },
        },
      },
    },
  },
  about: {
    slug: 'about',
    title: 'The expertise behind your event.',
    body: 'From chess tournaments for schools, gated communities and corporates to badminton events, our team brings together sporting knowledge, event coordination and production experience.',
    published: true,
    config: {
      eyebrow: 'GVK SPORTSS',
      team: {
        enabled: true,
        eyebrow: 'FACULTY & LEADERSHIP',
        title: 'The People Behind GVK Sportss',
        description:
          'Meet the people behind our events, from tournament operations and player coordination to media and digital support.',
        achievementButton: 'View achievements',
        achievementEyebrow: 'CREDENTIALS & EVENT EXPERIENCE',
        members: [
          {
            name: 'Gajula Vamshi Krishna',
            image:
              'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=85',
            role: 'Founder & Personal Chess Trainer',
            category: 'Leadership',
            sports: ['Chess'],
            experience: 'Chess Training & Events',
            domain: 'Personal Chess Training, Chesslang Coaching & Sports Event Management',
            bio: 'Gajula Vamshi Krishna leads GVK Sportss with a focus on chess events for schools, gated communities and corporates. He also provides personal chess training through the Chesslang platform, with a free demo session available.',
            certification: 'Personal Chess Training · Chesslang Platform',
            achievements: [
              'Founder of GVK Sportss, a sports event management company',
              'Personal chess training through the Chesslang platform',
              'Chess events and programmes for schools, gated communities and corporates',
              'Online chess coaching and workshops, with a free demo session available',
            ],
            eventValue:
              'Combining personal chess instruction with the wider GVK team’s event services, helping organisations bring people together to learn and compete.',
            id: 'member-0',
            published: true,
            imageAlt: 'Gajula Vamshi Krishna',
            action: {
              label: 'Discuss your event',
              href: '/contact?interest=Event%20planning%20with%20Gajula%20Vamshi%20Krishna',
            },
          },
          {
            name: 'Mohan',
            image:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85',
            role: 'Badminton Operations Lead',
            category: 'Badminton',
            experience: '8+ Years Experience',
            domain: 'Olympic Court Management, Precision Electronic Racket Stringing',
            bio: 'Ensures tournament-grade court condition, LED lighting lux standards, shuttlecock temperature regulation, and precision stringing tension.',
            certification: 'Certified Badminton Operations Manager',
            achievements: [
              'Tournament court preparation and management',
              'Precision electronic racket stringing',
              'Match lighting and equipment coordination',
            ],
            eventValue:
              'Court and equipment preparation help keep your badminton event ready for play.',
            id: 'member-1',
            published: true,
            sports: [],
            imageAlt: 'Mohan',
            action: {
              label: 'Discuss your event',
              href: '/contact?interest=Event%20planning%20with%20Mohan',
            },
          },
          {
            name: 'Sunil',
            image:
              'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=85',
            role: 'Creative & Media Director',
            category: 'Leadership',
            experience: '10+ Years Experience',
            domain: 'Sports Broadcast Media, Player Branding & Tournament Production',
            bio: 'Leads visual storytelling, live match broadcasts, tournament creative assets, and athlete sponsorship engagement.',
            certification: 'Media Production Specialist',
            achievements: [
              'Live match broadcast production',
              'Tournament creative assets and visual storytelling',
              'Player branding and athlete sponsorship engagement',
            ],
            eventValue:
              'Creative and media support to help your event connect with players, audiences and sponsors.',
            id: 'member-2',
            published: true,
            sports: [],
            imageAlt: 'Sunil',
            action: {
              label: 'Discuss your event',
              href: '/contact?interest=Event%20planning%20with%20Sunil',
            },
          },
          {
            name: 'Anup',
            image:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85',
            role: 'Chess Operations Director',
            category: 'Chess',
            experience: '11+ Years Experience',
            domain: 'FIDE Rated Event Arbiter & Youth Talent Scouting',
            bio: 'Organizes national-level Swiss format tournaments, coordinates school chess circuits, and oversees digital pairings.',
            certification: 'FIDE National Arbiter (NA)',
            achievements: [
              'National-level Swiss format tournament organisation',
              'School chess circuit coordination',
              'Digital tournament pairings',
            ],
            eventValue:
              'Tournament formats, pairings and coordination support a smooth chess event.',
            id: 'member-3',
            published: true,
            sports: [],
            imageAlt: 'Anup',
            action: {
              label: 'Discuss your event',
              href: '/contact?interest=Event%20planning%20with%20Anup',
            },
          },
          {
            name: 'Ashok',
            image:
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=85',
            role: 'Digital & Web Director',
            category: 'Leadership',
            experience: '12+ Years Experience',
            domain: 'Sports Tech Platforms, Live Tournament Scoring & Player Portals',
            bio: 'Architect of GVK digital platforms, player member booking workflows, tournament streaming setups, and analytics integrations.',
            certification: 'Sports Tech Systems Lead',
            achievements: [
              'GVK digital platforms and player booking workflows',
              'Tournament streaming setups',
              'Analytics integrations and player portals',
            ],
            eventValue:
              'Digital systems that support event coordination and the player experience.',
            id: 'member-4',
            published: true,
            sports: [],
            imageAlt: 'Ashok',
            action: {
              label: 'Discuss your event',
              href: '/contact?interest=Event%20planning%20with%20Ashok',
            },
          },
        ],
      },
    },
  },
  coaching: {
    slug: 'coaching',
    title: 'Learn chess. Be part of the game.',
    body: 'Chess is our main coaching sport, with personal training through Chesslang and a free demo session. Our sports event management team also brings schools, communities and corporates together through chess and badminton events.',
    published: true,
    config: {
      eyebrow: 'COACHING AT GVK SPORTSS',
      cards: [
        {
          eyebrow: 'OUR MAIN COACHING SPORT',
          title: 'Personal chess training with Gajula Vamshi Krishna',
          description:
            'Learn through the Chesslang platform with personal guidance from Gajula Vamshi Krishna. GVK brings together chess coaching, workshops and tournaments for individuals, schools, gated communities and corporates.',
          icon: 'award',
          image:
            'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=85',
          benefits: [
            'Personal training through the Chesslang platform',
            'Online chess coaching and chess workshops',
            'School chess programmes',
            'Free demo session available',
          ],
          sport: 'Chess',
          id: 'coaching-0',
          published: true,
          imageAlt: 'Chess coaching',
          action: {
            label: 'Book a free chess demo',
            href: '/contact?interest=Free%20chess%20demo%20with%20Gajula%20Vamshi%20Krishna',
          },
        },
        {
          eyebrow: 'ALSO AT GVK',
          title: 'Badminton coaching with certified coaches',
          description:
            'We provide badminton coaching and certified coaching programmes, alongside tournaments, corporate events and community competitions.',
          icon: 'flame',
          image:
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85',
          benefits: [
            'Badminton coaching',
            'Certified coaching programmes',
            'Badminton events and tournaments',
          ],
          sport: 'Badminton',
          id: 'coaching-1',
          published: true,
          imageAlt: 'Badminton coaching',
          action: {
            label: 'Ask about badminton',
            href: '/contact?interest=Badminton%20coaching',
          },
        },
      ],
    },
  },
  events: {
    slug: 'events',
    title: 'More than a game.',
    body: 'Chess tournaments for schools, gated communities and corporates lead our event calendar. We also organise badminton tournaments and community competitions.',
    published: true,
    config: {
      eyebrow: 'COME TOGETHER. COMPETE. CELEBRATE.',
      callout: {
        enabled: true,
        title: 'Planning a tournament, corporate sports day or community event?',
        description: 'Bring your ideas to our team and let’s plan the details together.',
        action: {
          label: 'Plan your event',
          href: '/contact?interest=Sports%20event%20management',
        },
      },
      upcomingLabel: 'Upcoming',
      pastLabel: 'Past events',
      emptyUpcoming: 'Upcoming events will be announced here. Check back soon.',
      emptyPast: 'Past events will appear here.',
      registerLabel: 'Register',
      membersLabel: 'Members only',
    },
  },
  header: {
    slug: 'header',
    title: 'Site Header',
    body: 'Site-wide branding, desktop menus, mobile navigation and account links.',
    published: true,
    config: {
      brand: {
        name: 'GVK SPORTSS',
        tagline: 'EVENTS · SPORTS · COACHING',
        image: '/logo.jpeg',
        alt: 'GVK Sportss Logo',
        href: '/',
        showLogo: true,
        showName: true,
        showTagline: true,
        newTab: false,
      },
      navigation: {
        enabled: true,
        items: [
          {
            id: 'nav-home',
            label: 'Home',
            href: '/',
            icon: 'home',
            published: true,
            desktop: true,
            mobile: true,
            newTab: false,
          },
          {
            id: 'nav-events',
            label: 'Events',
            href: '/events',
            icon: 'calendar',
            published: true,
            desktop: true,
            mobile: true,
            newTab: false,
          },
          {
            id: 'nav-coaching',
            label: 'Coaching',
            href: '/coaching',
            icon: 'graduation',
            published: true,
            desktop: true,
            mobile: true,
            newTab: false,
          },
          {
            id: 'nav-team',
            label: 'Our Team',
            href: '/about',
            icon: 'users',
            published: true,
            desktop: true,
            mobile: false,
            newTab: false,
          },
          {
            id: 'nav-gallery',
            label: 'Gallery',
            href: '/gallery',
            icon: 'image',
            published: true,
            desktop: true,
            mobile: false,
            newTab: false,
          },
          {
            id: 'nav-contact',
            label: 'Contact',
            href: '/contact',
            icon: 'phone',
            published: true,
            desktop: true,
            mobile: true,
            newTab: false,
          },
        ],
      },
      account: {
        desktopEnabled: true,
        mobileEnabled: true,
        showMemberName: true,
        guestAction: {
          label: 'Member Portal',
          href: '/login',
          newTab: false,
        },
        mobileGuestAction: {
          label: 'Login',
          href: '/account',
          newTab: false,
        },
        memberAction: {
          label: 'My GVK',
          href: '/account',
          newTab: false,
        },
        adminAction: {
          label: 'Admin',
          href: '/admin',
          newTab: false,
        },
        logoutLabel: 'Log out',
      },
    },
  },
};

export const managedSlugs = Object.keys(pageDefaults);
export const visibleItems = (items = []) => items.filter((item) => item.published !== false);

// Missing fields receive defaults; intentionally empty arrays and strings are preserved.
export function mergeContent(defaults, saved) {
  if (saved === undefined) return structuredClone(defaults);
  if (
    defaults &&
    typeof defaults === 'object' &&
    !Array.isArray(defaults) &&
    saved &&
    typeof saved === 'object' &&
    !Array.isArray(saved)
  ) {
    return Object.fromEntries(
      Object.keys(defaults).map((key) => [key, mergeContent(defaults[key], saved[key])]),
    );
  }
  return saved;
}

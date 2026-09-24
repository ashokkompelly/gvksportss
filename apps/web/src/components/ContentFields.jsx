import ImageUpload from './ImageUpload';
const labels = {
  header: 'Header & navigation',
  brand: 'Logo & brand',
  tagline: 'Brand tagline',
  navigation: 'Navigation menus',
  desktop: 'Show in desktop menu',
  mobile: 'Show in mobile menu',
  newTab: 'Open link in a new tab',
  showLogo: 'Show logo',
  showName: 'Show brand name',
  showTagline: 'Show tagline',
  account: 'Account & portal links',
  desktopEnabled: 'Show account links in header',
  mobileEnabled: 'Show account link in mobile navigation',
  showMemberName: 'Show signed-in member name',
  guestAction: 'Visitor portal button',
  mobileGuestAction: 'Mobile visitor button',
  memberAction: 'Signed-in member link',
  adminAction: 'Signed-in administrator link',
  logoutLabel: 'Log out button label',
  hero: 'Main slider',
  containImage: 'Show full image (recommended for logos)',
  audiences: 'Audience / event cards',
  services: 'Services section',
  calendar: 'Featured event section',
  process: 'Event planning steps',
  training: 'Training section',
  team: 'Team members & achievements',
  cards: 'Cards',
  members: 'Team members',
  slides: 'Slides',
  groups: 'Sport service groups',
  items: 'Services',
  steps: 'Steps',
  achievements: 'Achievements',
  sports: 'Sport filter tags',
  published: 'Published on website',
  enabled: 'Show this section',
  href: 'Button / link destination',
  image: 'Image',
  alt: 'Image description (alt text)',
  imageAlt: 'Image description (alt text)',
  primaryAction: 'Primary button',
  secondaryAction: 'Secondary button',
  eventValue: 'How this expertise helps your event',
  certification: 'Credential / professional highlight',
  body: 'Introduction',
  preferredSport: 'Preferred sport for featured event',
  paragraphs: 'Training paragraphs',
  action: 'Button',
  registerLabel: 'Registration button label',
  emptyUpcoming: 'No upcoming events message',
  emptyPast: 'No past events message',
  achievementButton: 'Achievements button label',
  achievementEyebrow: 'Achievements modal heading',
  interest: 'Enquiry topic',
  title: 'Title',
  name: 'Full name',
  icon: 'Icon',
  role: 'Role',
  category: 'Team category',
  experience: 'Experience label',
  domain: 'Speciality',
  bio: 'Biography',
  eventAction: 'Featured event button',
  emptyAction: 'Empty calendar button',
  badge: 'Badge text',
  highlights: 'Hero highlights',
  benefits: 'Coaching benefits',
  secondary: 'Secondary coaching note',
  platform: 'Training platform card',
  trainerTitle: 'Training headline',
  label: 'Label',
  sport: 'Sport',
  description: 'Description',
  caption: 'Image caption',
  captionLabel: 'Slider caption heading',
  actionLabel: 'Card link label',
  eyebrow: 'Eyebrow / small heading',
  emptyTitle: 'Empty calendar title',
  emptyDescription: 'Empty calendar description',
  upcomingLabel: 'Upcoming filter label',
  pastLabel: 'Past events filter label',
  membersLabel: 'Members-only label',
};
export const labelFor = (key) =>
  labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
export function newEntry(template) {
  if (Array.isArray(template)) return [];
  if (template && typeof template === 'object')
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [
        key,
        key === 'id'
          ? crypto.randomUUID()
          : key === 'published'
            ? false
            : key === 'enabled'
              ? true
              : newEntry(value),
      ]),
    );
  if (typeof template === 'boolean') return template;
  return '';
}
export function Fields({ value, template, onChange, onItemAdded, path = 'config' }) {
  return Object.entries(template)
    .filter(([key]) => key !== 'id')
    .map(([key, sample]) => {
      const current = value[key] ?? sample;
      const label =
        path === 'config.navigation' && key === 'items'
          ? 'Menu items'
          : path === 'config.brand' && key === 'name'
            ? 'Brand name'
            : labelFor(key);
      const fieldPath = path + '.' + key;
      const update = (next) => onChange({ ...value, [key]: next });
      if (Array.isArray(sample)) {
        const itemTemplate = sample[0] ?? '';
        const move = (index, offset) => {
          const next = [...current];
          [next[index], next[index + offset]] = [next[index + offset], next[index]];
          update(next);
        };
        return (
          <fieldset className="content-collection" data-collection={fieldPath} key={key}>
            <legend>{label}</legend>
            <button
              type="button"
              className="button outline small"
              onClick={() => {
                const entry = newEntry(itemTemplate);
                update([...current, entry]);
                onItemAdded?.(entry.id);
              }}
            >
              Add {label.toLowerCase()}
            </button>
            {current.length === 0 && (
              <p className="muted">No items yet. Use the Add button to create one.</p>
            )}
            {current.map((item, index) => (
              <div
                className="content-entry"
                data-content-id={item.id}
                key={typeof item === 'object' ? item.id || index : index}
              >
                <div className="content-entry-heading">
                  <strong>
                    {index + 1}.{' '}
                    {typeof item === 'object'
                      ? item.name || item.title || item.label || item.sport || 'New item'
                      : label}
                  </strong>
                  <div className="content-entry-actions">
                    <button
                      type="button"
                      className="text-button"
                      disabled={index === 0}
                      aria-label={`Move ${label} ${index + 1} up`}
                      onClick={() => move(index, -1)}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      disabled={index === current.length - 1}
                      aria-label={`Move ${label} ${index + 1} down`}
                      onClick={() => move(index, 1)}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="text-button danger"
                      aria-label={`Remove ${label} ${index + 1}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove this item from ${label.toLowerCase()}? Save changes to apply.`,
                          )
                        )
                          update(current.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {typeof itemTemplate === 'object' ? (
                  <details>
                    <summary>
                      Edit {item.name || item.title || item.label || item.sport || 'item'}{' '}
                      {item.published === false ? '(hidden)' : ''}
                    </summary>
                    <Fields
                      value={item}
                      template={itemTemplate}
                      onItemAdded={onItemAdded}
                      path={`${fieldPath}.${index}`}
                      onChange={(next) =>
                        update(current.map((entry, i) => (i === index ? next : entry)))
                      }
                    />
                  </details>
                ) : (
                  <label className="field">
                    <span>
                      {label} {index + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) =>
                        update(current.map((entry, i) => (i === index ? e.target.value : entry)))
                      }
                    />
                  </label>
                )}
              </div>
            ))}
            <button
              type="button"
              className="button outline small"
              onClick={() => {
                const entry = newEntry(itemTemplate);
                update([...current, entry]);
                onItemAdded?.(entry.id);
              }}
            >
              Add {label.toLowerCase()}
            </button>
          </fieldset>
        );
      }
      if (sample && typeof sample === 'object')
        return (
          <fieldset key={key}>
            <legend>{label}</legend>
            <Fields
              value={current}
              template={sample}
              path={fieldPath}
              onChange={update}
              onItemAdded={onItemAdded}
            />
          </fieldset>
        );
      if (typeof sample === 'boolean')
        return (
          <label className="field check" key={key}>
            <input type="checkbox" checked={current} onChange={(e) => update(e.target.checked)} />
            <span>{label}</span>
          </label>
        );
      if (key === 'image')
        return (
          <ImageUpload
            key={key}
            value={current}
            onChange={update}
            label={path === 'config.brand' ? 'Logo' : 'Image'}
          />
        );
      const long =
        /description|paragraph|bio|domain|eventValue|empty|caption/i.test(key) ||
        String(sample).length > 130;
      return (
        <label className="field" key={key}>
          <span>{label}</span>
          {key === 'icon' ? (
            <select value={current} onChange={(e) => update(e.target.value)}>
              <option value="">Default</option>
              {[
                'home',
                'calendar',
                'graduation',
                'phone',
                'users',
                'image',
                'user',
                'school',
                'building',
                'trophy',
                'award',
                'flame',
              ].map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
          ) : long ? (
            <textarea
              rows={3}
              value={current}
              maxLength={5000}
              onChange={(e) => update(e.target.value)}
            />
          ) : (
            <input
              value={current}
              required={key === 'name'}
              maxLength={key === 'href' || key === 'image' ? 2000 : 5000}
              onChange={(e) => update(e.target.value)}
            />
          )}
        </label>
      );
    });
}

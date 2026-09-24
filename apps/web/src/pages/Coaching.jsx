import { useSearchParams, Link } from 'react-router-dom';
import { Heading, State, Empty } from '../components/ui';
import { usePageContent } from '../lib/content';
import { visibleItems } from '../../../../shared/siteContent';
import { Award, Flame, ArrowUpRight } from 'lucide-react';

export function DisciplineShowcase({ showcase, primary }) {
  const SectionIcon = showcase.icon === 'flame' ? Flame : Award;
  return (
    <section className="discipline-showcase compact-showcase">
      {showcase.image && (
        <img
          className="compact-showcase-image"
          src={showcase.image}
          alt={showcase.imageAlt}
          loading="lazy"
        />
      )}
      <div className="compact-showcase-content">
        <span className="eyebrow">
          <SectionIcon size={14} />
          {showcase.eyebrow}
        </span>
        <h2>{showcase.title}</h2>
        <p>{showcase.description}</p>
        <ul className="benefit-list">
          {showcase.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
        {showcase.action.label && (
          <Link
            className={'button small ' + (primary ? 'gold' : 'outline')}
            to={showcase.action.href}
          >
            {showcase.action.label}
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </section>
  );
}
export default function Coaching() {
  const [params, setParams] = useSearchParams();
  const { data, error, page, content } = usePageContent('coaching');
  const cards = visibleItems(content?.cards);
  const sports = [...new Set(cards.map((card) => card.sport))];
  const sport = sports.includes(params.get('sport')) ? params.get('sport') : 'All';
  if (!page)
    return (
      <section className="section">
        <State data={data} error={error}>
          <Empty>This page is not currently published.</Empty>
        </State>
      </section>
    );
  return (
    <section className="section">
      <Heading eyebrow={content.eyebrow} title={page.title}>
        {page.body}
      </Heading>
      <div className="filters" aria-label="Filter by sport">
        {['All', ...sports].map((item) => (
          <button
            key={item}
            aria-pressed={sport === item}
            className={sport === item ? 'selected' : ''}
            onClick={() => setParams(item === 'All' ? {} : { sport: item })}
          >
            {item === 'All' ? 'All Coaching' : item}
          </button>
        ))}
      </div>
      <div className="discipline-showcase-grid">
        {cards
          .filter((card) => sport === 'All' || card.sport === sport)
          .map((card, index) => (
            <DisciplineShowcase key={card.id} showcase={card} primary={index === 0} />
          ))}
      </div>
    </section>
  );
}

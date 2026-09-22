import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Heading, useData, State, Empty, Notice, Field } from '../components/ui';
import { api } from '../lib/api';
export function ContentPage({ slug: fixed }) {
  const params = useParams();
  const slug = fixed || params.slug;
  const { data, error } = useData('/catalog/pages');
  const page = data?.find((p) => p.slug === slug);
  return (
    <section className="section">
      <State data={data} error={error}>
        {page ? (
          <>
            <Heading eyebrow="GVK SPORTSS" title={page.title} />
            <p className="prose">{page.body}</p>
            {slug === 'about' && (
              <>
                <h2>The people behind GVK</h2>
                <div className="grid three">
                  {[
                    ['Vamshi Krishna', 'Founder & Director'],
                    ['Sunil', 'Creative & Media Director'],
                    ['Anup', 'Chess Director'],
                    ['Ashok', 'Digital & Web Director'],
                    ['Mohan', 'Badminton Operations Lead'],
                  ].map(([n, r]) => (
                    <article className="card" key={n}>
                      <h3>{n}</h3>
                      <p>{r}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Empty>This page is not currently published.</Empty>
        )}
      </State>
    </section>
  );
}
export function Gallery() {
  const { data, error } = useData('/catalog/gallery');
  return (
    <section className="section">
      <Heading eyebrow="IN THE FRAME" title="Moments that bring us together." />
      <State data={data} error={error}>
        <div className="gallery">
          {data?.map((i) => (
            <figure key={i.id}>
              <a href={i.url} target="_blank" rel="noreferrer">
                <img src={i.url} alt={i.title} loading="lazy" />
              </a>
              <figcaption>
                <h3>{i.title}</h3>
                <p>{i.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        {!data?.length && <Empty>Photos and highlights will appear here soon.</Empty>}
      </State>
    </section>
  );
}
export function Contact() {
  const [params] = useSearchParams(),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="section">
      <Heading eyebrow="LET’S CONNECT" title="Your next sports experience starts here.">
        Ask about coaching, or bring an event to your school, community or workplace.
      </Heading>
      <div className="contact-grid">
        <div>
          <h2>Tell us what you have in mind.</h2>
          <p>
            Share your preferred sport, location, dates and group size. Our team will review your
            enquiry.
          </p>
          <div className="callout">
            Schools · Communities · Corporates
            <br />
            Chess + Badminton
          </div>
        </div>
        <form
          className="card form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await api('/enquiries', {
                method: 'POST',
                body: Object.fromEntries(new FormData(form)),
              });
              setMessage('Thank you. Your enquiry has been received.');
              form.reset();
            } catch (e) {
              setMessage(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Your name" name="name" required maxLength={120} />
          <Field label="Email" name="email" type="email" required />
          <Field label="Organization (optional)" name="organization" maxLength={200} />
          <label className="field">
            How can we help?
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={3000}
              defaultValue={
                params.get('interest')
                  ? `I’m interested in ${params.get('interest')} sports programs.`
                  : ''
              }
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? 'Sending…' : 'Send enquiry'}
          </button>
          <Notice message={message} />
        </form>
      </div>
    </section>
  );
}

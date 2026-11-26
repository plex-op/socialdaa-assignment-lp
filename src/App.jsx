import { useCallback, useState } from 'react'
import './App.css'
import Assessment from './assessment/Assessment'

const testimonials = [
  {
    name: 'Dr. Arjun Prakash',
    role: 'Consultant Physician',
    quote:
      'Socialdaa helped me go from being an offline expert to a recognized voice in my industry.',
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=85',
    alt: 'Doctor in a consultation room',
  },
  {
    name: 'Priya Nair',
    role: 'Business Owner',
    quote:
      'The strategy, content and consistency made my expertise visible to the right people.',
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85',
    alt: 'Business owner speaking with her team',
  },
  {
    name: 'Karthik Raman',
    role: 'Real Estate Professional',
    quote:
      'A structured, end-to-end personal branding process that actually delivers results.',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85',
    alt: 'Real estate professional in a studio',
  },
]

const scoreAreas = [
  ['Visibility', 88],
  ['Authority', 76],
  ['Content strategy', 65],
  ['Positioning', 54],
  ['Growth potential', 72],
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 10h12m-5-5 5 5-5 5" />
    </svg>
  )
}

function PlayMark() {
  return (
    <span className="play-mark" aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="m8 5.5 7 4.5-7 4.5v-9Z" fill="currentColor" />
      </svg>
    </span>
  )
}

function App() {
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const openAssessment = useCallback((event) => {
    event.preventDefault()
    setAssessmentOpen(true)
  }, [])
  const closeAssessment = useCallback(() => setAssessmentOpen(false), [])

  return (
    <main>
      <section className="hero-section" id="top" aria-labelledby="hero-title">
        <div className="hero-ribbon">
          FREE 3-MINUTE PERSONAL BRAND ASSESSMENT
        </div>
        <header className="site-header page-wrap">
          <a className="wordmark" href="#top" aria-label="Socialdaa home">
            socialdaa<span>.</span>
          </a>
        </header>

        <div className="hero-content page-wrap">
          <h1 id="hero-title">
            You Have the Expertise.
            <br />
            <span>But Does Your Industry Know You?</span>
          </h1>
          <p className="hero-description">
            See where your brand stands, what’s limiting your visibility and
            how to grow your authority.
          </p>
          <a className="button button-yellow hero-cta" href="#assessment" onClick={openAssessment}>
            Get My Free Growth Score <ArrowIcon />
          </a>
          <p className="microcopy">
            Free assessment <span className="micro-divider" /> About 3 minutes
          </p>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=90"
                alt="Founder sharing his perspective in a relaxed interview"
              />
              <PlayMark />
            </div>
          </div>

          <div className="audience-block">
            <ul className="audience-list">
              {['Founders', 'Business Owners', 'Doctors', 'Consultants', 'Coaches', 'Real Estate Professionals'].map(
                (audience) => <li key={audience}>{audience}</li>,
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="testimonials-section" aria-labelledby="testimonials-title">
        <div className="section-intro page-wrap">
          <h2 id="testimonials-title">Don’t Just Take Our Word for It</h2>
          <p>Real stories of stronger, more visible personal brands.</p>
        </div>

        <div className="testimonial-grid page-wrap">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <div className="testimonial-image">
                <img src={testimonial.image} alt={testimonial.alt} loading="lazy" />
                <PlayMark />
              </div>
              <div className="testimonial-content">
                <span className="quote-mark" aria-hidden="true">“</span>
                <blockquote>{testimonial.quote}</blockquote>
                <div className="client">
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="testimonial-action page-wrap">
          <a className="button button-yellow" href="#assessment" onClick={openAssessment}>
            Find Out Where Your Personal Brand Stands <ArrowIcon />
          </a>
        </div>
      </section>

      <section
        className="assessment-section"
        id="assessment"
        aria-labelledby="assessment-title"
      >
        <div className="assessment-grid page-wrap">
          <div className="dashboard-wrap" aria-label="Example growth score dashboard">
            <div className="dashboard">
              <div className="dashboard-header">
                <div>
                  <p className="dashboard-label">Your Personal Brand Growth Score</p>
                <p className="dashboard-caption">Example result</p>
                </div>
              </div>
              <div className="dashboard-main">
                <div className="score-gauge">
                  <svg viewBox="0 0 180 100" role="img" aria-label="Example score 78 out of 100">
                    <path className="gauge-track" d="M18 88a72 72 0 0 1 144 0" />
                    <path className="gauge-progress" d="M18 88a72 72 0 0 1 117-55" />
                  </svg>
                  <div className="score-number">78<span>/100</span></div>
                  <span className="score-caption">Strong foundation</span>
                </div>
                <div className="score-list">
                  {scoreAreas.map(([area, score]) => (
                    <div className="score-row" key={area}>
                      <span>{area}</span>
                      <span className="score-bar"><i style={{ width: `${score}%` }} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="assessment-copy">
            <h2 id="assessment-title">Discover Your Personal Brand Growth Score</h2>
            <p className="assessment-description">
              Get your score, see what’s holding you back and find your next
              step to stronger authority.
            </p>
            <a className="button button-yellow assessment-cta" href="#assessment" onClick={openAssessment}>
              Get My Free Growth Score <ArrowIcon />
            </a>
            <p className="microcopy">Free <span className="micro-divider" /> About 3 minutes</p>
          </div>
        </div>
      </section>

      <a className="mobile-sticky-cta" href="#assessment" onClick={openAssessment}>
        Get My Free Growth Score <ArrowIcon />
      </a>
      {assessmentOpen && <Assessment onClose={closeAssessment} />}
    </main>
  )
}

export default App

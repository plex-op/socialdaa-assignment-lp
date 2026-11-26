import { useEffect, useRef, useState } from 'react'
import { ASSESSMENT_DRAFT_KEY, STRATEGY_SESSION_URL } from './config'
import { QUESTIONS } from './questions'
import { calculateAssessmentResults } from './scoring'
import './Assessment.css'

const EMPTY_LEAD = {
  fullName: '',
  businessName: '',
  phone: '',
  email: '',
}

function readDraft() {
  try {
    const saved = sessionStorage.getItem(ASSESSMENT_DRAFT_KEY)
    if (!saved) return { answers: {}, step: 0 }

    const draft = JSON.parse(saved)
    const step = Number.isInteger(draft.step) && draft.step >= 0
      ? Math.min(draft.step, QUESTIONS.length)
      : 0

    return {
      answers: draft.answers && typeof draft.answers === 'object' ? draft.answers : {},
      step,
    }
  } catch (error) {
    console.error('Unable to restore the saved assessment draft.', error)
    return { answers: {}, step: 0 }
  }
}

function countSentences(value) {
  return value
    .replace(/\b(e\.g|i\.e|Dr|Mr|Mrs|Ms)\./gi, '$1')
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0).length
}

function getQuestionError(question, value = '') {
  if (!value.trim()) return 'Please answer this question to continue.'
  if (question.minLength && value.trim().length < question.minLength) {
    return `Please add a little more detail (at least ${question.minLength} characters).`
  }
  if (question.maxSentences) {
    const sentences = countSentences(value)
    if (sentences > question.maxSentences) return 'Please keep this answer to 4 sentences or fewer.'
  }
  return ''
}

function getLeadError(lead) {
  if (lead.fullName.trim().length < 2) return 'Enter your full name.'
  if (lead.businessName.trim().length < 2) return 'Enter your business or brand name.'
  const phoneDigits = lead.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return 'Enter a phone number with 10 to 15 digits.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) {
    return 'Enter a valid email address.'
  }
  return ''
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 10h12m-5-5 5 5-5 5" />
    </svg>
  )
}

function AssessmentProgress({ step }) {
  const percentage = Math.min((step / QUESTIONS.length) * 100, 100)

  return (
    <div className="assessment-progress">
      <div className="assessment-progress-label">
        <span>{step < QUESTIONS.length ? `Question ${step + 1} of ${QUESTIONS.length}` : 'Your details'}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div
        className="assessment-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Assessment progress"
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function QuestionStep({ question, value, onChange, error }) {
  return (
    <>
      <h2 id="assessment-question-title">{question.prompt}</h2>
      {question.type === 'choice' ? (
        <div className="assessment-options" role="radiogroup" aria-labelledby="assessment-question-title">
          {question.options.map((option, index) => (
            <label className={`assessment-option${value === option ? ' is-selected' : ''}`} key={option}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span className="assessment-option-marker" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <label className="assessment-field">
          <span>Your response</span>
          <textarea
            autoFocus
            rows="5"
            value={value || ''}
            maxLength={question.maxLength}
            placeholder={question.placeholder}
            aria-describedby={error ? 'question-error' : 'question-helper'}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="assessment-field-meta">
            <span id="question-helper">{question.helper}</span>
            <span>{(value || '').length}/{question.maxLength}</span>
          </span>
        </label>
      )}
      {error && <p className="assessment-error" id="question-error" role="alert">{error}</p>}
    </>
  )
}

function LeadCapture({ lead, onChange, error }) {
  return (
    <>
      <h2 id="assessment-question-title">Your score is ready to reveal.</h2>
      <p className="assessment-step-intro">
        Add your details to reveal your score and blueprint.
      </p>
      <div className="lead-fields">
        <label className="assessment-field">
          <span>Full Name</span>
          <input
            autoFocus
            autoComplete="name"
            value={lead.fullName}
            onChange={(event) => onChange('fullName', event.target.value)}
            required
          />
        </label>
        <label className="assessment-field">
          <span>Business / Brand Name</span>
          <input
            autoComplete="organization"
            value={lead.businessName}
            onChange={(event) => onChange('businessName', event.target.value)}
            required
          />
        </label>
        <label className="assessment-field">
          <span>Phone Number</span>
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={lead.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            required
          />
        </label>
        <label className="assessment-field">
          <span>Email Address</span>
          <input
            type="email"
            autoComplete="email"
            value={lead.email}
            onChange={(event) => onChange('email', event.target.value)}
            required
          />
        </label>
      </div>
      <p className="lead-privacy-note">Used to personalize your score and report.</p>
      {error && <p className="assessment-error" role="alert">{error}</p>}
    </>
  )
}

function ResultView({ lead, answers, result, onClose }) {
  const [pdfError, setPdfError] = useState('')

  async function handleDownload() {
    setPdfError('')
    try {
      const { downloadPersonalBrandBlueprint } = await import('./createBlueprint')
      downloadPersonalBrandBlueprint({ lead, answers, result })
    } catch (error) {
      console.error('Unable to generate the personalized growth blueprint.', error)
      setPdfError('We could not create the PDF. Please try again.')
    }
  }

  return (
    <div className="assessment-result">
      <h2 className="assessment-kicker" id="assessment-result-title">
        Your Personal Brand Growth Score is Ready
      </h2>
      <div className="result-score-layout">
        <div className="result-score-ring" style={{ '--score-angle': `${result.score * 3.6}deg` }}>
          <div className="result-score-center">
            <strong>{result.score}</strong>
            <span>/100</span>
          </div>
        </div>
        <div className="result-score-copy">
          <span className="result-level-label">Your brand maturity level</span>
          <h2>{result.maturity}</h2>
          <p>{result.summary}</p>
        </div>
      </div>

      <div className="result-dimensions">
        {result.dimensions.map((dimension) => (
          <div className="result-dimension" key={dimension.key}>
            <div>
              <span>{dimension.label}</span>
              <strong>{dimension.score}</strong>
            </div>
            <span className="result-dimension-track">
              <i style={{ width: `${dimension.score}%` }} />
            </span>
          </div>
        ))}
      </div>

      <div className="result-insights">
        <section>
          <h3>Your strengths</h3>
          <ul>{result.strengths.map((item) => <li key={item.key}>{item.label}</li>)}</ul>
        </section>
        <section>
          <h3>Areas to improve</h3>
          <ul>{result.improvements.map((item) => <li key={item.key}>{item.label}</li>)}</ul>
        </section>
      </div>

      <section className="result-recommendations">
        <h3>Your personalized next steps</h3>
        <ol>{result.recommendations.slice(0, 3).map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ol>
      </section>

      <div className="result-download">
        <div>
          <strong>Your 5-page growth blueprint</strong>
          <span>Score, recommendations and 30-day plan.</span>
        </div>
        <button className="assessment-primary-button" type="button" onClick={handleDownload}>
          Download My Personal Brand Growth Blueprint <ArrowIcon />
        </button>
      </div>
      {pdfError && <p className="assessment-error" role="alert">{pdfError}</p>}

      <div className="result-closing">
        <p>Your expertise deserves to be recognised. Let’s build a personal brand that reflects your value.</p>
        <a
          className="assessment-secondary-button"
          href={STRATEGY_SESSION_URL}
          target="_blank"
          rel="noreferrer"
        >
          Book a Strategy Session with Socialdaa <ArrowIcon />
        </a>
        <span className="booking-placeholder-note">
          Booking link not configured yet.
        </span>
      </div>
      <button className="assessment-close-result" type="button" onClick={onClose}>Close assessment</button>
    </div>
  )
}

export default function Assessment({ onClose }) {
  const [draft] = useState(readDraft)
  const [answers, setAnswers] = useState(draft.answers)
  const [step, setStep] = useState(draft.step)
  const [lead, setLead] = useState(EMPTY_LEAD)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const dialogRef = useRef(null)
  const question = QUESTIONS[step]
  const isLeadStep = step === QUESTIONS.length

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled)',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (result) return

    try {
      sessionStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify({ answers, step }))
    } catch (storageError) {
      console.error('Unable to save the temporary assessment draft.', storageError)
    }
  }, [answers, step, result])

  function updateAnswer(value) {
    setAnswers((current) => ({ ...current, [question.id]: value }))
    setError('')
  }

  function handleNext(event) {
    event.preventDefault()
    const validationError = getQuestionError(question, answers[question.id] || '')
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setStep((current) => current + 1)
  }

  function handleLeadSubmit(event) {
    event.preventDefault()
    const validationError = getLeadError(lead)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      sessionStorage.removeItem(ASSESSMENT_DRAFT_KEY)
    } catch (storageError) {
      console.error('Unable to clear the temporary assessment draft.', storageError)
    }
    setResult(calculateAssessmentResults(answers))
  }

  function updateLead(field, value) {
    setLead((current) => ({ ...current, [field]: value }))
    setError('')
  }

  return (
    <div className="assessment-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        className="assessment-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={result ? 'assessment-result-title' : 'assessment-question-title'}
        tabIndex="-1"
      >
        <div className="assessment-dialog-top">
          <span className="assessment-brand">socialdaa<span>.</span></span>
          <button className="assessment-close" type="button" onClick={onClose} aria-label="Close assessment">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {!result && <AssessmentProgress step={step} />}

        {result ? (
            <ResultView lead={lead} answers={answers} result={result} onClose={onClose} />
        ) : (
          <form className="assessment-form" onSubmit={isLeadStep ? handleLeadSubmit : handleNext}>
            {isLeadStep ? (
              <LeadCapture lead={lead} onChange={updateLead} error={error} />
            ) : (
              <>
                <QuestionStep
                  question={question}
                  value={answers[question.id]}
                  onChange={updateAnswer}
                  error={error}
                />
                <div className="assessment-navigation">
                  <button
                    className="assessment-back-button"
                    type="button"
                    onClick={() => {
                      setError('')
                      setStep((current) => Math.max(0, current - 1))
                    }}
                    disabled={step === 0}
                  >
                    Back
                  </button>
                  <button className="assessment-primary-button" type="submit">
                    {step === QUESTIONS.length - 1 ? 'Continue to my score' : 'Next'} <ArrowIcon />
                  </button>
                </div>
              </>
            )}
            {isLeadStep && (
              <div className="assessment-navigation">
                <button
                  className="assessment-back-button"
                  type="button"
                  onClick={() => {
                    setError('')
                    setStep(QUESTIONS.length - 1)
                  }}
                >
                  Back
                </button>
                <button className="assessment-primary-button" type="submit">
                  Reveal My Growth Score <ArrowIcon />
                </button>
              </div>
            )}
          </form>
        )}
        {!result && (
          <p className="assessment-dialog-note">
            Your answers are saved temporarily in this browser session.
          </p>
        )}
      </div>
    </div>
  )
}

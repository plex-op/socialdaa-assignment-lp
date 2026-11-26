const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const containsAny = (text, words) =>
  words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)

const sentenceCount = (value = '') =>
  value
    .replace(/\b(e\.g|i\.e|Dr|Mr|Mrs|Ms)\./gi, '$1')
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0).length

const shortenText = (value, limit = 72) => {
  const firstSentence = String(value || '').trim().split(/[.!?]/)[0].trim()
  if (firstSentence.length <= limit) return firstSentence
  const clipped = firstSentence.slice(0, limit - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, lastSpace > limit * 0.6 ? lastSpace : limit - 1).trim()}…`
}

const scorePositioning = (value = '') => {
  const text = value.toLowerCase()
  const lengthScore = Math.min(value.trim().length / 180, 1) * 30
  const specificity = containsAny(text, [
    'help',
    'known',
    'expert',
    'solve',
    'industry',
    'client',
    'result',
    'through',
    'special',
  ]) * 5
  const hasAudienceOrOutcome = /\b(for|with|so that|who|because|by)\b/.test(text) ? 10 : 0
  const sentences = sentenceCount(value)
  const structure = sentences >= 2 && sentences <= 4 ? 15 : sentences > 0 ? 7 : 0

  return Math.round(clamp(25 + lengthScore + specificity + hasAudienceOrOutcome + structure))
}

const scoreAudience = (value = '') => {
  const text = value.toLowerCase()
  const lengthScore = Math.min(value.trim().length / 180, 1) * 25
  const audienceSignals = containsAny(text, [
    'founder',
    'professional',
    'owner',
    'client',
    'patient',
    'people',
    'business',
    'audience',
    'team',
  ]) * 5
  const problemSignals = containsAny(text, [
    'help',
    'solve',
    'challenge',
    'struggle',
    'result',
    'problem',
    'support',
    'grow',
    'need',
  ]) * 5

  return Math.round(clamp(20 + lengthScore + audienceSignals + problemSignals))
}

const scoreMaps = {
  visibility: [8, 28, 48, 69, 90],
  differentiation: [76, 84, 82, 72, 22],
  goal: [70, 80, 84, 70, 79, 83],
  investment: [90, 62, 76, 45],
}

const dimensionWeights = {
  positioning: 0.23,
  audience: 0.22,
  visibility: 0.2,
  differentiation: 0.18,
  strategy: 0.17,
}

const getSelectedScore = (value, options, scores) => {
  const index = options.indexOf(value)
  return index < 0 ? 0 : scores[index]
}

export function getMaturityLevel(score) {
  if (score <= 30) return 'Invisible Expert'
  if (score <= 50) return 'Emerging Brand'
  if (score <= 75) return 'Growing Authority'
  return 'Established Authority'
}

export function getPersonalizedPlan(answers) {
  const recognition = answers.recognition?.trim() || 'your expertise'
  const audience = answers.audience?.trim() || 'your ideal audience'
  const challenge = answers.challenge?.trim() || 'your visibility challenge'
  const goal = answers.goal || 'your next growth goal'
  const difference = answers.differentiation || ''
  const recognitionFocus = shortenText(
    recognition.replace(
      /^(I want to be known for|I want to be recognised for|I want to be recognized for)\s*/i,
      '',
    ),
    72,
  )
  const audienceFocus = shortenText(audience, 58)
  const challengeFocus = shortenText(challenge, 56)
  const goalFocus = shortenText(goal.replace(/[.]/g, ''), 62).toLowerCase()
  const differenceFocus = shortenText(
    difference.replace(/^My /i, '').replace(/[.]$/, '').toLowerCase(),
    54,
  )
  const pillars = [
    `Your point of view: ${recognitionFocus}`,
    `Advice for ${audienceFocus}`,
    `Solutions to ${challengeFocus}`,
    difference.includes('defined yet')
      ? 'Lessons from your professional journey'
      : `Proof of ${differenceFocus}`,
  ]

  const formats =
    answers.visibility === "I haven't started yet."
      ? 'Short videos, practical posts and a monthly Q&A.'
      : answers.visibility === 'I occasionally post on social media.'
        ? 'Short videos, carousel explainers and client stories.'
        : answers.visibility === 'I regularly create content, but without a clear strategy.'
          ? 'Repeatable series, short videos and relevant case studies.'
          : answers.visibility === 'I have a content strategy but struggle with consistent visibility.'
            ? 'Repurpose each idea as a video, post and audience conversation.'
            : 'Point-of-view posts, case studies and live conversations.'

  const weeklyCadence =
    answers.visibility === "I haven't started yet."
      ? 'Publish 2 helpful posts weekly; join 3 industry conversations.'
      : 'Publish 3 times weekly, repurpose ideas and join 3 conversations.'

  const positioningRecommendation =
    `Position yourself around ${recognitionFocus} for a clear audience and outcome.`

  const recommendations = [
    positioningRecommendation,
    `Define who you help, their main challenge and the result they want.`,
    weeklyCadence,
    difference.includes('defined yet')
      ? 'Choose one experience that shows your distinct perspective.'
      : `Show ${differenceFocus} through a clear example or result.`,
    `Focus content on your goal: ${goalFocus}.`,
  ]

  const roadmap = [
    [
      'Brand Foundation & Positioning',
      `Write a one-line position: ${recognitionFocus}.`,
      'State who you help and the result you deliver.',
    ],
    [
      'Content Strategy',
      'Choose three pillars: expertise, audience needs and proof.',
      `Draft three posts that address ${challengeFocus}.`,
    ],
    [
      'Visibility & Distribution',
      'Publish 2–3 times weekly; repurpose each idea once.',
      'Start five relevant industry conversations.',
    ],
    [
      'Authority & Growth',
      'Share one result, practical lesson or client story.',
      `Invite your audience to ${goalFocus}.`,
    ],
  ]

  return { pillars, formats, weeklyCadence, goal, positioningRecommendation, recommendations, roadmap }
}

export function calculateAssessmentResults(answers) {
  const strategicGoal = getSelectedScore(answers.goal, [
    'Build industry authority and credibility.',
    'Attract high-quality clients.',
    'Generate more business enquiries and leads.',
    'Build a strong social media presence.',
    'Become a recognised thought leader.',
    'Grow my business through personal branding.',
  ], scoreMaps.goal)
  const investmentReadiness = getSelectedScore(answers.investment, [
    'I’m ready to invest ₹50,000+ per month to build my personal brand.',
    'I’m interested, but I need to understand the strategy first.',
    'I’m planning to invest within the next 3–6 months.',
    'I’m currently exploring different approaches.',
  ], scoreMaps.investment)

  const dimensions = [
    { key: 'positioning', label: 'Brand Positioning', score: scorePositioning(answers.recognition) },
    { key: 'audience', label: 'Audience Clarity', score: scoreAudience(answers.audience) },
    {
      key: 'visibility',
      label: 'Visibility & Content Consistency',
      score: getSelectedScore(answers.visibility, [
        "I haven't started yet.",
        'I occasionally post on social media.',
        'I regularly create content, but without a clear strategy.',
        'I have a content strategy but struggle with consistent visibility.',
        'I am actively building my brand and already have a strong presence.',
      ], scoreMaps.visibility),
    },
    {
      key: 'differentiation',
      label: 'Differentiation',
      score: getSelectedScore(answers.differentiation, [
        'My experience and expertise.',
        'My unique approach to solving problems.',
        'My results and track record.',
        'My personal story and journey.',
        "I haven't clearly defined my differentiation yet.",
      ], scoreMaps.differentiation),
    },
    {
      key: 'strategy',
      label: 'Strategic Direction',
      score: Math.round(strategicGoal * 0.7 + investmentReadiness * 0.3),
    },
  ]

  const score = Math.round(
    dimensions.reduce(
      (total, dimension) => total + dimension.score * dimensionWeights[dimension.key],
      0,
    ),
  )
  const sortedDimensions = [...dimensions].sort((a, b) => b.score - a.score)
  const strengths = sortedDimensions.slice(0, 2)
  const improvements = sortedDimensions.slice(-2).reverse()
  const plan = getPersonalizedPlan(answers)

  return {
    score,
    maturity: getMaturityLevel(score),
    dimensions,
    strengths,
    improvements,
    summary: `Strongest area: ${strengths[0].label}. Focus next on ${improvements[0].label.toLowerCase()}.`,
    ...plan,
  }
}

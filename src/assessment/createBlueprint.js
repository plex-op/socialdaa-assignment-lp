import { jsPDF } from 'jspdf'
import { STRATEGY_SESSION_URL } from './config.js'

const PAGE_WIDTH = 210
const MARGIN = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const BLACK = [0, 0, 0]
const DARK_GREY = [70, 70, 70]
const MID_GREY = [100, 100, 100]
const LIGHT_GREY = [229, 229, 229]
const PALE_GREY = [245, 245, 245]
const WHITE = [255, 255, 255]

const safeText = (value = '') =>
  String(value)
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/₹/g, 'INR ')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')

const reportExcerpt = (value = '', limit = 180) => {
  const text = String(value).trim()
  if (text.length <= limit) return text
  const clipped = text.slice(0, limit - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, lastSpace > limit * 0.6 ? lastSpace : limit - 1).trim()}...`
}

const setTextColor = (doc, color) => doc.setTextColor(...color)
const setFillColor = (doc, color) => doc.setFillColor(...color)
const setDrawColor = (doc, color) => doc.setDrawColor(...color)

function drawText(doc, value, x, y, width, options = {}) {
  const {
    size = 11,
    color = BLACK,
    bold = false,
    maxLines = 6,
    leading = 1.4,
  } = options
  const content = safeText(value)

  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  setTextColor(doc, color)
  let lines = doc.splitTextToSize(content, width)

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    const last = lines.length - 1
    lines[last] = `${lines[last].replace(/\s+\S*$/, '')}...`
  }

  doc.text(lines, x, y)
  return y + lines.length * size * 0.3528 * leading
}

function drawHeader(doc, pageNumber, pageTitle) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTextColor(doc, BLACK)
  doc.text('SOCIALDAA', MARGIN, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColor(doc, MID_GREY)
  doc.text('PERSONAL BRAND GROWTH BLUEPRINT', PAGE_WIDTH - MARGIN, 15, { align: 'right' })
  setDrawColor(doc, LIGHT_GREY)
  doc.setLineWidth(0.35)
  doc.line(MARGIN, 20, PAGE_WIDTH - MARGIN, 20)
  drawText(doc, pageTitle.toUpperCase(), MARGIN, 30, CONTENT_WIDTH, {
    size: 16,
    bold: true,
    maxLines: 1,
  })

  setDrawColor(doc, LIGHT_GREY)
  doc.line(MARGIN, 281, PAGE_WIDTH - MARGIN, 281)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColor(doc, DARK_GREY)
  doc.text(`${pageNumber} / 5`, PAGE_WIDTH - MARGIN, 288, { align: 'right' })
}

function drawPanel(doc, x, y, width, height, fill = PALE_GREY) {
  setFillColor(doc, fill)
  doc.roundedRect(x, y, width, height, 2, 2, 'F')
}

function drawScoreGauge(doc, centerX, centerY, score, radius = 19) {
  const segments = 72
  const activeSegments = Math.round((score / 100) * segments)
  doc.setLineWidth(3.2)

  for (let index = 0; index < segments; index += 1) {
    const startAngle = ((index / segments) * Math.PI * 2) - Math.PI / 2
    const endAngle = (((index + 0.72) / segments) * Math.PI * 2) - Math.PI / 2
    const startX = centerX + Math.cos(startAngle) * radius
    const startY = centerY + Math.sin(startAngle) * radius
    const endX = centerX + Math.cos(endAngle) * radius
    const endY = centerY + Math.sin(endAngle) * radius
    setDrawColor(doc, index < activeSegments ? BLACK : LIGHT_GREY)
    doc.line(startX, startY, endX, endY)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  setTextColor(doc, BLACK)
  doc.text(String(score), centerX, centerY + 2, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColor(doc, MID_GREY)
  doc.text('/ 100', centerX, centerY + 7, { align: 'center' })
}

function drawLabel(doc, label, x, y) {
  drawText(doc, label.toUpperCase(), x, y, CONTENT_WIDTH, {
    size: 10,
    bold: true,
    color: DARK_GREY,
    maxLines: 1,
  })
}

function drawProgressRow(doc, dimension, x, y, width) {
  drawText(doc, dimension.label, x, y, width - 18, { size: 9.5, maxLines: 1 })
  drawText(doc, `${dimension.score}`, x + width - 14, y, 14, {
    size: 9.5,
    bold: true,
    maxLines: 1,
  })
  const barY = y + 3
  setFillColor(doc, LIGHT_GREY)
  doc.rect(x, barY, width, 2.2, 'F')
  setFillColor(doc, BLACK)
  doc.rect(x, barY, width * dimension.score / 100, 2.2, 'F')
}

function drawCardText(doc, title, body, x, y, width, height, maxLines = 4) {
  drawPanel(doc, x, y, width, height)
  drawText(doc, title, x + 5, y + 8, width - 10, {
    size: 10,
    bold: true,
    maxLines: 1,
  })
  drawText(doc, body, x + 5, y + 15, width - 10, {
    size: 11,
    color: DARK_GREY,
    maxLines,
  })
}

function drawActionList(doc, items, x, y, width, options = {}) {
  const { maxLines = 2, fontSize = 10, gap = 4, marker = '01' } = options
  let cursor = y

  items.forEach((item, index) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setTextColor(doc, BLACK)
    doc.text(options.numbered === false ? marker : `0${index + 1}`, x, cursor)
    const nextY = drawText(doc, item, x + 10, cursor, width - 10, {
      size: fontSize,
      color: DARK_GREY,
      maxLines,
      leading: 1.35,
    })
    cursor = Math.max(cursor + 5, nextY) + gap
  })

  return cursor
}

function drawPageOne(doc, lead, answers, result, dateLabel) {
  drawHeader(doc, 1, 'Personal Brand Assessment Overview')

  setFillColor(doc, BLACK)
  doc.roundedRect(MARGIN, 38, CONTENT_WIDTH, 49, 3, 3, 'F')
  drawText(doc, 'PERSONAL BRAND GROWTH BLUEPRINT', MARGIN + 8, 51, CONTENT_WIDTH - 16, {
    size: 18,
    bold: true,
    color: WHITE,
    maxLines: 1,
  })
  drawText(doc, 'Your Personal Brand Assessment & Growth Roadmap', MARGIN + 8, 60, CONTENT_WIDTH - 16, {
    size: 11,
    color: WHITE,
    maxLines: 1,
  })
  drawText(doc, `${lead.fullName}  |  ${lead.businessName}`, MARGIN + 8, 76, CONTENT_WIDTH - 16, {
    size: 10,
    bold: true,
    color: WHITE,
    maxLines: 1,
  })
  drawText(doc, `Professional background: ${answers.background}`, MARGIN + 8, 82, CONTENT_WIDTH - 16, {
    size: 9,
    color: WHITE,
    maxLines: 1,
  })

  drawPanel(doc, MARGIN, 95, CONTENT_WIDTH, 91)
  drawScoreGauge(doc, MARGIN + 35, 136, result.score, 23)
  drawLabel(doc, 'Overall growth score', MARGIN + 70, 111)
  drawText(doc, result.maturity, MARGIN + 70, 123, CONTENT_WIDTH - 82, {
    size: 16,
    bold: true,
    maxLines: 1,
  })
  drawText(doc, `Assessment date: ${dateLabel}`, MARGIN + 70, 132, CONTENT_WIDTH - 82, {
    size: 10,
    color: MID_GREY,
    maxLines: 1,
  })
  drawText(doc, result.summary, MARGIN + 70, 143, CONTENT_WIDTH - 83, {
    size: 11,
    color: DARK_GREY,
    maxLines: 3,
  })

  drawLabel(doc, 'Your growth dimensions', MARGIN, 201)
  result.dimensions.forEach((dimension, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = MARGIN + column * 92
    const y = 213 + row * 20
    drawProgressRow(doc, dimension, x, y, 86)
  })
}

function drawPageTwo(doc, answers, result) {
  drawHeader(doc, 2, 'Your Brand Foundation')

  drawCardText(doc, 'What you want to be recognised for', reportExcerpt(answers.recognition, 180), MARGIN, 44, CONTENT_WIDTH, 43, 2)

  drawCardText(doc, 'Your audience and the problems you solve', reportExcerpt(answers.audience, 220), MARGIN, 96, CONTENT_WIDTH, 54, 3)

  drawPanel(doc, MARGIN, 160, CONTENT_WIDTH, 67, PALE_GREY)
  drawLabel(doc, 'Brand positioning assessment', MARGIN + 6, 171)
  const positioning = result.dimensions.find(({ key }) => key === 'positioning')
  drawText(doc, `Positioning clarity: ${positioning.score}/100`, MARGIN + 6, 183, CONTENT_WIDTH - 12, {
    size: 13,
    bold: true,
    maxLines: 1,
  })
  drawText(doc, result.positioningRecommendation, MARGIN + 6, 196, CONTENT_WIDTH - 12, {
    size: 11,
    color: DARK_GREY,
    maxLines: 3,
  })

  drawPanel(doc, MARGIN, 237, CONTENT_WIDTH, 38, WHITE)
  setDrawColor(doc, LIGHT_GREY)
  doc.roundedRect(MARGIN, 237, CONTENT_WIDTH, 38, 2, 2, 'S')
  drawLabel(doc, 'Your differentiator', MARGIN + 6, 248)
  drawText(doc, answers.differentiation, MARGIN + 6, 261, CONTENT_WIDTH - 12, {
    size: 11,
    bold: true,
    maxLines: 2,
  })
}

function drawPageThree(doc, answers, result) {
  drawHeader(doc, 3, 'Your Visibility & Content Strategy')

  drawCardText(doc, 'Current visibility', answers.visibility, MARGIN, 44, CONTENT_WIDTH, 35, 1)

  drawCardText(doc, 'Your biggest visibility challenge', reportExcerpt(answers.challenge, 180), MARGIN, 88, CONTENT_WIDTH, 47, 2)

  drawLabel(doc, 'Four content pillars', MARGIN, 150)
  drawActionList(doc, result.pillars, MARGIN, 163, CONTENT_WIDTH, {
    maxLines: 1,
    fontSize: 10.5,
    gap: 2,
  })

  drawLabel(doc, 'Suggested formats', MARGIN, 206)
  drawText(doc, result.formats, MARGIN, 218, CONTENT_WIDTH, {
    size: 11,
    color: DARK_GREY,
    maxLines: 2,
  })
  drawLabel(doc, 'Weekly consistency', MARGIN, 245)
  drawText(doc, result.weeklyCadence, MARGIN, 257, CONTENT_WIDTH, {
    size: 11,
    color: DARK_GREY,
    maxLines: 2,
  })
}

function drawPageFour(doc, result) {
  drawHeader(doc, 4, 'Your 30-Day Growth Roadmap')

  drawText(doc, 'Four weeks. Clear actions. Stronger visibility and authority.', MARGIN, 43, CONTENT_WIDTH, {
    size: 11,
    color: DARK_GREY,
    maxLines: 1,
  })

  result.roadmap.forEach(([title, ...actions], index) => {
    const y = 54 + index * 55
    drawPanel(doc, MARGIN, y, CONTENT_WIDTH, 49, index % 2 === 0 ? PALE_GREY : WHITE)
    if (index % 2 === 1) {
      setDrawColor(doc, LIGHT_GREY)
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 49, 2, 2, 'S')
    }
    drawText(doc, `WEEK 0${index + 1}  |  ${title}`, MARGIN + 6, y + 9, CONTENT_WIDTH - 12, {
      size: 11,
      bold: true,
      maxLines: 1,
    })
    drawActionList(doc, actions, MARGIN + 6, y + 19, CONTENT_WIDTH - 12, {
      maxLines: 1,
      fontSize: 9.5,
      gap: 2,
    })
  })
}

function drawPageFive(doc, result) {
  drawHeader(doc, 5, 'Your Next Steps')

  drawLabel(doc, 'Top growth opportunities', MARGIN, 46)
  const priorities = [...result.dimensions]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((dimension) => `${dimension.label} (${dimension.score}/100)`)
  drawActionList(doc, priorities, MARGIN, 59, CONTENT_WIDTH, {
    maxLines: 1,
    fontSize: 10.5,
    gap: 5,
  })

  drawLabel(doc, 'Priority actions', MARGIN, 101)
  drawActionList(doc, result.recommendations.slice(0, 3), MARGIN, 114, CONTENT_WIDTH, {
    maxLines: 1,
    fontSize: 10.5,
    gap: 6,
  })

  drawPanel(doc, MARGIN, 170, CONTENT_WIDTH, 76)
  drawText(doc, "Let's build your personal brand.", MARGIN + 7, 185, CONTENT_WIDTH - 14, {
    size: 15,
    bold: true,
    maxLines: 1,
  })
  drawText(doc, 'Your expertise deserves to be recognised.', MARGIN + 7, 197, CONTENT_WIDTH - 14, {
    size: 12,
    color: DARK_GREY,
    maxLines: 1,
  })
  const buttonText = 'Book a strategy session with Socialdaa'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTextColor(doc, BLACK)
  doc.textWithLink(buttonText, MARGIN + 7, 222, { url: STRATEGY_SESSION_URL })
  setDrawColor(doc, BLACK)
  doc.line(MARGIN + 7, 224, MARGIN + 80, 224)

  drawText(doc, 'Website: [Socialdaa website URL]  |  Booking: [strategy session URL]', MARGIN, 263, CONTENT_WIDTH, {
    size: 10,
    color: MID_GREY,
    maxLines: 1,
  })
}

export function createPersonalBrandBlueprint({ lead, answers, result }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const dateLabel = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  drawPageOne(doc, lead, answers, result, dateLabel)
  doc.addPage()
  drawPageTwo(doc, answers, result)
  doc.addPage()
  drawPageThree(doc, answers, result)
  doc.addPage()
  drawPageFour(doc, result)
  doc.addPage()
  drawPageFive(doc, result)

  return doc
}

export function downloadPersonalBrandBlueprint({ lead, answers, result }) {
  const doc = createPersonalBrandBlueprint({ lead, answers, result })
  const safeName = safeText(lead.fullName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'personal'
  doc.save(`socialdaa-growth-blueprint-${safeName}.pdf`)
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ServiceMatch {
  template?: any
  confidence: number
  created: boolean
  isExactMatch: boolean
}

export interface ServiceData {
  description: string
  amount?: number
  service?: string
}

/**
 * Find matching service template or create new one based on voice input
 */
export async function findOrCreateService(
  userId: string, 
  serviceData: ServiceData
): Promise<ServiceMatch> {
  const { description, amount, service } = serviceData
  
  // Primary search term - prefer specific service name if provided
  const searchTerm = service || description
  if (!searchTerm?.trim()) {
    return { confidence: 0, created: false, isExactMatch: false }
  }

  const searchWords = searchTerm.toLowerCase().trim().split(/\s+/)
  
  try {
    // Get all user's service templates
    const templates = await prisma.serviceTemplate.findMany({
      where: { userId },
      orderBy: [
        { isPreferred: 'desc' },
        { usageCount: 'desc' }
      ]
    })

    let bestMatch: any = null
    let bestScore = 0
    let isExactMatch = false

    // Find best matching template
    for (const template of templates) {
      const score = calculateMatchScore(searchTerm, template)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = template
        
        // Check for exact match
        if (score >= 0.9) {
          isExactMatch = true
        }
      }
    }

    // If we found a good match (confidence > 60%), use it
    if (bestMatch && bestScore > 0.6) {
      // Update usage count for learning
      await prisma.serviceTemplate.update({
        where: { id: bestMatch.id },
        data: { usageCount: { increment: 1 } }
      })

      return {
        template: bestMatch,
        confidence: bestScore,
        created: false,
        isExactMatch
      }
    }

    // No good match found - create new template
    const newTemplate = await createServiceTemplate(userId, serviceData)
    
    return {
      template: newTemplate,
      confidence: 1.0, // New templates have full confidence
      created: true,
      isExactMatch: false
    }

  } catch (error) {
    console.error('Error in findOrCreateService:', error)
    return { confidence: 0, created: false, isExactMatch: false }
  }
}

/**
 * Calculate match score between search term and service template
 */
function calculateMatchScore(searchTerm: string, template: any): number {
  const search = searchTerm.toLowerCase().trim()
  const name = template.name.toLowerCase()
  const description = template.description.toLowerCase()
  const keywords = (template.keywords || '').toLowerCase()
  
  let score = 0

  // Exact name match (highest priority)
  if (name === search) {
    return 1.0
  }

  // Name contains search or vice versa
  if (name.includes(search) || search.includes(name)) {
    score = Math.max(score, 0.9)
  }

  // Description match
  if (description.includes(search) || search.includes(description)) {
    score = Math.max(score, 0.7)
  }

  // Keywords match
  if (keywords && (keywords.includes(search) || search.includes(keywords))) {
    score = Math.max(score, 0.8)
  }

  // Word-by-word matching for partial matches
  const searchWords = search.split(/\s+/)
  const nameWords = name.split(/\s+/)
  const descWords = description.split(/\s+/)
  const keywordWords = keywords.split(/[,\s]+/).filter(w => w.length > 0)

  let wordMatches = 0
  let totalWords = searchWords.length

  for (const searchWord of searchWords) {
    if (searchWord.length < 2) continue // Skip very short words
    
    if (nameWords.some(w => w.includes(searchWord) || searchWord.includes(w))) {
      wordMatches += 1
    } else if (descWords.some(w => w.includes(searchWord) || searchWord.includes(w))) {
      wordMatches += 0.7
    } else if (keywordWords.some(w => w.includes(searchWord) || searchWord.includes(w))) {
      wordMatches += 0.8
    }
  }

  const wordScore = wordMatches / totalWords
  score = Math.max(score, wordScore * 0.6) // Word matching contributes up to 60%

  // Learning-based scoring adjustments
  
  // Strong boost for preferred services (user's standards)
  if (template.isPreferred && score > 0.3) {
    score = Math.min(1.0, score + 0.3) // Increased from 0.2
  }

  // Progressive boost for frequently used services
  if (template.usageCount > 10 && score > 0.3) {
    score = Math.min(1.0, score + 0.15) // Higher usage = better match
  } else if (template.usageCount > 5 && score > 0.3) {
    score = Math.min(1.0, score + 0.1)
  }

  // Time-based learning - recent services get slight boost
  const daysSinceUpdate = Math.floor((Date.now() - new Date(template.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceUpdate < 7 && score > 0.4) {
    score = Math.min(1.0, score + 0.05) // Recent usage indicates relevance
  }

  return score
}

/**
 * Create new service template from voice data
 */
async function createServiceTemplate(userId: string, serviceData: ServiceData) {
  const { description, amount, service } = serviceData
  
  // Use service name if provided, otherwise use description
  const name = service || extractServiceName(description)
  const keywords = generateKeywords(name, description)

  const template = await prisma.serviceTemplate.create({
    data: {
      userId,
      name,
      description,
      unitPrice: amount || 0,
      quantity: 1,
      keywords,
      category: inferCategory(name, description)
    }
  })

  return template
}

/**
 * Extract a concise service name from description
 */
function extractServiceName(description: string): string {
  const words = description.toLowerCase().trim().split(/\s+/)
  
  // Common service patterns
  const servicePatterns = [
    /^(.*?)\s+service/i,
    /^(.*?)\s+work/i,
    /^(.*?)\s+job/i,
    /^(.*?)\s+consultation/i,
    /^(.*?)\s+repair/i,
  ]

  for (const pattern of servicePatterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  // Take first 2-3 meaningful words
  const meaningfulWords = words.filter(w => 
    w.length > 2 && 
    !['the', 'for', 'and', 'with', 'from'].includes(w)
  )

  return meaningfulWords.slice(0, 3).join(' ') || description.slice(0, 30)
}

/**
 * Generate search keywords from name and description with voice-friendly patterns
 */
function generateKeywords(name: string, description: string): string {
  const words = new Set([
    ...name.toLowerCase().split(/\s+/),
    ...description.toLowerCase().split(/\s+/)
  ])
  
  // Add voice-friendly variations
  const voiceFriendlyPatterns = new Set<string>()
  
  // Add common voice patterns for services
  if (name.toLowerCase().includes('callout')) {
    voiceFriendlyPatterns.add('call out')
    voiceFriendlyPatterns.add('standard fee')
    voiceFriendlyPatterns.add('basic charge')
  }
  
  if (name.toLowerCase().includes('standard')) {
    voiceFriendlyPatterns.add('usual')
    voiceFriendlyPatterns.add('regular')
    voiceFriendlyPatterns.add('normal')
  }
  
  if (name.toLowerCase().includes('consulting')) {
    voiceFriendlyPatterns.add('consultation')
    voiceFriendlyPatterns.add('advice')
    voiceFriendlyPatterns.add('consultancy')
  }

  // Filter out common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ])

  const allWords = new Set([
    ...Array.from(words).filter(w => w.length > 2 && !stopWords.has(w)),
    ...Array.from(voiceFriendlyPatterns)
  ])

  return Array.from(allWords).join(', ')
}

/**
 * Infer service category from name and description
 */
function inferCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  
  const categories = {
    'plumbing': ['plumb', 'pipe', 'drain', 'faucet', 'toilet', 'sink', 'water'],
    'electrical': ['electric', 'wire', 'outlet', 'switch', 'light', 'circuit'],
    'hvac': ['heating', 'cooling', 'hvac', 'furnace', 'ac', 'air conditioning'],
    'consulting': ['consult', 'advice', 'strategy', 'planning', 'analysis'],
    'repair': ['repair', 'fix', 'broken', 'maintenance'],
    'installation': ['install', 'setup', 'mount', 'assembly'],
    'cleaning': ['clean', 'wash', 'sanitize', 'maintenance'],
    'landscaping': ['lawn', 'garden', 'landscape', 'grass', 'tree', 'plant']
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category
    }
  }

  return 'general'
}
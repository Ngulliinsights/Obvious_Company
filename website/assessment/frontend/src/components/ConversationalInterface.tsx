import React, { useState, useEffect, useRef } from 'react'
import { AssessmentResponse } from '../types/assessment'

interface ConversationMessage {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  metadata?: {
    intent?: string
    confidence?: number
    entities?: Array<{ type: string; value: string }>
  }
}

interface ConversationalInterfaceProps {
  assessmentId: string
  onResponse: (response: AssessmentResponse) => void
  onComplete: (insights: any) => void
}

const ConversationalInterface: React.FC<ConversationalInterfaceProps> = ({
  assessmentId,
  onResponse,
  onComplete
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationPhase, setConversationPhase] = useState<'introduction' | 'exploration' | 'deep_dive' | 'synthesis'>('introduction')
  const [insights, setInsights] = useState<any>({})
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeConversation()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = () => {
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm here to understand your strategic AI readiness through a natural conversation. Think of this as a discussion with a strategic advisor rather than a formal assessment. Let's start with something simple - what's your current role and what brings you to explore AI integration?",
      timestamp: new Date()
    }
    
    setMessages([welcomeMessage])
    setConversationPhase('introduction')
  }

  const processUserInput = async (input: string) => {
    if (!input.trim()) return

    // Add user message
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsTyping(true)

    // Process the input and generate AI response
    const response = await generateAIResponse(input, messages, conversationPhase)
    
    // Simulate typing delay
    setTimeout(() => {
      const aiMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)

      // Update insights and phase
      if (response.insights) {
        setInsights(prev => ({ ...prev, ...response.insights }))
      }

      if (response.nextPhase) {
        setConversationPhase(response.nextPhase)
      }

      // Create assessment response
      const assessmentResponse: AssessmentResponse = {
        questionId: `conversation_${conversationPhase}_${Date.now()}`,
        value: input,
        timestamp: new Date(),
        timeSpent: 0
      }

      onResponse(assessmentResponse)

      // Check if conversation is complete
      if (response.isComplete) {
        setTimeout(() => {
          onComplete(insights)
        }, 2000)
      }
    }, 1000 + Math.random() * 2000) // Simulate realistic response time
  }

  const generateAIResponse = async (
    userInput: string, 
    conversationHistory: ConversationMessage[], 
    phase: string
  ): Promise<{
    content: string
    metadata?: any
    insights?: any
    nextPhase?: string
    isComplete?: boolean
  }> => {
    // This is a simplified NLP simulation - in a real app, this would use actual NLP services
    const analysis = analyzeUserInput(userInput)
    
    switch (phase) {
      case 'introduction':
        return handleIntroductionPhase(userInput, analysis)
      case 'exploration':
        return handleExplorationPhase(userInput, analysis)
      case 'deep_dive':
        return handleDeepDivePhase(userInput, analysis)
      case 'synthesis':
        return handleSynthesisPhase(userInput, analysis)
      default:
        return { content: "I'm not sure how to respond to that. Could you tell me more?" }
    }
  }

  const analyzeUserInput = (input: string) => {
    // Simplified sentiment and intent analysis
    const words = input.toLowerCase().split(' ')
    
    const positiveWords = ['excited', 'ready', 'confident', 'optimistic', 'eager']
    const negativeWords = ['concerned', 'worried', 'uncertain', 'challenging', 'difficult']
    const authorityWords = ['decide', 'approve', 'budget', 'team', 'department', 'organization']
    const techWords = ['ai', 'automation', 'technology', 'digital', 'data', 'analytics']
    
    const sentiment = positiveWords.some(w => words.includes(w)) ? 'positive' :
                     negativeWords.some(w => words.includes(w)) ? 'negative' : 'neutral'
    
    const hasAuthority = authorityWords.some(w => words.includes(w))
    const techFocused = techWords.some(w => words.includes(w))
    
    return {
      sentiment,
      hasAuthority,
      techFocused,
      wordCount: words.length,
      entities: extractEntities(input)
    }
  }

  const extractEntities = (input: string) => {
    // Simple entity extraction simulation
    const entities = []
    
    if (input.match(/\b(ceo|cto|director|manager|lead)\b/i)) {
      entities.push({ type: 'role', value: input.match(/\b(ceo|cto|director|manager|lead)\b/i)?.[0] || '' })
    }
    
    if (input.match(/\b(finance|healthcare|manufacturing|retail|technology)\b/i)) {
      entities.push({ type: 'industry', value: input.match(/\b(finance|healthcare|manufacturing|retail|technology)\b/i)?.[0] || '' })
    }
    
    return entities
  }

  const handleIntroductionPhase = (input: string, analysis: any) => {
    const roleEntity = analysis.entities.find((e: any) => e.type === 'role')
    const industryEntity = analysis.entities.find((e: any) => e.type === 'industry')
    
    let response = "Thank you for sharing that. "
    
    if (roleEntity) {
      response += `As a ${roleEntity.value}, you likely have significant influence on strategic decisions. `
    }
    
    if (industryEntity) {
      response += `The ${industryEntity.value} industry has unique AI opportunities and challenges. `
    }
    
    response += "I'd love to understand more about your current situation. What specific challenges or opportunities are driving your interest in AI? Are there particular areas where you feel AI could make the biggest impact?"
    
    return {
      content: response,
      insights: {
        role: roleEntity?.value,
        industry: industryEntity?.value,
        initialSentiment: analysis.sentiment
      },
      nextPhase: 'exploration'
    }
  }

  const handleExplorationPhase = (input: string, analysis: any) => {
    let response = "That's really insightful. "
    
    if (analysis.sentiment === 'positive') {
      response += "I can hear the enthusiasm in your response, which is a great foundation for AI adoption. "
    } else if (analysis.sentiment === 'negative') {
      response += "I appreciate your honesty about the challenges - that awareness is actually a strength. "
    }
    
    if (analysis.hasAuthority) {
      response += "It sounds like you're in a position to drive meaningful change. "
    }
    
    response += "Let's dig deeper into the specifics. Can you walk me through a typical day or week where these challenges show up? I'm particularly interested in understanding where your time and energy go, and where you feel the biggest friction points."
    
    return {
      content: response,
      insights: {
        challengeAwareness: analysis.sentiment,
        authorityLevel: analysis.hasAuthority ? 'high' : 'moderate'
      },
      nextPhase: 'deep_dive'
    }
  }

  const handleDeepDivePhase = (input: string, analysis: any) => {
    let response = "This is exactly the kind of detail that helps me understand your strategic position. "
    
    response += "Based on what you've shared, I'm getting a picture of someone who understands both the opportunities and the practical realities of implementation. "
    
    if (analysis.wordCount > 20) {
      response += "I appreciate the thoughtful detail in your response - it shows you've really considered these issues. "
    }
    
    response += "One final area I'd like to explore: when you think about implementing AI solutions, what does success look like to you? And what would need to be true about your organization, your team, and your resources to make that success achievable?"
    
    return {
      content: response,
      insights: {
        detailOrientation: analysis.wordCount > 20 ? 'high' : 'moderate',
        practicalThinking: true
      },
      nextPhase: 'synthesis'
    }
  }

  const handleSynthesisPhase = (input: string, analysis: any) => {
    const response = "Thank you for this rich conversation. I have a much clearer picture of your strategic readiness and thinking style. Let me synthesize what I've learned and provide you with personalized insights about your AI integration potential. This will take just a moment to process..."
    
    return {
      content: response,
      insights: {
        visionClarity: analysis.sentiment === 'positive' ? 'high' : 'developing',
        conversationComplete: true
      },
      isComplete: true
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      processUserInput(currentInput)
    }
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentInput(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = () => {
        setIsListening(false)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognition.start()
    }
  }

  return (
    <div className="conversational-interface">
      <div className="conversation-header">
        <div className="ai-avatar">
          <i className="fas fa-robot"></i>
        </div>
        <div className="conversation-info">
          <h3>Strategic AI Conversation</h3>
          <p className="conversation-phase">Phase: {conversationPhase.replace('_', ' ')}</p>
        </div>
        <div className="conversation-status">
          <div className={`status-indicator ${isTyping ? 'typing' : 'ready'}`}>
            {isTyping ? (
              <>
                <i className="fas fa-circle"></i>
                <span>AI is thinking...</span>
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i>
                <span>Ready</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="conversation-messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.type === 'ai' ? 'ai-message' : 'user-message'}`}
          >
            <div className="message-avatar">
              {message.type === 'ai' ? (
                <i className="fas fa-robot"></i>
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {message.metadata && (
                <div className="message-metadata">
                  {message.metadata.confidence && (
                    <span className="confidence">
                      Confidence: {Math.round(message.metadata.confidence * 100)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message ai-message typing">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="conversation-input">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts naturally..."
            disabled={isTyping}
            className="conversation-text-input"
          />
          
          <div className="input-actions">
            <button
              type="button"
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={startVoiceInput}
              disabled={isTyping}
              title="Voice input"
            >
              <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
            </button>
            
            <button
              type="button"
              className="send-button"
              onClick={() => processUserInput(currentInput)}
              disabled={!currentInput.trim() || isTyping}
              title="Send message"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        
        <div className="input-help">
          <div className="help-tips">
            <span className="help-tip">
              <i className="fas fa-lightbulb"></i>
              Speak naturally - this is a conversation, not a questionnaire
            </span>
            <span className="help-tip">
              <i className="fas fa-keyboard"></i>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationalInterface
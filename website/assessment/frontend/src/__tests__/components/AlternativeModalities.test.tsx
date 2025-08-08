import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ScenarioBasedInterface, { sampleScenarios } from '../../components/ScenarioBasedInterface'
import ConversationalInterface from '../../components/ConversationalInterface'
import VisualPatternInterface, { sampleVisualTasks } from '../../components/VisualPatternInterface'
import BehavioralObservationInterface, { sampleBehavioralTasks } from '../../components/BehavioralObservationInterface'

describe('Alternative Assessment Modalities', () => {
  const mockOnResponse = vi.fn()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    mockOnResponse.mockClear()
    mockOnComplete.mockClear()
  })

  describe('ScenarioBasedInterface', () => {
    it('should render scenario title and description', () => {
      render(
        <ScenarioBasedInterface
          scenario={sampleScenarios[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(sampleScenarios[0].title)).toBeInTheDocument()
      expect(screen.getByText(sampleScenarios[0].description)).toBeInTheDocument()
    })

    it('should display decision options', () => {
      render(
        <ScenarioBasedInterface
          scenario={sampleScenarios[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      const firstDecision = sampleScenarios[0].decisions[0]
      firstDecision.options.forEach(option => {
        expect(screen.getByText(option.text)).toBeInTheDocument()
      })
    })

    it('should handle option selection', () => {
      render(
        <ScenarioBasedInterface
          scenario={sampleScenarios[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      const firstOption = sampleScenarios[0].decisions[0].options[0]
      const optionElement = screen.getByText(firstOption.text)
      
      fireEvent.click(optionElement)
      
      expect(mockOnResponse).toHaveBeenCalled()
    })
  })

  describe('ConversationalInterface', () => {
    it('should render conversation interface', () => {
      render(
        <ConversationalInterface
          assessmentId="test-assessment"
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Strategic AI Conversation')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Share your thoughts naturally...')).toBeInTheDocument()
    })

    it('should have voice input button', () => {
      render(
        <ConversationalInterface
          assessmentId="test-assessment"
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      const voiceButton = screen.getByTitle('Voice input')
      expect(voiceButton).toBeInTheDocument()
    })

    it('should have send button', () => {
      render(
        <ConversationalInterface
          assessmentId="test-assessment"
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      const sendButton = screen.getByTitle('Send message')
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('VisualPatternInterface', () => {
    it('should render task title and description', () => {
      render(
        <VisualPatternInterface
          task={sampleVisualTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(sampleVisualTasks[0].title)).toBeInTheDocument()
      expect(screen.getByText(sampleVisualTasks[0].description)).toBeInTheDocument()
    })

    it('should render mode selector buttons', () => {
      render(
        <VisualPatternInterface
          task={sampleVisualTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Select')).toBeInTheDocument()
      expect(screen.getByText('Connect')).toBeInTheDocument()
      expect(screen.getByText('Annotate')).toBeInTheDocument()
    })

    it('should render workflow elements', () => {
      render(
        <VisualPatternInterface
          task={sampleVisualTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      sampleVisualTasks[0].elements.forEach(element => {
        expect(screen.getByText(element.label)).toBeInTheDocument()
      })
    })

    it('should have complete analysis button', () => {
      render(
        <VisualPatternInterface
          task={sampleVisualTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Complete Analysis')).toBeInTheDocument()
    })
  })

  describe('BehavioralObservationInterface', () => {
    it('should render task title and description', () => {
      render(
        <BehavioralObservationInterface
          task={sampleBehavioralTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(sampleBehavioralTasks[0].title)).toBeInTheDocument()
      expect(screen.getByText(sampleBehavioralTasks[0].description)).toBeInTheDocument()
    })

    it('should display behavioral metrics', () => {
      render(
        <BehavioralObservationInterface
          task={sampleBehavioralTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Time:')).toBeInTheDocument()
      expect(screen.getByText('Interactions:')).toBeInTheDocument()
      expect(screen.getByText('Task:')).toBeInTheDocument()
    })

    it('should show behavioral indicators', () => {
      render(
        <BehavioralObservationInterface
          task={sampleBehavioralTasks[0]}
          onResponse={mockOnResponse}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('Tracking engagement patterns')).toBeInTheDocument()
      expect(screen.getByText('Analyzing interaction behavior')).toBeInTheDocument()
      expect(screen.getByText('Measuring decision timing')).toBeInTheDocument()
    })
  })
})
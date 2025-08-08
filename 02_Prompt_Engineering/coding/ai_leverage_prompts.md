# Advanced AI Leverage Prompts for Critical Development

## Architectural Thinking Prompts

### System Design Exploration
```
I need to build [description of application]. Before we write any code, help me think through the architecture:

1. What are the core business entities and their relationships?
2. What are the main user workflows and how do they flow through the system?
3. What external systems or APIs will we need to integrate with?
4. What are the performance bottlenecks likely to be and where?
5. How would this system need to scale from 100 users to 100,000 users?
6. What are the critical failure points and how can we make them resilient?

Walk me through 3 different architectural approaches, explaining the tradeoffs of each.
```

### Pattern Recognition and Application
```
I'm working on [specific feature/problem]. Help me identify:

1. What established patterns apply to this problem?
2. Which pattern is most appropriate for my constraints: [list your constraints]?
3. How have other successful applications solved similar problems?
4. What are the anti-patterns I should avoid here?
5. How can I implement this pattern in a way that's testable and maintainable?

Show me a minimal example that demonstrates the pattern, then help me adapt it to my specific needs.
```

### Technology Stack Evaluation
```
I'm choosing between [Technology A] and [Technology B] for [specific use case]. Help me evaluate:

1. What are the fundamental differences in their approaches to [core problem]?
2. How do their performance characteristics differ under [my specific load patterns]?
3. What does the learning curve look like for each, and what skills transfer between them?
4. How mature are their ecosystems for [my specific domain]?
5. What are the long-term maintenance implications of each choice?
6. How would each handle [specific edge case relevant to my project]?

Don't just recommend one - help me understand the decision-making framework.
```

## Deep Debugging and Problem-Solving

### Root Cause Investigation
```
I'm experiencing [specific bug/issue]. Instead of just giving me a fix, help me learn to debug this systematically:

1. What categories of problems typically cause symptoms like this?
2. What diagnostic steps should I take to narrow down the root cause?
3. What logging or monitoring would help me understand what's happening?
4. How can I reproduce this issue reliably?
5. What would an expert in [relevant domain] look for first?

Guide me through the investigation process step by step, teaching me the reasoning behind each diagnostic step.
```

### Performance Analysis Framework
```
My application is performing poorly at [specific operation]. Help me build expertise in performance optimization:

1. What are the common bottlenecks for this type of operation?
2. How do I profile and measure what's actually happening?
3. What tools and techniques are most effective for identifying the real problems?
4. How do I distinguish between micro-optimizations and architectural issues?
5. What are the typical optimization strategies, and when is each appropriate?

Don't optimize for me - teach me to fish by showing me how to analyze and improve performance systematically.
```

## Advanced Code Quality and Maintainability

### Code Review Mastery
```
I've written this code: [paste code]. Instead of just pointing out issues, help me develop expert-level code review skills:

1. What would a senior developer look for when reviewing this code?
2. How can I spot potential issues before they become bugs?
3. What questions should I ask about maintainability and extensibility?
4. How do I evaluate whether the abstraction level is appropriate?
5. What would make this code easier to understand for someone else?

Teach me to review my own code with the same rigor as an experienced developer.
```

### Refactoring Strategy Development
```
This codebase [describe current state] needs refactoring. Help me develop a strategic approach:

1. How do I identify which parts of the code are causing the most problems?
2. What's the safest order to refactor different components?
3. How do I maintain functionality while making structural changes?
4. What automated tools and techniques can help ensure I don't break things?
5. How do I know when the refactoring is complete and successful?

I want to learn the methodology of large-scale refactoring, not just get the refactored code.
```

## Domain Expertise Building

### Industry Best Practices Integration
```
I'm building [type of application] for [specific domain]. Help me understand not just how to code it, but how to build it right:

1. What are the industry standards and conventions for this domain?
2. What compliance or regulatory considerations should I be aware of?
3. What are the common security vulnerabilities specific to this type of application?
4. How do successful companies in this space typically architect their solutions?
5. What are the domain-specific testing strategies I should implement?

I want to build something that would pass muster with experts in this field.
```

### API Design Excellence
```
I need to design an API for [specific use case]. Help me think like an API architect:

1. What are the key principles of excellent API design?
2. How should I model the resources and their relationships?
3. What are the common mistakes that make APIs hard to use?
4. How do I design for both current needs and future evolution?
5. What documentation and developer experience considerations are crucial?

Guide me through designing an API that other developers would love to use.
```

## Testing and Quality Assurance Mastery

### Comprehensive Testing Strategy
```
For this feature [describe feature], help me develop a testing mindset that goes beyond basic coverage:

1. What are all the different types of testing that would add value here?
2. How do I identify the critical test cases versus the nice-to-have ones?
3. What testing patterns and techniques are most effective for this type of functionality?
4. How do I test the interactions and integration points effectively?
5. What would break if I changed [specific aspect], and how can I test for that?

I want to understand testing strategy, not just get test code written.
```

### Error Handling and Resilience Design
```
Help me design robust error handling for [specific system/feature]:

1. What are all the ways this could fail, including external dependencies?
2. How should the system behave when each type of failure occurs?
3. What information do I need to capture for debugging without compromising security?
4. How do I design graceful degradation when partial failures occur?
5. What monitoring and alerting should I implement to catch issues early?

Teach me to think defensively about system design from the ground up.
```

## Learning and Knowledge Transfer

### Mentorship Simulation
```
Act as my senior developer mentor for this project. I want you to:

1. Ask me probing questions about my design decisions
2. Challenge my assumptions and help me think through edge cases
3. Suggest areas where I should deepen my understanding
4. Help me recognize when I'm taking shortcuts that will cause problems later
5. Guide me toward resources and practices that will accelerate my growth

Don't just give me answers - help me develop the judgment to make good decisions independently.
```

### Knowledge Consolidation
```
I've been working on [project/feature] and want to consolidate what I've learned:

1. What are the key concepts and principles I should extract from this work?
2. How do these learnings apply to other similar problems I might face?
3. What mental models should I develop to handle this class of problems?
4. What questions should I be asking myself when facing similar challenges?
5. How can I document this knowledge so it's useful for future projects?

Help me turn this specific experience into transferable expertise.
```

## Meta-Learning and Skill Development

### Skill Gap Analysis
```
Based on the work I'm doing on [project description], help me identify:

1. What technical skills am I using well, and which need development?
2. What gaps in my knowledge are creating inefficiencies or risks?
3. What advanced techniques would significantly improve my effectiveness?
4. How can I structure my learning to build expertise systematically?
5. What projects or exercises would best accelerate my growth in weak areas?

I want to be strategic about my professional development.
```

### Technology Trend Integration
```
I want to evaluate [new technology/framework] for potential adoption:

1. What problem does this technology solve that existing tools don't?
2. How mature is it, and what are the risks of early adoption?
3. What would be required to integrate it into existing systems?
4. How does it compare to alternatives in terms of long-term viability?
5. What would a pilot project look like to evaluate its fit for our needs?

Help me think critically about technology adoption decisions rather than following hype.
```

## Quality Gates and Decision Making

### Architecture Decision Records
```
Help me document this architectural decision properly:

Decision: [What I'm deciding]
Context: [Current situation and constraints]

I want to capture:
1. What alternatives I considered and why I rejected them
2. What assumptions this decision is based on
3. What consequences I expect, both positive and negative
4. What conditions would make me reconsider this decision
5. How this decision affects other parts of the system

This should serve as a learning tool for future similar decisions.
```

### Risk Assessment Framework
```
For this implementation approach [describe approach], help me think through risks systematically:

1. What could go wrong during development, and how likely is each scenario?
2. What operational risks does this introduce once deployed?
3. How would each risk manifest, and what would be the impact?
4. What mitigation strategies are available for the highest-priority risks?
5. What early warning signs should I monitor for?

I want to develop better risk intuition for technical decisions.
```
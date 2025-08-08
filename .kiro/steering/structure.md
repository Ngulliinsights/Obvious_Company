# Project Structure & Organization

## Repository Overview

This repository contains The Obvious Company's comprehensive business assets, including strategic frameworks, AI curricula, company materials, and a marketing website.

## Folder Structure

### Content & Strategy Folders
```
01_AI_Curricula_and_Training/     # 12+ AI leadership curricula and training programs
02_Prompt_Engineering/            # Prompt templates, analysis frameworks, and coding prompts
03_Strategic_Frameworks/          # 20+ strategic frameworks and methodologies
04_Funding_and_Business_Development/ # Fundraising guides and business development materials
05_Company_Materials/             # Brand assets, messaging, implementation guides
08_Presentations_and_Pitches/     # Client presentations and pitch materials
```

### Website Implementation
```
website/
├── index.html                    # Homepage
├── about.html                    # Company overview
├── services.html                 # Service offerings
├── contact.html                  # Contact form
├── 404.html                     # Error page
├── css/
│   └── styles.css               # Main stylesheet with CSS custom properties
├── js/
│   └── main.js                  # Progressive enhancement JavaScript
├── server/
│   ├── server.js                # Express.js backend
│   └── package.json             # Server dependencies
├── assessment/                   # Interactive assessment system
├── insights/                     # Thought leadership hub
├── learn/                        # Learning portal
├── admin/                        # Admin interface
├── images/                       # Static assets
└── sw.js                        # Service worker
```

## Content Organization Patterns

### Naming Conventions
- **Markdown files**: Use descriptive names with underscores (e.g., `strategic_ai_consultancy.md`)
- **HTML files**: Use hyphens for multi-word pages (e.g., `case-studies.html`)
- **Folders**: Use descriptive names with underscores for content, hyphens for web assets

### Content Mapping Strategy
- **Strategic Frameworks** → `/insights/frameworks/` (website)
- **AI Curricula** → `/learn/programs/` (website)
- **Company Materials** → Multiple website sections (about, services, blog)
- **Presentations** → Case studies and success stories

### File Organization Principles
1. **Numbered folders** (01_, 02_, etc.) indicate processing order and priority
2. **Descriptive filenames** make content easily discoverable
3. **Duplicate files** with (1) suffix indicate iterations or versions
4. **HTML files** in root website/ directory for direct serving

## Development Workflow

### Content Development
1. Create strategic content in numbered folders (01-08)
2. Refine and iterate using descriptive filenames
3. Map content to website sections via implementation guides
4. Convert to web-ready format in website/ directory

### Website Development
1. Static HTML files serve as primary content delivery
2. CSS custom properties enable consistent theming
3. JavaScript provides progressive enhancement
4. Server handles API endpoints and email integration

### Asset Management
- **Images**: Store in `website/images/` with descriptive names
- **CSS**: Single stylesheet with component-based organization
- **JavaScript**: Minimal, progressive enhancement approach
- **Content**: Markdown source files map to HTML implementations

## Integration Points

### Cross-Folder Dependencies
- Assessment system draws from strategic frameworks
- Learning portal integrates with AI curricula content
- Company materials inform website messaging and branding
- Presentations provide case study content for website

### Content-to-Website Mapping
- Strategic frameworks become interactive web tools
- Curricula transform into structured learning programs
- Company messaging drives website copy and positioning
- Implementation guides inform user experience design

## Best Practices

### File Management
- Keep source content in numbered folders for organization
- Use website/ folder for production-ready implementations
- Maintain clear separation between strategy content and web assets
- Document content mapping in implementation guides

### Development Standards
- Follow static-first architecture principles
- Implement progressive enhancement for JavaScript
- Use semantic HTML with proper accessibility
- Maintain consistent visual design system across all pages
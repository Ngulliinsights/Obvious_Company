# Strategic Documentation Scripts

A comprehensive collection of scripts for automating documentation management,
cross-referencing, and funding intelligence gathering in project documentation
systems.

## Overview

This toolkit provides automated solutions for:

- **File Renaming**: Intelligent renaming based on content analysis and naming
  conventions
- **Cross-Referencing**: Automatic relationship analysis and metadata insertion
- **Funding Intelligence**: Web scraping and analysis of funding opportunities

## Directory Structure

```
strategic_documentation_scripts/
├── README.md                           # This file
├── run_rename.bat                      # Windows batch runner for renaming
├── run_rename.sh                       # Linux/Mac runner for renaming
├── run_cross_reference.bat             # Windows batch runner for cross-referencing
├── run_cross_reference.sh              # Linux/Mac runner for cross-referencing
├── rename_files.py                     # Main file renaming script
├── generate_bash_rename.py             # Bash rename command generator
├── rename_commands.ps1                 # PowerShell rename commands
├── rename_commands.sh                  # Bash rename commands
├── analyze_relationships.py            # Document relationship analyzer
├── insert_metadata.py                  # YAML metadata inserter
├── generate_cross_sections.py          # Cross-reference section generator
├── relationships.json                  # Document relationships data
├── enhanced_funder_scraper.js          # Google Apps Script for funding scraping
└── grant_tasks.ts                      # TypeScript implementation guide
```

## Setup

### Prerequisites

- **Python 3.8+** for renaming and cross-referencing scripts
- **Node.js 16+** for funding scripts (if applicable)
- **Google Apps Script** environment for enhanced_funder_scraper.js

### Installation

1. Clone or copy this directory to your project
2. Ensure Python is installed and available in PATH
3. For funding scripts, set up Google Apps Script environment

## Usage

### File Renaming System

The renaming system analyzes document content and applies consistent naming
conventions.

#### Quick Start

**Windows:**

```batch
run_rename.bat
```

**Linux/Mac:**

```bash
chmod +x run_rename.sh
./run_rename.sh
```

#### Manual Usage

1. **Analyze and generate mappings:**

   ```bash
   python rename_files.py
   ```

2. **Generate platform-specific commands:**

   ```bash
   python generate_bash_rename.py
   ```

3. **Execute rename commands:**

   ```bash
   # Windows PowerShell
   .\rename_commands.ps1

   # Linux/Mac
   chmod +x rename_commands.sh
   ./rename_commands.sh
   ```

#### Output Files

- `file_mapping.json` - Old to new filename mappings
- `rename_commands.ps1` - PowerShell commands for Windows
- `rename_commands.sh` - Bash commands for Linux/Mac
- `manual_review.txt` - Files requiring manual review

### Cross-Referencing System

Automatically analyzes document relationships and inserts cross-reference
sections.

#### Quick Start

**Windows:**

```batch
run_cross_reference.bat
```

**Linux/Mac:**

```bash
chmod +x run_cross_reference.sh
./run_cross_reference.sh
```

#### Manual Usage

1. **Insert metadata blocks:**

   ```bash
   python insert_metadata.py --directory ../path/to/docs --dry-run
   ```

2. **Analyze relationships:**

   ```bash
   python analyze_relationships.py --directory ../path/to/docs --output relationships.json
   ```

3. **Generate cross-reference sections:**
   ```bash
   python generate_cross_sections.py --relationships relationships.json --directory ../path/to/docs
   ```

#### Features

- **Metadata Insertion**: Adds YAML frontmatter with document type, audience,
  and version
- **Relationship Analysis**: Identifies dependencies, implementations, and
  complementary documents
- **Cross-Reference Sections**: Automatically generates "Prerequisites",
  "Related Resources", etc.

### Funding Intelligence System

#### Enhanced Funder Scraper

**Setup in Google Apps Script:**

1. Create a new Google Apps Script project
2. Copy the content of `enhanced_funder_scraper.js`
3. Set up the following triggers:
   - Daily execution for `scrapeFilmFunds()`
   - Manual execution for `setupAutomaticScraping()`

**Features:**

- Intelligent web scraping of funding opportunities
- Funder archetype classification
- Automated spreadsheet population
- Deadline and amount extraction

#### Grant Tasks Implementation

The `grant_tasks.ts` file contains a comprehensive TypeScript implementation
guide for building an Intelligent Grant Automation System (IGAS). This includes:

- **Phase 1**: Foundation Intelligence Development
- **Phase 2**: Narrative Intelligence Development
- **Phase 3**: Relationship Orchestration Engine
- **Phase 4**: Advanced Learning and Optimization
- **Phase 5**: Production Deployment and Scaling

## Configuration

### Naming Convention

The system uses the following naming convention:

```
TYPE_Title_AUDIENCE_vYEAR.ext
```

**Types:**

- `CURR_` - Curriculum
- `FRMK_` - Framework
- `GUID_` - Guide
- `TMPL_` - Template
- `PRES_` - Presentation
- `STRAT_` - Strategic

**Audiences:**

- `EXEC_` - Executives
- `CONS_` - Consultants
- `DEV_` - Developers
- `CLIENT_` - Clients
- `INT_` - Internal

### Customization

#### Renaming Rules

Edit `rename_files.py` to customize:

- Document type keywords
- Audience detection rules
- Version suffix patterns
- Excluded files and directories

#### Cross-Reference Templates

Modify `insert_metadata.py` and `generate_cross_sections.py` to:

- Change metadata templates
- Adjust relationship detection logic
- Customize cross-reference section formats

## Examples

### Example 1: Renaming Project Documentation

```bash
# Navigate to scripts directory
cd strategic_documentation_scripts

# Run the renaming process
python rename_files.py

# Review generated files
cat manual_review.txt

# Execute rename commands
./rename_commands.sh
```

### Example 2: Cross-Referencing Documentation

```bash
# Insert metadata
python insert_metadata.py --directory ../docs

# Analyze relationships
python analyze_relationships.py --directory ../docs

# Generate cross-references
python generate_cross_sections.py --directory ../docs
```

### Example 3: Funding Intelligence Setup

```javascript
// In Google Apps Script
function setupScraping() {
  // Configure target URLs
  const urls = [
    'https://foundation-website.com/grants',
    'https://government-funding-site.gov/opportunities',
  ];

  // Set up automated scraping
  setupAutomaticScraping();
}
```

## Troubleshooting

### Common Issues

**Permission Errors:**

```bash
chmod +x *.sh
```

**Missing Dependencies:**

```bash
pip install -r requirements.txt
```

**Path Issues:**

- Ensure scripts are run from the `strategic_documentation_scripts` directory
- Update `ROOT_DIR` in scripts if project structure changes

### Logging

Scripts generate detailed logs. Check console output for:

- Processing status
- Error messages
- File counts and statistics

## Integration with Other Projects

### Adding to Existing Projects

1. Copy the `strategic_documentation_scripts` directory
2. Update path references in scripts if needed
3. Customize naming conventions for your project
4. Set up automated execution via CI/CD

### CI/CD Integration

```yaml
# .github/workflows/documentation.yml
name: Documentation Management
on:
  push:
    paths:
      - 'docs/**'
jobs:
  process-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Process Documentation
        run: |
          cd strategic_documentation_scripts
          python rename_files.py
          python analyze_relationships.py --directory ../docs
```

## Contributing

### Adding New Scripts

1. Follow the existing naming conventions
2. Include comprehensive documentation
3. Add error handling and logging
4. Update this README

### Modifying Existing Scripts

1. Test changes thoroughly
2. Maintain backward compatibility
3. Update documentation
4. Consider impact on other scripts

## License

This toolkit is provided as-is for documentation management purposes.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review script logs for error details
3. Ensure all prerequisites are met
4. Verify file permissions and paths

---

**Last Updated:** 2025 **Version:** 1.0

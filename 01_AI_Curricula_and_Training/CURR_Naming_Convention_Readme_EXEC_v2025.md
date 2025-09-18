---
title: "Naming convention readme"
type: "curriculum"
audience: "executives"
version: "v2025.md"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

# File Naming Convention System

## Overview

This system implements a standardized file naming convention for The Obvious Company repository. The convention follows a structured pattern to improve organization, searchability, and content management.

## Naming Pattern

Files are renamed following this pattern:

```
[TYPE_PREFIX]Descriptive_Content_Focus[_AUDIENCE][_VERSION].extension
```

For example: `CURR_AI_Leadership_Intensive_EXEC_v2024.md`

### Document Type Prefixes

- `CURR_` - Curricula, courses, training materials
- `FRMK_` - Frameworks, systems, architectures
- `TMPL_` - Templates, boilerplates, starter content
- `GUID_` - Guides, manuals, instructions, tutorials
- `PRES_` - Presentations, pitches, slides
- `STRAT_` - Strategic documents, plans, audits, assessments

### Audience Indicators

- `_EXEC` - Executive/leadership audience
- `_CONS` - Consultant/advisor audience
- `_DEV` - Developer/technical audience
- `_CLIENT` - Client-facing materials
- `_INT` - Internal company use

### Version/Date Suffixes

- `_v2024` - Year-specific version
- `_LATEST` - Current version
- `_DRAFT` - Work-in-progress

## Using the Renaming System

### Step 1: Generate Rename Proposals

Run the Python script to analyze files and generate rename proposals:

```
.\run_rename.bat
```

Or directly with Python:

```
python rename_files.py
```

### Step 2: Review Generated Files

The script generates three important files:

1. `rename_commands.ps1` - PowerShell commands to perform the renaming
2. `file_mapping.json` - JSON mapping of old filenames to new filenames
3. `manual_review.txt` - List of files that need manual review

### Step 3: Apply Rename Commands

#### For Windows Users

After reviewing the proposed changes, run the PowerShell script to apply them:

```powershell
.\rename_commands.ps1
```

#### For Linux/macOS Users

Use the bash script instead:

```bash
chmod +x rename_commands.sh
./rename_commands.sh
```

## Manual Review Process

Some files may be flagged for manual review if:

1. The script couldn't confidently determine the document type
2. The content focus couldn't be extracted clearly
3. The file is in an excluded category but might need renaming

For these files, review the content and determine the appropriate naming convention manually.

## Customizing the Convention

To modify the naming convention rules, edit the `rename_files.py` script and adjust the following variables:

- `DOC_TYPE_PREFIXES` - Document type prefix mappings
- `AUDIENCE_INDICATORS` - Audience suffix mappings
- `VERSION_SUFFIXES` - Version suffix mappings
- `DOC_TYPE_KEYWORDS` - Keywords used to detect document types
- `AUDIENCE_KEYWORDS` - Keywords used to detect target audiences
- `EXCLUDE_FILES` - Files to exclude from renaming
- `EXCLUDE_DIRS` - Directories to exclude from renaming

## Benefits of the New Naming Convention

- **Improved Searchability**: Quickly find files by type, audience, or version
- **Clear Organization**: Understand file purpose at a glance
- **Consistent Structure**: Maintain uniformity across the repository
- **Version Control**: Easily identify current vs. draft documents
- **Audience Targeting**: Quickly identify intended audience for each document
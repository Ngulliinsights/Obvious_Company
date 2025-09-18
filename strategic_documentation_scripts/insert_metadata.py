#!/usr/bin/env python3

"""
Metadata Insertion Script

This script automatically inserts YAML metadata blocks into markdown files
based on the new file naming convention and cross-reference relationships.

Usage:
    python insert_metadata.py [--dry-run] [--directory DIR]

Options:
    --dry-run       Preview changes without modifying files
    --directory     Specify the directory to process (default: current directory)
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path

# Define document types and audiences from naming convention
DOC_TYPES = {
    "CURR": "curriculum",
    "FRMK": "framework",
    "GUID": "guide",
    "TMPL": "template",
    "PRES": "presentation",
    "STRAT": "strategic"
}

AUDIENCES = {
    "EXEC": "executives",
    "CONS": "consultants",
    "DEV": "developers",
    "CLIENT": "clients",
    "INT": "internal"
}

# Templates for different document types
METADATA_TEMPLATES = {
    "curriculum": """---
title: "{title}"
type: "curriculum"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

""",
    
    "framework": """---
title: "{title}"
type: "framework"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

""",
    
    "guide": """---
title: "{title}"
type: "guide"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

""",
    
    "template": """---
title: "{title}"
type: "template"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

""",
    
    "presentation": """---
title: "{title}"
type: "presentation"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

""",
    
    "strategic": """---
title: "{title}"
type: "strategic"
audience: "{audience}"
version: "{version}"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"""
}

# Cross-reference section templates
CROSS_REF_TEMPLATES = {
    "prerequisites": """## Prerequisites

*Documents you should read before this one:*

- [Document Title](path/to/document.md)
- [Another Document](path/to/another-document.md)

""",
    
    "related_resources": """## Related Resources

*Additional documents that complement this one:*

- [Document Title](path/to/document.md) - Brief description
- [Another Document](path/to/another-document.md) - Brief description

""",
    
    "implementation_examples": """## Implementation Examples

*Templates and examples that implement this framework:*

- [Template Title](path/to/template.md) - Brief description
- [Another Template](path/to/another-template.md) - Brief description

""",
    
    "next_steps": """## Next Steps

*Where to go after reading this document:*

- [Next Document](path/to/next-document.md) - Brief description
- [Another Next Step](path/to/another-next-step.md) - Brief description

"""
}

def parse_filename(filename):
    """Parse a filename according to the naming convention."""
    # Extract components from filename
    # Format: TYPE_Title_AUDIENCE_vYYYY(_N)?.ext
    basename = os.path.basename(filename)
    name_parts = basename.split('_')
    
    if len(name_parts) < 4:
        return None
    
    doc_type = name_parts[0]
    audience = None
    version = None
    title_parts = []
    
    # Find audience and version
    for i, part in enumerate(name_parts[1:], 1):
        if part in AUDIENCES.keys():
            audience = part
            title_parts = name_parts[1:i]
        elif part.startswith('v'):
            version = part
            if not audience and i > 1:
                audience = name_parts[i-1]
                title_parts = name_parts[1:i-1]
    
    if not title_parts:
        title_parts = name_parts[1:-2]  # Assume title is everything between type and audience
    
    title = ' '.join(title_parts)
    
    # Handle file extension
    if '.' in basename:
        extension = basename.split('.')[-1]
    else:
        extension = ''
    
    return {
        'doc_type': doc_type,
        'title': title,
        'audience': audience,
        'version': version,
        'extension': extension
    }

def generate_metadata(file_info):
    """Generate metadata block based on file information."""
    if not file_info or file_info['doc_type'] not in DOC_TYPES:
        return None
    
    doc_type = DOC_TYPES[file_info['doc_type']]
    audience = AUDIENCES.get(file_info['audience'], 'general')
    version = file_info['version'] if file_info['version'] else 'v2025'
    title = ' '.join(word.capitalize() for word in file_info['title'].split('_'))
    
    template = METADATA_TEMPLATES.get(doc_type, METADATA_TEMPLATES['guide'])
    metadata = template.format(
        title=title,
        audience=audience,
        version=version
    )
    
    return metadata

def has_metadata(content):
    """Check if the file already has a YAML metadata block."""
    return content.startswith('---') and '---' in content[3:]

def insert_metadata(filepath, dry_run=False):
    """Insert metadata block into a file if it doesn't already have one."""
    try:
        # Skip non-markdown files (except for specific extensions we want to process)
        ext = os.path.splitext(filepath)[1].lower()
        if ext not in ['.md', '.markdown', '.html', '.js', '.ts', '.json']:
            return False, f"Skipped {filepath} (unsupported file type)"
        
        # Parse filename
        file_info = parse_filename(filepath)
        if not file_info:
            return False, f"Skipped {filepath} (doesn't match naming convention)"
        
        # Read file content
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has metadata
        if has_metadata(content):
            return False, f"Skipped {filepath} (already has metadata)"
        
        # Generate metadata
        metadata = generate_metadata(file_info)
        if not metadata:
            return False, f"Skipped {filepath} (couldn't generate metadata)"
        
        # Insert metadata at the beginning of the file
        new_content = metadata + content
        
        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, f"Updated {filepath}"
        else:
            return True, f"Would update {filepath} (dry run)"
    
    except Exception as e:
        return False, f"Error processing {filepath}: {str(e)}"

def process_directory(directory, dry_run=False):
    """Process all files in a directory recursively."""
    results = {
        'updated': [],
        'skipped': [],
        'errors': []
    }
    
    for root, _, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            success, message = insert_metadata(filepath, dry_run)
            
            if success:
                results['updated'].append(message)
            elif message.startswith("Error"):
                results['errors'].append(message)
            else:
                results['skipped'].append(message)
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Insert metadata blocks into files based on naming convention')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying files')
    parser.add_argument('--directory', '-d', default='.', help='Directory to process (default: current directory)')
    
    args = parser.parse_args()
    
    print(f"{'DRY RUN: ' if args.dry_run else ''}Processing directory: {args.directory}")
    results = process_directory(args.directory, args.dry_run)
    
    print("\nSummary:")
    print(f"  Files that would be updated: {len(results['updated'])}")
    print(f"  Files skipped: {len(results['skipped'])}")
    print(f"  Errors: {len(results['errors'])}")
    
    if args.dry_run:
        print("\nThis was a dry run. No files were modified.")
    
    # Optionally output detailed results
    if results['updated']:
        print("\nUpdated files:")
        for msg in results['updated']:
            print(f"  {msg}")
    
    if results['errors']:
        print("\nErrors:")
        for msg in results['errors']:
            print(f"  {msg}")

if __name__ == "__main__":
    main()
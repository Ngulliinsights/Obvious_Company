#!/usr/bin/env python3

"""
Cross-Reference Section Generator Script

This script generates cross-reference sections within documents based on
relationship data from analyze_relationships.py.

Usage:
    python generate_cross_sections.py [--relationships FILE] [--dry-run] [--directory DIR]

Options:
    --relationships   Relationship data file (default: relationships.json)
    --dry-run         Preview changes without modifying files
    --directory       Specify the directory to process (default: current directory)
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict

# Cross-reference section templates
CROSS_REF_TEMPLATES = {
    "prerequisites": """## Prerequisites

*Documents you should read before this one:*

{links}
""",
    
    "related_resources": """## Related Resources

*Additional documents that complement this one:*

{links}
""",
    
    "implementation_examples": """## Implementation Examples

*Templates and examples that implement this framework:*

{links}
""",
    
    "next_steps": """## Next Steps

*Where to go after reading this document:*

{links}
""",
    
    "version_history": """## Version History

*Previous versions of this document:*

{links}
"""
}

def format_link(filepath, description=None):
    """Format a markdown link to a document."""
    filename = os.path.basename(filepath)
    name_parts = filename.split('_')
    
    # Extract a readable title from the filename
    if len(name_parts) >= 2:
        # Skip the prefix (CURR_, FRMK_, etc.)
        title_parts = []
        for part in name_parts[1:]:  # Skip the first part (document type)
            # Stop when we hit audience or version
            if part in ['EXEC', 'CONS', 'DEV', 'CLIENT', 'INT'] or part.startswith('v'):
                break
            title_parts.append(part)
        
        title = ' '.join(title_parts)
    else:
        title = os.path.splitext(filename)[0]
    
    # Format the title with proper capitalization
    title = ' '.join(word.capitalize() for word in title.split('_'))
    
    # Use the provided description if available
    if description:
        return f"- [{title}]({filepath}) - {description}"
    else:
        return f"- [{title}]({filepath})"

def generate_cross_sections(filepath, relationships, dry_run=False):
    """Generate cross-reference sections for a document based on relationships."""
    try:
        # Skip non-markdown files
        ext = os.path.splitext(filepath)[1].lower()
        if ext not in ['.md', '.markdown']:
            return False, f"Skipped {filepath} (not a markdown file)"
        
        # Read file content
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find relationships for this file
        dependencies = []
        implementations = []
        related_docs = []
        next_docs = []
        previous_versions = []
        
        for rel in relationships:
            if rel['source'] == filepath:
                if rel['type'] == 'dependency':
                    dependencies.append((rel['target'], rel.get('description', '')))
                elif rel['type'] == 'implementation':
                    implementations.append((rel['target'], rel.get('description', '')))
                elif rel['type'] in ['complementary', 'audience']:
                    related_docs.append((rel['target'], rel.get('description', '')))
                elif rel['type'] == 'next':
                    next_docs.append((rel['target'], rel.get('description', '')))
                elif rel['type'] == 'version' and rel['target'] != filepath:
                    previous_versions.append((rel['target'], 'Previous version'))
            
            # Also check target->source relationships
            elif rel['target'] == filepath:
                if rel['type'] == 'dependency':
                    next_docs.append((rel['source'], rel.get('description', '')))
                elif rel['type'] == 'implementation':
                    # If this document is implemented by another
                    implementations.append((rel['source'], rel.get('description', '')))
                elif rel['type'] in ['complementary', 'audience']:
                    related_docs.append((rel['source'], rel.get('description', '')))
                elif rel['type'] == 'version':
                    # This is an older version of another document
                    next_docs.append((rel['source'], 'Newer version'))
        
        # Check if we have any relationships to add
        if not any([dependencies, implementations, related_docs, next_docs, previous_versions]):
            return False, f"Skipped {filepath} (no relationships found)"
        
        # Generate sections
        new_sections = []
        
        # Prerequisites section
        if dependencies:
            links = '\n'.join(format_link(target, desc) for target, desc in dependencies)
            new_sections.append(CROSS_REF_TEMPLATES['prerequisites'].format(links=links))
        
        # Implementation Examples section
        if implementations:
            links = '\n'.join(format_link(target, desc) for target, desc in implementations)
            new_sections.append(CROSS_REF_TEMPLATES['implementation_examples'].format(links=links))
        
        # Related Resources section
        if related_docs:
            links = '\n'.join(format_link(target, desc) for target, desc in related_docs)
            new_sections.append(CROSS_REF_TEMPLATES['related_resources'].format(links=links))
        
        # Next Steps section
        if next_docs:
            links = '\n'.join(format_link(target, desc) for target, desc in next_docs)
            new_sections.append(CROSS_REF_TEMPLATES['next_steps'].format(links=links))
        
        # Version History section
        if previous_versions:
            links = '\n'.join(format_link(target, desc) for target, desc in previous_versions)
            new_sections.append(CROSS_REF_TEMPLATES['version_history'].format(links=links))
        
        # Combine all new sections
        cross_ref_content = '\n\n'.join(new_sections)
        
        # Check if the file already has cross-reference sections
        existing_sections = []
        for section_name in ['Prerequisites', 'Related Resources', 'Implementation Examples', 'Next Steps', 'Version History']:
            pattern = re.compile(f'^##\s*{section_name}', re.MULTILINE)
            if pattern.search(content):
                existing_sections.append(section_name)
        
        if existing_sections:
            # Replace existing sections or append new ones
            new_content = content
            for section_name in existing_sections:
                pattern = re.compile(f'^##\s*{section_name}.*?(?=^##|\Z)', re.MULTILINE | re.DOTALL)
                # Find the corresponding new section if it exists
                new_section = None
                if section_name == 'Prerequisites' and dependencies:
                    links = '\n'.join(format_link(target, desc) for target, desc in dependencies)
                    new_section = CROSS_REF_TEMPLATES['prerequisites'].format(links=links)
                elif section_name == 'Implementation Examples' and implementations:
                    links = '\n'.join(format_link(target, desc) for target, desc in implementations)
                    new_section = CROSS_REF_TEMPLATES['implementation_examples'].format(links=links)
                elif section_name == 'Related Resources' and related_docs:
                    links = '\n'.join(format_link(target, desc) for target, desc in related_docs)
                    new_section = CROSS_REF_TEMPLATES['related_resources'].format(links=links)
                elif section_name == 'Next Steps' and next_docs:
                    links = '\n'.join(format_link(target, desc) for target, desc in next_docs)
                    new_section = CROSS_REF_TEMPLATES['next_steps'].format(links=links)
                elif section_name == 'Version History' and previous_versions:
                    links = '\n'.join(format_link(target, desc) for target, desc in previous_versions)
                    new_section = CROSS_REF_TEMPLATES['version_history'].format(links=links)
                
                if new_section:
                    new_content = pattern.sub(new_section + '\n\n', new_content)
            
            # Append any new sections that didn't exist before
            existing_section_names = set(existing_sections)
            new_sections_to_append = []
            
            if 'Prerequisites' not in existing_section_names and dependencies:
                links = '\n'.join(format_link(target, desc) for target, desc in dependencies)
                new_sections_to_append.append(CROSS_REF_TEMPLATES['prerequisites'].format(links=links))
            
            if 'Implementation Examples' not in existing_section_names and implementations:
                links = '\n'.join(format_link(target, desc) for target, desc in implementations)
                new_sections_to_append.append(CROSS_REF_TEMPLATES['implementation_examples'].format(links=links))
            
            if 'Related Resources' not in existing_section_names and related_docs:
                links = '\n'.join(format_link(target, desc) for target, desc in related_docs)
                new_sections_to_append.append(CROSS_REF_TEMPLATES['related_resources'].format(links=links))
            
            if 'Next Steps' not in existing_section_names and next_docs:
                links = '\n'.join(format_link(target, desc) for target, desc in next_docs)
                new_sections_to_append.append(CROSS_REF_TEMPLATES['next_steps'].format(links=links))
            
            if 'Version History' not in existing_section_names and previous_versions:
                links = '\n'.join(format_link(target, desc) for target, desc in previous_versions)
                new_sections_to_append.append(CROSS_REF_TEMPLATES['version_history'].format(links=links))
            
            if new_sections_to_append:
                new_content += '\n\n' + '\n\n'.join(new_sections_to_append)
        else:
            # No existing sections, append all new sections at the end
            new_content = content + '\n\n' + cross_ref_content
        
        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, f"Updated {filepath} with cross-reference sections"
        else:
            return True, f"Would update {filepath} with cross-reference sections (dry run)"
    
    except Exception as e:
        return False, f"Error processing {filepath}: {str(e)}"

def process_directory(directory, relationships_file, dry_run=False):
    """Process all files in a directory recursively to add cross-reference sections."""
    results = {
        'updated': [],
        'skipped': [],
        'errors': []
    }
    
    # Load relationships data
    try:
        with open(relationships_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            relationships = data.get('relationships', [])
    except Exception as e:
        print(f"Error loading relationships file: {str(e)}")
        return results
    
    # Process each file
    for root, _, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            success, message = generate_cross_sections(filepath, relationships, dry_run)
            
            if success:
                results['updated'].append(message)
            elif message.startswith("Error"):
                results['errors'].append(message)
            else:
                results['skipped'].append(message)
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Generate cross-reference sections in documents')
    parser.add_argument('--relationships', '-r', default='relationships.json', help='Relationship data file')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying files')
    parser.add_argument('--directory', '-d', default='.', help='Directory to process (default: current directory)')
    
    args = parser.parse_args()
    
    print(f"{'DRY RUN: ' if args.dry_run else ''}Processing directory: {args.directory}")
    print(f"Using relationships from: {args.relationships}")
    
    results = process_directory(args.directory, args.relationships, args.dry_run)
    
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
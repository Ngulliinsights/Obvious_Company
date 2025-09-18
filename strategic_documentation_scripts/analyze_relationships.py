#!/usr/bin/env python3

"""
Document Relationship Analysis Script

This script analyzes document relationships based on naming convention and content,
then generates cross-reference links between related documents.

Usage:
    python analyze_relationships.py [--output FILE] [--directory DIR]

Options:
    --output        Output file for relationship data (default: relationships.json)
    --directory     Specify the directory to process (default: current directory)
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict

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

# Define relationship types
RELATIONSHIP_TYPES = [
    "dependency",      # Document A requires Document B
    "implementation",  # Framework A is implemented by Template B
    "audience",        # Executive doc A has corresponding consultant doc B
    "version",         # Document A is updated version of Document B
    "complementary"    # Document A and B work together but serve different functions
]

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
    version_number = None
    title_parts = []

    # Find audience and version
    for i, part in enumerate(name_parts[1:], 1):
        if part in AUDIENCES.keys():
            audience = part
            title_parts = name_parts[1:i]
        elif part.startswith('v'):
            version = part
            # Check if there's a version number after the version
            if i+1 < len(name_parts) and name_parts[i+1].isdigit():
                version_number = int(name_parts[i+1])
            if not audience and i > 1:
                audience = name_parts[i-1]
                title_parts = name_parts[1:i-1]

    if not title_parts:
        title_parts = name_parts[1:-2]  # Assume title is everything between type and audience

    title = '_'.join(title_parts)

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
        'version_number': version_number,
        'extension': extension,
        'filepath': filename
    }

def extract_metadata(filepath):
    """Extract existing YAML metadata from a file if present."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for YAML metadata block
        if content.startswith('---'):
            end_index = content.find('---', 3)
            if end_index > 0:
                yaml_block = content[3:end_index].strip()
                metadata = {}

                # Simple YAML parsing (for more complex YAML, use a proper YAML parser)
                for line in yaml_block.split('\n'):
                    line = line.strip()
                    if ':' in line and not line.startswith('#'):
                        key, value = line.split(':', 1)
                        metadata[key.strip()] = value.strip().strip('"\'')

                return metadata
    except Exception as e:
        print(f"Error extracting metadata from {filepath}: {str(e)}")

    return None

def analyze_content_relationships(filepath, all_files):
    """Analyze file content to find potential relationships with other documents."""
    relationships = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip YAML metadata block if present
        if content.startswith('---'):
            end_index = content.find('---', 3)
            if end_index > 0:
                content = content[end_index+3:]

        # Look for markdown links to other documents
        link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
        for match in link_pattern.finditer(content):
            link_text, link_target = match.groups()

            # Check if the link target is to a local file
            if not link_target.startswith(('http://', 'https://', 'ftp://')):
                # Normalize path
                link_path = os.path.normpath(os.path.join(os.path.dirname(filepath), link_target))

                # Check if this is a link to one of our known files
                for other_file in all_files:
                    if os.path.normpath(other_file) == link_path:
                        relationships.append({
                            'type': 'reference',
                            'target': other_file,
                            'context': link_text
                        })

        # Look for section headers that might indicate relationships
        prerequisite_pattern = re.compile(r'^#+\s*Prerequisites', re.MULTILINE)
        if prerequisite_pattern.search(content):
            # Extract links in the Prerequisites section
            section_match = prerequisite_pattern.search(content)
            section_start = section_match.start()
            section_end = len(content)

            # Find the next heading to determine section end
            next_heading = re.search(r'^#+\s', content[section_start+1:], re.MULTILINE)
            if next_heading:
                section_end = section_start + 1 + next_heading.start()

            section_content = content[section_start:section_end]
            for match in link_pattern.finditer(section_content):
                link_text, link_target = match.groups()

                # Normalize path
                if not link_target.startswith(('http://', 'https://', 'ftp://')):
                    link_path = os.path.normpath(os.path.join(os.path.dirname(filepath), link_target))

                    # Check if this is a link to one of our known files
                    for other_file in all_files:
                        if os.path.normpath(other_file) == link_path:
                            relationships.append({
                                'type': 'dependency',
                                'target': other_file,
                                'context': link_text
                            })

        # Similar checks for other relationship-indicating sections
        related_pattern = re.compile(r'^#+\s*Related\s+Resources', re.MULTILINE)
        implementation_pattern = re.compile(r'^#+\s*Implementation\s+Examples', re.MULTILINE)
        next_steps_pattern = re.compile(r'^#+\s*Next\s+Steps', re.MULTILINE)

        # Process each pattern similarly to the prerequisites pattern
        for pattern, rel_type in [
            (related_pattern, 'complementary'),
            (implementation_pattern, 'implementation'),
            (next_steps_pattern, 'next')
        ]:
            if pattern.search(content):
                section_match = pattern.search(content)
                section_start = section_match.start()
                section_end = len(content)

                next_heading = re.search(r'^#+\s', content[section_start+1:], re.MULTILINE)
                if next_heading:
                    section_end = section_start + 1 + next_heading.start()

                section_content = content[section_start:section_end]
                for match in link_pattern.finditer(section_content):
                    link_text, link_target = match.groups()

                    if not link_target.startswith(('http://', 'https://', 'ftp://')):
                        link_path = os.path.normpath(os.path.join(os.path.dirname(filepath), link_target))

                        for other_file in all_files:
                            if os.path.normpath(other_file) == link_path:
                                relationships.append({
                                    'type': rel_type,
                                    'target': other_file,
                                    'context': link_text
                                })

    except Exception as e:
        print(f"Error analyzing content relationships in {filepath}: {str(e)}")

    return relationships

def infer_relationships(files_info):
    """Infer relationships between documents based on naming convention and metadata."""
    relationships = []

    # Group files by title to find audience and version relationships
    title_groups = defaultdict(list)
    for file_info in files_info:
        if file_info['title']:
            title_groups[file_info['title']].append(file_info)

    # Analyze each group for relationships
    for title, group in title_groups.items():
        if len(group) > 1:
            # Sort by audience for audience relationships
            audience_groups = defaultdict(list)
            for file_info in group:
                if file_info['audience']:
                    audience_groups[file_info['audience']].append(file_info)

            # If we have multiple audiences for the same title, they're related
            if len(audience_groups) > 1:
                # Create audience relationships
                for audience1, files1 in audience_groups.items():
                    for audience2, files2 in audience_groups.items():
                        if audience1 != audience2:
                            for file1 in files1:
                                for file2 in files2:
                                    relationships.append({
                                        'source': file1['filepath'],
                                        'target': file2['filepath'],
                                        'type': 'audience',
                                        'description': f"Same content for different audiences: {AUDIENCES.get(audience1, audience1)} and {AUDIENCES.get(audience2, audience2)}"
                                    })

            # Sort by version for version relationships
            version_sorted = sorted(group, key=lambda x: (x.get('version') or '', x.get('version_number') or 0))
            if len(version_sorted) > 1:
                # Create version relationships (newer supersedes older)
                for i in range(len(version_sorted) - 1):
                    older = version_sorted[i]
                    newer = version_sorted[i + 1]
                    relationships.append({
                        'source': newer['filepath'],
                        'target': older['filepath'],
                        'type': 'version',
                        'description': f"Newer version supersedes older version"
                    })

    # Infer implementation relationships between frameworks and templates/guides
    frameworks = [f for f in files_info if f['doc_type'] == 'FRMK']
    templates = [t for t in files_info if t['doc_type'] == 'TMPL']
    guides = [g for g in files_info if g['doc_type'] == 'GUID']

    for framework in frameworks:
        # Look for templates that might implement this framework
        framework_title = framework['title'].lower()
        for template in templates:
            template_title = template['title'].lower()
            # Check for title similarity or if template references framework in title
            if (framework_title in template_title or
                any(word in template_title for word in framework_title.split('_'))):
                relationships.append({
                    'source': framework['filepath'],
                    'target': template['filepath'],
                    'type': 'implementation',
                    'description': f"Framework implemented by template"
                })

        # Look for guides that might be related to this framework
        for guide in guides:
            guide_title = guide['title'].lower()
            # Check for title similarity
            if (framework_title in guide_title or
                any(word in guide_title for word in framework_title.split('_'))):
                relationships.append({
                    'source': framework['filepath'],
                    'target': guide['filepath'],
                    'type': 'complementary',
                    'description': f"Framework complemented by guide"
                })

    return relationships

def process_directory(directory):
    """Process all files in a directory recursively to analyze relationships."""
    all_files = []
    files_info = []

    # First pass: collect all files and basic info
    for root, _, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Skip non-document files
            ext = os.path.splitext(filepath)[1].lower()
            if ext not in ['.md', '.markdown', '.html', '.js', '.ts', '.json']:
                continue

            all_files.append(filepath)
            file_info = parse_filename(filepath)
            if file_info:
                files_info.append(file_info)

    # Second pass: analyze content relationships
    content_relationships = []
    for filepath in all_files:
        relationships = analyze_content_relationships(filepath, all_files)
        for rel in relationships:
            content_relationships.append({
                'source': filepath,
                'target': rel['target'],
                'type': rel['type'],
                'description': rel['context']
            })

    # Third pass: infer relationships based on naming convention
    inferred_relationships = infer_relationships(files_info)

    # Combine all relationships
    all_relationships = content_relationships + inferred_relationships

    # Create a structured result
    result = {
        'files': files_info,
        'relationships': all_relationships
    }

    return result

def main():
    parser = argparse.ArgumentParser(description='Analyze document relationships')
    parser.add_argument('--output', '-o', default='relationships.json', help='Output file for relationship data')
    parser.add_argument('--directory', '-d', default='.', help='Directory to process (default: current directory)')

    args = parser.parse_args()

    print(f"Processing directory: {args.directory}")
    results = process_directory(args.directory)

    # Save results to JSON file
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"\nAnalysis complete. Results saved to {args.output}")
    print(f"  Files analyzed: {len(results['files'])}")
    print(f"  Relationships found: {len(results['relationships'])}")

    # Print relationship type summary
    rel_types = defaultdict(int)
    for rel in results['relationships']:
        rel_types[rel['type']] += 1

    print("\nRelationship types:")
    for rel_type, count in rel_types.items():
        print(f"  {rel_type}: {count}")

if __name__ == "__main__":
    main()

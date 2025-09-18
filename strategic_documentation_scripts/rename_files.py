#!/usr/bin/env python3

import os
import re
import json
from datetime import datetime
from collections import defaultdict

# Configuration
import os
ROOT_DIR = os.path.join(os.path.dirname(__file__), '..')

# Define document type prefixes
DOC_TYPE_PREFIXES = {
    'curriculum': 'CURR_',
    'framework': 'FRMK_',
    'template': 'TMPL_',
    'guide': 'GUID_',
    'presentation': 'PRES_',
    'strategic': 'STRAT_',
    'audit': 'STRAT_',  # Audits are strategic documents
    'assessment': 'STRAT_',  # Assessments are strategic documents
    'analysis': 'STRAT_',  # Analysis documents are strategic
    'pitch': 'PRES_',  # Pitches are presentations
}

# Define audience indicators
AUDIENCE_INDICATORS = {
    'executive': '_EXEC',
    'consultant': '_CONS',
    'developer': '_DEV',
    'client': '_CLIENT',
    'internal': '_INT',
}

# Define version/date suffixes
VERSION_SUFFIXES = {
    'latest': '_LATEST',
    'draft': '_DRAFT',
    'v2024': '_v2024',  # Current year
}

# Keywords for document type detection
DOC_TYPE_KEYWORDS = {
    'curriculum': ['curriculum', 'course', 'training', 'workshop', 'education', 'learning'],
    'framework': ['framework', 'system', 'architecture', 'structure', 'model'],
    'template': ['template', 'boilerplate', 'starter', 'sample'],
    'guide': ['guide', 'manual', 'instruction', 'handbook', 'tutorial', 'how-to'],
    'presentation': ['presentation', 'pitch', 'slide', 'deck', '.html'],
    'strategic': ['strategic', 'strategy', 'plan', 'roadmap', 'vision'],
    'audit': ['audit', 'assessment', 'evaluation', 'review'],
    'analysis': ['analysis', 'research', 'study', 'investigation', 'examination'],
}

# Keywords for audience detection
AUDIENCE_KEYWORDS = {
    'executive': ['executive', 'leadership', 'management', 'c-suite', 'ceo', 'cto', 'cfo', 'decision-maker'],
    'consultant': ['consultant', 'advisor', 'expert', 'specialist', 'professional'],
    'developer': ['developer', 'engineer', 'programmer', 'coder', 'technical', 'implementation'],
    'client': ['client', 'customer', 'external', 'prospect', 'partner'],
    'internal': ['internal', 'team', 'staff', 'employee', 'organization'],
}

# Files to exclude from renaming
EXCLUDE_FILES = [
    'README.md',
    'LICENSE',
    '.gitignore',
    'package.json',
    'package-lock.json',
    'rename_files.py',
    'file_mapping.json',
    'manual_review.txt',
]

# Directories to exclude from renaming
EXCLUDE_DIRS = [
    '.git',
    'node_modules',
    '.github',
    '.vscode',
    '.husky',
    'netlify',
    'tests',
]

# Function to determine document type from filename and content
def determine_doc_type(filename, content=''):
    filename_lower = filename.lower()
    content_lower = content.lower() if content else ''

    # Check for HTML files (likely presentations)
    if filename_lower.endswith('.html'):
        return 'presentation'

    # Check filename for type indicators
    for doc_type, keywords in DOC_TYPE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in filename_lower:
                return doc_type

    # Check content for type indicators if available
    if content:
        for doc_type, keywords in DOC_TYPE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in content_lower:
                    return doc_type

    # Default to strategic if we can't determine
    return 'strategic'

# Function to determine audience from filename and content
def determine_audience(filename, content=''):
    filename_lower = filename.lower()
    content_lower = content.lower() if content else ''

    # Check filename for audience indicators
    for audience, keywords in AUDIENCE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in filename_lower:
                return audience

    # Check content for audience indicators if available
    if content:
        for audience, keywords in AUDIENCE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in content_lower[:500]:  # Check first 500 chars for efficiency
                    return audience

    # Check if it's in a directory that indicates audience
    if 'company_materials' in filename_lower or '05_company_materials' in filename_lower:
        return 'internal'
    if 'presentations' in filename_lower or 'pitches' in filename_lower or '08_presentations' in filename_lower:
        return 'client'

    # Default to consultant if we can't determine
    return 'consultant'

# Function to extract descriptive content focus from filename and content
def extract_content_focus(filename, content=''):
    # Remove file extension
    base_name = os.path.splitext(os.path.basename(filename))[0]

    # Remove common prefixes and suffixes
    cleaned_name = re.sub(r'^(ai_|refined_|enhanced_|unified_|optimized_|strategic_)', '', base_name)
    cleaned_name = re.sub(r'(_framework|_guide|_curriculum|_template|_analysis)$', '', cleaned_name)

    # Replace underscores with spaces and capitalize words
    words = cleaned_name.split('_')
    capitalized_words = [word.capitalize() for word in words]

    # Join words with underscores for the new filename format
    content_focus = '_'.join(capitalized_words)

    # If content focus is too short, try to extract from content
    if len(content_focus) < 3 and content:
        # Try to extract title from markdown or HTML
        title_match = re.search(r'#\s+(.+?)\n', content) or re.search(r'<title>(.+?)</title>', content)
        if title_match:
            title = title_match.group(1)
            # Clean up the title
            title = re.sub(r'[:\-|].*$', '', title).strip()  # Remove subtitles
            title = re.sub(r'(Framework|Guide|Curriculum|Template|Analysis)\b', '', title, flags=re.IGNORECASE).strip()
            # Convert to underscore format
            words = re.findall(r'\w+', title)
            content_focus = '_'.join([word.capitalize() for word in words])

    return content_focus

# Function to determine version suffix
def determine_version(filename, content=''):
    filename_lower = filename.lower()
    content_lower = content.lower() if content else ''

    # Check for draft indicators
    if 'draft' in filename_lower or 'draft' in content_lower[:500]:
        return VERSION_SUFFIXES['draft']

    # Check for version numbers in filename
    version_match = re.search(r'v(\d{4})', filename_lower)
    if version_match:
        year = version_match.group(1)
        return f'_v{year}'

    # Default to current year
    current_year = datetime.now().year
    return f'_v{current_year}'

# Function to generate new filename based on conventions
def generate_new_filename(old_path, content=''):
    filename = os.path.basename(old_path)
    extension = os.path.splitext(filename)[1]

    # Skip excluded files
    if filename in EXCLUDE_FILES:
        return None

    # Determine document type
    doc_type = determine_doc_type(filename, content)
    doc_prefix = DOC_TYPE_PREFIXES.get(doc_type, 'STRAT_')  # Default to STRAT if not found

    # Determine audience
    audience = determine_audience(filename, content)
    audience_suffix = AUDIENCE_INDICATORS.get(audience, '_CONS')  # Default to consultant

    # Extract content focus
    content_focus = extract_content_focus(filename, content)

    # Determine version
    version_suffix = determine_version(filename, content)

    # Construct new filename
    new_filename = f"{doc_prefix}{content_focus}{audience_suffix}{version_suffix}{extension}"

    return new_filename

# Function to handle duplicate filenames
def handle_duplicates(new_filenames):
    # Count occurrences of each new filename
    filename_counts = defaultdict(int)
    for old_path, new_filename in new_filenames.items():
        if new_filename:
            filename_counts[new_filename] += 1

    # Add suffixes to duplicates
    resolved_filenames = {}
    filename_indices = defaultdict(int)

    for old_path, new_filename in new_filenames.items():
        if not new_filename:
            resolved_filenames[old_path] = None
            continue

        if filename_counts[new_filename] > 1:
            # This is a duplicate, add a suffix
            filename_indices[new_filename] += 1
            base, ext = os.path.splitext(new_filename)
            resolved_filenames[old_path] = f"{base}_{filename_indices[new_filename]}{ext}"
        else:
            # Not a duplicate
            resolved_filenames[old_path] = new_filename

    return resolved_filenames

# Function to generate rename commands
def generate_rename_commands(file_mapping):
    commands = []
    for old_path, new_filename in file_mapping.items():
        if new_filename:
            new_path = os.path.join(os.path.dirname(old_path), new_filename)
            # For Windows PowerShell
            commands.append(f'Rename-Item -Path "{old_path}" -NewName "{new_filename}"')

    return commands

# Main function to process files
def main():
    file_mapping = {}
    manual_review = []

    # Walk through directory structure
    for root, dirs, files in os.walk(ROOT_DIR):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for filename in files:
            # Skip excluded files and non-content files
            if filename in EXCLUDE_FILES or filename.startswith('.'):
                continue

            # Skip files with extensions we don't want to rename
            _, ext = os.path.splitext(filename)
            if ext.lower() not in ['.md', '.html', '.txt', '.js', '.ts', '.css', '.json']:
                continue

            file_path = os.path.join(root, filename)

            # Try to read file content for better classification
            content = ''
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    # Read first 1000 characters for classification
                    content = f.read(1000)
            except Exception:
                # If we can't read the file, just use the filename
                pass

            # Generate new filename
            new_filename = generate_new_filename(file_path, content)

            if new_filename:
                file_mapping[file_path] = new_filename
            else:
                manual_review.append(file_path)

    # Handle duplicate filenames
    file_mapping = handle_duplicates(file_mapping)

    # Generate rename commands
    commands = generate_rename_commands(file_mapping)

    # Write mapping file
    with open(os.path.join(os.path.dirname(__file__), 'file_mapping.json'), 'w', encoding='utf-8') as f:
        json.dump({old: new for old, new in file_mapping.items() if new}, f, indent=2)

    # Write commands to file
    with open(os.path.join(os.path.dirname(__file__), 'rename_commands.ps1'), 'w', encoding='utf-8') as f:
        f.write("# PowerShell rename commands\n")
        f.write("# Generated on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
        f.write("# Set working directory\n")
        f.write(f"Set-Location -Path \"{ROOT_DIR}\"\n\n")
        f.write("# Rename commands\n")
        for cmd in commands:
            f.write(cmd + "\n")

    # Write files that need manual review
    with open(os.path.join(os.path.dirname(__file__), 'manual_review.txt'), 'w', encoding='utf-8') as f:
        f.write("# Files that need manual review\n")
        f.write("# Generated on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
        for file_path in manual_review:
            f.write(file_path + "\n")

    print(f"Processed {len(file_mapping)} files")
    print(f"Generated {len(commands)} rename commands")
    print(f"Flagged {len(manual_review)} files for manual review")
    print("\nOutputs:")
    print(f"1. Rename commands: {os.path.join(os.path.dirname(__file__), 'rename_commands.ps1')}")
    print(f"2. File mapping: {os.path.join(os.path.dirname(__file__), 'file_mapping.json')}")
    print(f"3. Manual review list: {os.path.join(os.path.dirname(__file__), 'manual_review.txt')}")

if __name__ == "__main__":
    main()

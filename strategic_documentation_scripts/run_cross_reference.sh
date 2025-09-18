#!/bin/bash

echo "Cross-Reference System Generation"
echo "==============================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/"
PROJECT_DIR="${SCRIPT_DIR}.."

echo "Step 1: Inserting metadata blocks into files..."
echo "---------------------------------------"
python3 "${SCRIPT_DIR}insert_metadata.py" --directory "${PROJECT_DIR}" --dry-run

echo ""
echo "Would you like to proceed with inserting metadata? (y/n)"
read -r CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    python3 "${SCRIPT_DIR}insert_metadata.py" --directory "${PROJECT_DIR}"
    echo "Metadata insertion complete."
else
    echo "Metadata insertion skipped."
fi

echo ""
echo "Step 2: Analyzing document relationships..."
echo "---------------------------------------"
python3 "${SCRIPT_DIR}analyze_relationships.py" --directory "${PROJECT_DIR}" --output "${SCRIPT_DIR}relationships.json"
echo "Relationship analysis complete."

echo ""
echo "Step 3: Generating cross-reference sections..."
echo "---------------------------------------"
python3 "${SCRIPT_DIR}generate_cross_sections.py" --relationships "${SCRIPT_DIR}relationships.json" --directory "${PROJECT_DIR}" --dry-run

echo ""
echo "Would you like to proceed with adding cross-reference sections? (y/n)"
read -r CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    python3 "${SCRIPT_DIR}generate_cross_sections.py" --relationships "${SCRIPT_DIR}relationships.json" --directory "${PROJECT_DIR}"
    echo "Cross-reference section generation complete."
else
    echo "Cross-reference section generation skipped."
fi

echo ""
echo "Cross-reference system setup complete!"
echo ""
echo "The following files have been created or updated:"
echo "- Metadata blocks added to markdown files"
echo "- relationships.json containing document relationships"
echo "- Cross-reference sections added to markdown files"
echo ""
echo "You can find the centralized navigation files in the cross_reference_templates directory:"
echo "- DOCUMENT_INDEX.md: Master document index"
echo "- WORKFLOW_NAVIGATION.md: Workflow-based navigation"
echo "- AUDIENCE_NAVIGATION.md: Audience-based navigation"

echo ""
echo "Press Enter to continue..."
read -r
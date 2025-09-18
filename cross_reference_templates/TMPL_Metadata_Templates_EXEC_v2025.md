---
title: "Metadata templates"
type: "template"
audience: "executives"
version: "v2025.md"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

# Metadata Block Templates

This document contains YAML metadata block templates for different document types in the repository. These templates should be added at the top of each document to establish cross-references and relationships.

## Curriculum Document Template

```yaml
---
title: "[Document Title]"
type: "curriculum"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
dependencies:
  - "[path/to/required/document.md]"
  - "[path/to/optional/reference.md]"
implementations:
  - "[path/to/template/based/on/this.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Framework Document Template

```yaml
---
title: "[Document Title]"
type: "framework"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
dependencies:
  - "[path/to/required/document.md]"
  - "[path/to/optional/reference.md]"
implementations:
  - "[path/to/template/based/on/this.md]"
  - "[path/to/example/implementation.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Guide Document Template

```yaml
---
title: "[Document Title]"
type: "guide"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
dependencies:
  - "[path/to/required/document.md]"
  - "[path/to/optional/reference.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Template Document Template

```yaml
---
title: "[Document Title]"
type: "template"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
based_on:
  - "[path/to/framework/document.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Presentation Document Template

```yaml
---
title: "[Document Title]"
type: "presentation"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
based_on:
  - "[path/to/framework/document.md]"
  - "[path/to/guide/document.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Strategic Document Template

```yaml
---
title: "[Document Title]"
type: "strategic"
audience: "[executives|consultants|developers|clients|internal]"
version: "v2025.1"
dependencies:
  - "[path/to/required/document.md]"
  - "[path/to/optional/reference.md]"
implementations:
  - "[path/to/template/based/on/this.md]"
related_docs:
  - "[path/to/complementary/doc.md]"
supersedes: "[path/to/old/version.md]"
tags:
  - "[relevant tag 1]"
  - "[relevant tag 2]"
---
```

## Usage Instructions

1. Copy the appropriate template based on your document type
2. Replace placeholder values with actual information
3. Add the YAML block at the very top of your document
4. Ensure all paths are relative to the repository root
5. Use the tags field to add relevant keywords for search functionality

## Implementation Examples

*Templates and examples that implement this framework:*

- [Meta cognitive](.\04_Funding_and_Business_Development\FRMK_Meta_Cognitive_CONS_v2025.md) - Framework implemented by template
- [Meta cognitive framework (1)](.\04_Funding_and_Business_Development\FRMK_Meta_Cognitive_Framework (1)_CONS_v2025.md) - Framework implemented by template

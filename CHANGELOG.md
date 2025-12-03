# Changelog

## [1.1.0] - 2025-12-03

### Added
- **MobileBasic Fallback**: Automatic fallback to mobilebasic endpoint when standard Google Drive API export fails
  - Works with permission-restricted documents (view-only access)
  - Server-side HTML-to-Markdown conversion (no browser required)
  - Preserves formatting: headers, bold, italic, lists, links, blockquotes
  - No additional dependencies required
- New parameter: "Use MobileBasic Fallback" (enabled by default)
- Output includes `usedFallback` boolean flag to indicate which method was used

### Changed
- Export format now shows `text/markdown (via mobilebasic)` when fallback is used
- Improved error messages with suggestions to enable fallback when applicable

### Technical Details
- Added `convertHtmlToMarkdown()` function for HTML-to-Markdown conversion
- Added `fetchMobileBasicContent()` function for mobilebasic endpoint access
- Try-catch logic: attempts standard API first, falls back to mobilebasic if enabled
- Fallback only applies to Google Docs (not Sheets/Slides)

### Limitations
- Mobilebasic fallback returns Markdown without images (images not available in mobilebasic HTML)
- Fallback cannot be disabled by Google Workspace administrators (based on research)

## [1.0.2] - Previous Release
- Initial stable release with metadata and content export
- Support for Google Docs, Sheets, and Slides
- Markdown export with optional image extraction

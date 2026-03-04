# Choose Your Own Adventure (CYOA)

A modern, interactive choose-your-own-adventure web application built with vanilla JavaScript, HTML, and CSS. No build step required.

## Features

- **Single Page Application (SPA)** with hash-based routing for GitHub Pages compatibility
- **Shared Header Component** with navigation and audio controls across all pages
- **Home Page** with story selection using invisible table layout
- **Story Reader** with chapter-based navigation
- **Admin Page** with markdown editor and real-time syntax validation
- **Background Music Controls** with per-story music support
- **Modular Architecture** using ES modules with zero global namespace pollution
- **Responsive CSS** for various screen sizes

## Project Structure

```
cyoa/
├── index.html                 # Main entry point
├── css/
│   ├── style.css              # CSS entrypoint (imports modules)
│   ├── theme.css
│   ├── base.css
│   ├── header.css
│   ├── home.css
│   ├── story.css
│   ├── admin.css
│   └── admin-markdown.css
├── js/
│   ├── app.js                # Main application entry point
│   ├── router.js             # Hash-based routing system
│   ├── components/
│   │   └── header.js         # Shared header component
│   ├── pages/
│   │   ├── home.js           # Homepage component
│   │   ├── story.js          # Story reader component
│   │   └── admin.js          # Admin/editor component
│   └── utils/
│       └── storyParser.js    # Markdown parser and validator
├── assets/
│   ├── stories/              # Story chapter markdown files + metadata
│   │   ├── metadata.json     # Story metadata for home/admin lists
│   │   ├── story-1.md
│   │   ├── story-2.md
│   │   └── ...
│   └── music/
│       ├── tracks.json       # Music track manifest
│       └── *.mp3             # Main background music tracks
└── README.md                 # This file
```

## Story File Format

Stories are written in Markdown with a specific structure:

```markdown
## Chapter 1
### Title
The chapter title text

### Content
The chapter narrative content. This is where you describe the scene, provide context, and set up the choices.

### Choices
1. First option text -> 2
2. Second option text -> 3

## Chapter 2
### Title
Next chapter title

### Content
Next chapter content...

### Choices
The End
```

### Format Rules

- Story must begin with a single top-level heading: `# Story Title`
- Each chapter starts with `## Chapter N` (where N is a number)
- Each chapter must have exactly three subsections:
  - `### Title` - The chapter's title
  - `### Content` - The narrative text
  - `### Choices` - Numbered list of choices or `The End`
- Choices can be either:
  - Numbered list format: `1. Choice text -> ChapterNumber`
  - A single line: `The End`
- Chapter headings must be in ascending order; first chapter must be `## Chapter 1`
- Choice numbers must be ascending starting from 1
- Each choice target must reference an existing chapter and cannot reference itself
- All sections must be present in every chapter

## Usage

### Running the App

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Navigate using hash routes:
    - `#/` - Homepage
    - `#/story/1` - Story 1
    - `#/story/1/1` - Story 1, Chapter 1
    - `#/admin` - Admin editor page

### Navigation

- **Header Title**: Click the title or epic emoji (📖) to return to the homepage
- **Story Selection**: On the homepage, click "Launch" buttons to start stories
- **Chapter Navigation**: In stories, click choice links to navigate chapters
- **Audio Control**: Click the speaker icon in the header to toggle background music

### Admin Page

The admin page allows you to:

1. **View Expected Format**: See a complete example of proper story markdown
2. **Load Stories**: Select an existing story to edit
3. **Edit Content**: Modify story markdown in the textarea
4. **Validate Syntax**: Click "Validate Syntax" to check for errors
5. **Error Feedback**: Get detailed error messages if syntax is invalid

#### Validation Checks

The parser validates:
- Story starts with one top-level title (`# Story Title`)
- Proper chapter heading format (`## Chapter N`)
- Chapter headings in ascending order (first chapter is 1)
- Presence of all three subsections per chapter
- No duplicate section headings within a chapter
- Valid choices section: numbered list or `The End`
- Valid choice format (`1. text -> N`) when list-based
- All referenced chapters exist and are not self-referential
- Non-empty content in required sections

## Technical Details

### Architecture

- **No external dependencies** - All code is vanilla JavaScript ES modules
- **Functional programming style** - Components and utilities are pure functions where possible
- **Module isolation** - Each component is a self-contained module
- **Event-driven** - Components communicate through events and data passing
- **No global state** - All state is local to components or passed as parameters

### Key Modules

#### `router.js`
Hash-based router supporting parameterized routes. Handles navigation and route matching.

```javascript
createRouter(routes) // Returns navigate(), render(), getCurrentRoute()
```

#### `header.js`
Shared header component with navigation and audio controls.

```javascript
createHeader(onNavigateHome) // Returns mount(), updateAudioButton()
```

#### `storyParser.js`
Markdown parser with validation. Throws descriptive errors for invalid formats.

```javascript
parseStory(markdown)           // Returns { [chapterNum]: chapter }
getValidationExample()         // Returns example markdown
```

#### `home.js`, `story.js`, `admin.js`
Page components that return HTML strings. Mounted via router.

### Styling

- **CSS Custom Properties** for easy theming
- **Responsive layout** supporting mobile and desktop
- **Accessible button styling** with hover states
- **Semantic HTML** for proper accessibility

## Audio Assets

To add background music:

1. Place MP3 files in `assets/music/`
2. Add each filename to `assets/music/tracks.json`

The audio control in the header manages the shared main audio player used across the app.

## Browser Compatibility

Works in all modern browsers supporting:
- ES modules (no transpilation needed)
- Fetch API
- CSS Grid and Flexbox
- Audio API

## License

Public domain - use and modify as needed.

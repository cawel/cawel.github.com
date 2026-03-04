# Choose Your Own Adventure (CYOA)

A modern, interactive choose-your-own-adventure web application built with vanilla JavaScript, HTML, and CSS. No build step required. Hash-based routing for GitHub Pages deployment.

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
│   └── style.css             # All styling
├── js/
│   ├── app.js                # Main application entry point
│   ├── router.js             # Hash-based routing system
│   ├── components/
│   │   └── header.js         # Shared header component
│   ├── pages/
│   │   ├── home.js           # Homepage component
│   │   ├── story.js          # Story reader component
│   │   └── admin.js          # Admin/editor component
│   ├── data/
│   │   ├── stories-metadata.json # Story metadata for home/admin lists
│   │   └── stories/          # Story chapter markdown files
│   │       ├── story-1.md
│   │       ├── story-2.md
│   │       └── ...
│   └── utils/
│       └── storyParser.js    # Markdown parser and validator
├── music/
│   ├── tracks.json           # Music track manifest
│   └── *.mp3                 # Main background music tracks
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
1. Choice text -> 4
2. Another choice -> 5
```

### Format Rules

- Each chapter starts with `## Chapter N` (where N is a number)
- Each chapter must have exactly three subsections:
  - `### Title` - The chapter's title
  - `### Content` - The narrative text
  - `### Choices` - Numbered list of reader choices
- Choices follow the format: `1. Choice text -> ChapterNumber`
- Chapter numbers must be sequential starting from 1
- Each choice must reference an existing chapter
- All sections must be present in every chapter (even the last chapter, which may loop back)

## Usage

### Running the App

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Navigate using hash routes:
   - `#/` - Homepage
   - `#/story/1` - Story 1
   - `#/story/2` - Story 2
   - `#/story/3` - Story 3
   - `#/admin` - Admin editor page

### Navigation

- **Header Title**: Click the title or epic emoji (📖) to return to the homepage
- **Story Selection**: On the homepage, click "Launch" buttons to start stories
- **Chapter Navigation**: In stories, click choice links to navigate chapters
- **Audio Control**: Click the speaker icon in the header to toggle background music

### Admin Page

The admin page allows you to:

1. **View Expected Format**: See a complete example of proper story markdown
2. **Load Stories**: Select an existing story (1-3) to edit
3. **Edit Content**: Modify story markdown in the textarea
4. **Validate Syntax**: Click "Validate Syntax" to check for errors
5. **Error Feedback**: Get detailed error messages if syntax is invalid

#### Validation Checks

The parser validates:
- Proper chapter heading format (`## Chapter N`)
- Sequential chapter numbers starting from 1
- Presence of all three subsections per chapter
- Valid choice format (`1. text -> N`)
- All referenced chapters exist
- Non-empty content in all sections

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

## GitHub Pages Deployment

To deploy on GitHub Pages:

1. Push this repository to your GitHub account
2. Navigate to repository **Settings** → **Pages**
3. Set source to the branch containing this code
4. Enable GitHub Pages
5. Access your site at `https://yourusername.github.io/cyoa`

**Note**: All asset paths use relative URLs (no leading `/`), so the app works from any subdirectory.

## Audio Assets

To add background music:

1. Place MP3 files in `music/`
2. Add each filename to `music/tracks.json`

The audio control in the header manages the shared main audio player used across the app.

## Browser Compatibility

Works in all modern browsers supporting:
- ES modules (no transpilation needed)
- Fetch API
- CSS Grid and Flexbox
- Audio API

## Future Enhancements

Potential additions without breaking the "no build step" principle:

- Auto-save draft stories to localStorage
- Export stories as JSON or plain text
- Reader statistics and analytics
- Custom color themes
- Keyboard controls for navigation
- Accessibility improvements (ARIA labels, focus management)
- Responsive image support for stories

## License

Public domain - use and modify as needed.

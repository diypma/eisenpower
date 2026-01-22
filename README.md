# Eisenpower

A beautiful, interactive Eisenhower Matrix task management application built with React and Tailwind CSS.

![Eisenpower](https://img.shields.io/badge/React-18-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan) ![Vite](https://img.shields.io/badge/Vite-6-purple)

## 🎯 Features

### Core Functionality
- **Eisenhower Matrix Grid** - Visual 2D task positioning based on Urgency (X-axis) and Importance (Y-axis)
- **Priority Scoring** - Automatic scoring: `(Importance × 60%) + (Urgency × 40%)`
- **Subtask Management** - Create nested subtasks with completion tracking
- **Subtask Extraction** - Drag subtasks from task details onto the grid for independent prioritization

### User Experience
- **Drag & Drop** - Intuitive task repositioning with mouse and touch support
- **Click to Add** - Click anywhere on the grid to create a new task at that position
- **Dark/Light Theme** - Full dark mode support with smooth transitions
- **Mobile Responsive** - Tabbed interface for mobile devices with bottom navigation
- **Zoom Controls** - Scale the grid for dense task layouts (appears when >5 tasks)

### Data Management
- **LocalStorage Persistence** - Tasks and theme saved automatically
- **JSON Backup/Restore** - Export tasks to JSON for cross-device sync via iCloud/cloud storage
- **Text Export** - Human-readable task list export

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/diypma/eisenpower.git
cd eisenpower

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
eisenpower/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles & Tailwind config
│   ├── components/
│   │   ├── GraphPaper.jsx   # Eisenhower Matrix grid
│   │   ├── TaskNode.jsx     # Draggable task card
│   │   ├── TaskModal.jsx    # New task creation modal
│   │   ├── TaskDetailModal.jsx  # Task detail/edit modal
│   │   ├── PriorityPanel.jsx    # Sorted task list sidebar
│   │   └── SettingsMenu.jsx     # Settings dropdown
│   └── utils/
│       └── colorUtils.js    # Task color generation
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎨 Design Philosophy

### Priority Calculation
Tasks are scored using a weighted formula:
- **Importance**: 60% weight (Y-axis position)
- **Urgency**: 40% weight (X-axis position)

### Quadrant System (Eisenhower Matrix)
| Quadrant | Description | Action |
|----------|-------------|--------|
| Top-Right | High Urgency + High Importance | **Do First** |
| Top-Left | Low Urgency + High Importance | **Schedule** |
| Bottom-Right | High Urgency + Low Importance | **Delegate** |
| Bottom-Left | Low Urgency + Low Importance | **Eliminate** |

### Color Coding
- Task cards use gradient colors based on priority score
- Each task family has a unique accent color (golden angle distribution)
- Subtasks inherit their parent's accent color for visual grouping

## 🔧 Configuration

### Theme
Theme preference is stored in `localStorage` under `eisenpower-theme`.

### Task Data
Tasks are persisted to `localStorage` under `eisenpower-tasks` as JSON.

Task schema:
```javascript
{
  id: number,
  text: string,
  x: number,        // 0-100 (urgency)
  y: number,        // 0-100 (importance)
  completed?: boolean,
  completedAt?: string,  // ISO date
  subtasks: [
    {
      id: number,
      text: string,
      completed: boolean,
      x?: number,   // If positioned on grid
      y?: number
    }
  ]
}
```

## 📱 Mobile Support

On mobile devices:
- Bottom navigation bar switches between Matrix and List views
- Touch-friendly drag and drop
- Viewport configured to prevent zoom on input focus
- Safe area handling for notched devices

## 🔄 Data Sync (Manual)

Since the app is client-side only, sync between devices using:

1. **Backup** - Settings → Backup Tasks → Save `.json` to iCloud Drive / cloud storage
2. **Restore** - Settings → Restore Tasks → Select `.json` file

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with:
- [React](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Vite](https://vite.dev/)
- [Inter Font](https://rsms.me/inter/)

---

Made with ❤️ by [diypma](https://github.com/diypma)

/**
 * GraphPaper.jsx - Eisenhower Matrix Grid Component
 * 
 * Renders the interactive 2D grid for task positioning.
 * X-axis represents Urgency (0-100, left to right)
 * Y-axis represents Importance (0-100, bottom to top)
 * 
 * Features:
 * - Click anywhere to add a new task at that position
 * - Drag-and-drop support for subtask extraction
 * - Zoomable grid for dense task layouts
 * - Quadrant labels (Do First, Schedule, Delegate, Eliminate)
 * - Responsive design for mobile/desktop
 */

import React, { useRef } from 'react'

export default function GraphPaper({ onAddTask, onDrop, zoom = 1, onZoomChange, children }) {
    const containerRef = useRef(null)

    // ==========================================================================
    // DRAG AND DROP HANDLERS
    // ==========================================================================

    /**
     * Allow drag-over to enable dropping
     */
    const handleDragOver = (e) => {
        e.preventDefault()
    }

    /**
     * Handle dropping items onto the grid
     * Used for extracting subtasks from the detail modal to the grid
     */
    const handleDrop = (e) => {
        e.preventDefault()
        if (!onDrop) return

        // Calculate position as percentage (0-100)
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100

        // Parse dropped data (subtask extraction)
        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) {
                const data = JSON.parse(json)
                onDrop(x, y, data)
            }
        } catch (err) {
            console.error('Drop parse error:', err)
        }
    }

    // ==========================================================================
    // CLICK HANDLER
    // ==========================================================================

    /**
     * Handle clicks on the grid to add new tasks
     * Distinguishes between clicks on tasks vs empty grid space
     */
    const handleClick = (e) => {
        // Get coordinates (handle both mouse and touch events)
        let clientX, clientY

        if (e.type === 'touchend') {
            clientX = e.changedTouches[0].clientX
            clientY = e.changedTouches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        // Ignore clicks on tasks or buttons
        if (e.target.closest('.task-node') || e.target.closest('button')) {
            return
        }

        // Only trigger for clicks directly on the grid
        const isGridClick = e.target === containerRef.current || e.target.classList.contains('graph-clickable')
        if (!isGridClick) return

        // Calculate position as percentage (0-100)
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (clientY - rect.top)) / rect.height) * 100

        onAddTask(x, y)
    }

    // ==========================================================================
    // ZOOM CONTROLS
    // ==========================================================================

    // Count rendered tasks to decide if zoom controls should be shown
    const taskCount = React.Children.count(children)

    // Show zoom controls if: grid is busy (>5 tasks) OR user has zoomed (so they can reset)
    const showZoomControls = onZoomChange && (taskCount > 5 || zoom !== 1)

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">

            {/* Zoom Controls - Appears when grid is busy */}
            {showZoomControls && (
                <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                    {/* Zoom In Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onZoomChange(Math.min(2, zoom + 0.1)) }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        title="Zoom In"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    {/* Zoom Reset Button (shows current %) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onZoomChange(1) }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-500 transition-colors"
                        title="Reset Zoom"
                    >
                        {(zoom * 100).toFixed(0)}%
                    </button>

                    {/* Zoom Out Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onZoomChange(Math.max(0.2, zoom - 0.1)) }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        title="Zoom Out"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Main Grid Container */}
            <div
                ref={containerRef}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative w-full h-full graph-clickable cursor-crosshair"
                style={{
                    // Dot grid pattern
                    backgroundImage: `radial-gradient(circle, var(--grid-dot-color, #e2e8f0) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    backgroundPosition: 'center center',
                    backgroundColor: 'transparent',
                    // Zoom transform
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
            >
                {/* Axis Lines */}
                <div className="absolute inset-0 pointer-events-none select-none">
                    {/* Vertical Axis (center line) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -ml-[2px] bg-white dark:bg-slate-800" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/30 dark:bg-slate-600/30" />

                    {/* Horizontal Axis (center line) */}
                    <div className="absolute top-1/2 left-0 right-0 h-[4px] -mt-[2px] bg-white dark:bg-slate-800" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300/30 dark:bg-slate-600/30" />
                </div>

                {/* Axis Labels */}
                <div className="absolute top-1/2 right-4 translate-y-2 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                    Urgency →
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                    ↑ Importance
                </div>

                {/* Quadrant Labels (Eisenhower Matrix Categories) */}
                <div className="absolute top-6 right-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Do First</div>
                <div className="absolute top-6 left-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Schedule</div>
                <div className="absolute bottom-6 right-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Delegate</div>
                <div className="absolute bottom-6 left-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Eliminate</div>

                {/* Task Nodes (rendered as children) */}
                <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                    {children}
                </div>
            </div>
        </div>
    )
}

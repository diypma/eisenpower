import { useRef } from 'react'

export default function GraphPaper({ onAddTask, children }) {
    const containerRef = useRef(null)

    const handleClick = (e) => {
        // Explicitly ignore if clicking inside a task node (uses task-node class from TaskNode.jsx)
        if (e.target.closest('.task-node')) {
            return
        }

        // Only proceed if clicking the grid container or an element specifically marked as clickable
        const isGridClick = e.target === containerRef.current || e.target.classList.contains('graph-clickable')
        if (!isGridClick) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100

        onAddTask(x, y)
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Graph Paper Container */}
            <div
                ref={containerRef}
                onClick={handleClick}
                className="relative w-full h-full graph-clickable cursor-crosshair overflow-hidden"
                style={{
                    backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    backgroundColor: '#f8fafc',
                }}
            >
                {/* Axis Lines (Background) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/30" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300/30" />
                </div>

                {/* Axis Labels */}
                <div className="absolute top-1/2 -right-16 -translate-y-1/2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    Urgency →
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    ↑ Importance
                </div>

                {/* Quadrant Labels */}
                <div className="absolute top-6 right-6 text-[10px] font-black text-slate-300/40 uppercase tracking-[0.2em] pointer-events-none select-none">Do First</div>
                <div className="absolute top-6 left-6 text-[10px] font-black text-slate-300/40 uppercase tracking-[0.2em] pointer-events-none select-none">Schedule</div>
                <div className="absolute bottom-6 right-6 text-[10px] font-black text-slate-300/40 uppercase tracking-[0.2em] pointer-events-none select-none">Delegate</div>
                <div className="absolute bottom-6 left-6 text-[10px] font-black text-slate-300/40 uppercase tracking-[0.2em] pointer-events-none select-none">Eliminate</div>

                {/* Task Nodes (Foreground) */}
                <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                    {children}
                </div>
            </div>
        </div>
    )
}

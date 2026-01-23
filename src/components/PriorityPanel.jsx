/**
 * PriorityPanel.jsx - Sorted Task List Component
 * 
 * Displays all tasks in a scrollable list, sorted by priority score.
 * Priority = (Importance × 0.6) + (Urgency × 0.4)
 * 
 * Features:
 * - Ranked task list with priority scores
 * - Inline subtask toggles
 * - Positioned subtasks shown with parent reference
 * - Collapsible completed tasks archive
 * - Relative completion timestamps
 */

import { useState } from 'react'
import { getScoreColor } from '../utils/colorUtils'

export default function PriorityPanel({ tasks, onToggleSubtask, onExpandTask, onCompleteTask }) {
    // ==========================================================================
    // STATE
    // ==========================================================================

    const [showArchive, setShowArchive] = useState(false)

    // ==========================================================================
    // DATA PROCESSING
    // ==========================================================================

    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)

    // Create unified list: main tasks + positioned sub-tasks (on the grid)
    const allItems = [
        ...activeTasks.map(t => ({ ...t, type: 'task' })),
        ...activeTasks.flatMap(t =>
            (t.subtasks || [])
                .filter(s => s.x !== undefined && s.x !== null && !s.completed)
                .map(s => ({ ...s, type: 'positioned-subtask', parentId: t.id, parentText: t.text }))
        )
    ]

    // Sort by priority score (highest first)
    const sortedItems = allItems.sort((a, b) => {
        const scoreA = (a.y * 0.6) + (a.x * 0.4)
        const scoreB = (b.y * 0.6) + (b.x * 0.4)
        return scoreB - scoreA
    })

    // Track positioned subtask IDs to exclude from nested display
    const positionedSubtaskIds = new Set(
        activeTasks.flatMap(t => (t.subtasks || []).filter(s => s.x !== undefined && s.x !== null).map(s => s.id))
    )

    // Display index counter for numbered list
    let displayIndex = 0

    // ==========================================================================
    // HELPER FUNCTIONS
    // ==========================================================================

    /**
     * Format ISO date string as relative time (e.g., "2 days ago")
     */
    const formatRelativeTime = (isoString) => {
        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'today'
        if (diffDays === 1) return 'yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return `${Math.floor(diffDays / 30)} months ago`
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-colors">

            {/* Panel Header */}
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 flex-shrink-0 text-slate-900 dark:text-white">
                Priority Order
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                    {sortedItems.length}
                </span>
            </h2>

            {/* Scrollable Task List */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {sortedItems.map((item) => {
                    const score = (item.y * 0.6) + (item.x * 0.4)

                    // Render positioned subtask (extracted to grid)
                    if (item.type === 'positioned-subtask') {
                        return (
                            <div key={`sub-${item.id}`} className="group pl-8">
                                <div
                                    className="flex items-start gap-3 cursor-pointer"
                                    onClick={() => onExpandTask(item.parentId)}
                                >
                                    <span className="text-indigo-300 dark:text-indigo-600 text-sm font-bold">↳</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-700 dark:text-slate-300 leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                                            {item.text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p
                                                className="text-[10px] font-black uppercase tracking-tighter"
                                                style={{ color: getScoreColor(score).textLight }}
                                            >
                                                Score: {score.toFixed(0)}
                                            </p>
                                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                            <p className="text-[10px] font-medium text-slate-300 dark:text-slate-600 truncate">
                                                from {item.parentText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    // Render main task
                    displayIndex++
                    const task = item
                    const nonPositionedSubtasks = (task.subtasks || []).filter(s => !positionedSubtaskIds.has(s.id))

                    return (
                        <div key={task.id} className="group">
                            <div
                                className="flex items-start gap-4 cursor-pointer"
                                onClick={() => onExpandTask(task.id)}
                            >
                                {/* Rank Number */}
                                <span
                                    className="font-black text-2xl tabular-nums leading-none pt-1 transition-colors"
                                    style={{ color: getScoreColor(score).textLight }}
                                >
                                    {String(displayIndex).padStart(2, '0')}
                                </span>

                                <div className="flex-1 min-w-0">
                                    {/* Task Title */}
                                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.text}</p>

                                    <div className="flex items-center gap-2 mt-1">
                                        <p
                                            className="text-[10px] font-black uppercase tracking-tighter"
                                            style={{ color: getScoreColor(score).textLight }}
                                        >
                                            Score: {score.toFixed(0)}
                                        </p>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                                            U:{task.x.toFixed(0)} I:{task.y.toFixed(0)}
                                        </p>
                                    </div>

                                    {/* Inline Subtasks (non-positioned only) */}
                                    {nonPositionedSubtasks.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-l-2 border-slate-50 dark:border-slate-700 pl-3">
                                            {nonPositionedSubtasks.slice(0, 3).map(sub => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-2 group/sub cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleSubtask(task.id, sub.id);
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <div className={`
                                                        w-3 h-3 rounded border flex items-center justify-center transition-all
                                                        ${sub.completed
                                                            ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 group-hover/sub:border-indigo-300 dark:group-hover/sub:border-indigo-500'}
                                                    `}>
                                                        {sub.completed && (
                                                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium transition-all ${sub.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {sub.text}
                                                    </span>
                                                </div>
                                            ))}
                                            {nonPositionedSubtasks.length > 3 && (
                                                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 italic">+ {nonPositionedSubtasks.length - 3} more...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Empty State */}
                {sortedItems.length === 0 && (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                        <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100/50 dark:border-slate-700/50">
                            <svg className="w-6 h-6 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="font-bold text-slate-500 dark:text-slate-500">No tasks mapped</p>
                        <p className="text-xs mt-1 text-slate-300 dark:text-slate-600">Click on the grid paper to add one.</p>
                    </div>
                )}

                {/* Completed Tasks Archive */}
                {completedTasks.length > 0 && (
                    <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-700">
                        {/* Archive Toggle Button */}
                        <button
                            onClick={() => setShowArchive(!showArchive)}
                            className="flex items-center gap-2 w-full text-left group mb-4"
                        >
                            <svg
                                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${showArchive ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Completed ({completedTasks.length})
                            </h3>
                        </button>

                        {/* Archived Task List */}
                        {showArchive && (
                            <div className="space-y-3">
                                {completedTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-3 text-slate-400 dark:text-slate-600 cursor-pointer hover:text-slate-500 dark:hover:text-slate-500 transition-colors"
                                        onClick={() => onExpandTask(task.id)}
                                    >
                                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold line-through truncate">{task.text}</p>
                                            <p className="text-[10px] font-medium mt-0.5">
                                                completed {formatRelativeTime(task.completedAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

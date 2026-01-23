/**
 * TaskDetailModal.jsx - Task Detail and Edit Modal
 * 
 * Displays full task details with subtask management capabilities.
 * Supports dragging subtasks out to the grid for independent tracking.
 * 
 * Features:
 * - View/edit task details & notes
 * - Toggle subtask completion & notes
 * - Add new subtasks
 * - Drag subtasks to grid for visual positioning
 * - Delete or complete tasks
 * - Escape key to close
 */

import { useEffect, useState } from 'react'

export default function TaskDetailModal({
    isOpen,
    onClose,
    task,
    onToggleSubtask,
    onDelete,
    onComplete,
    onSubtaskDragStart,
    onAddSubtask,
    onUpdateTask,
    onUpdateSubtask,
    onDrop,
    gridRef
}) {
    // ==========================================================================
    // STATE
    // ==========================================================================

    const [isAdding, setIsAdding] = useState(false)
    const [newSubtaskText, setNewSubtaskText] = useState('')
    const [editingTaskTitle, setEditingTaskTitle] = useState(false)
    const [editedTaskTitle, setEditedTaskTitle] = useState('')
    const [editingSubtaskId, setEditingSubtaskId] = useState(null)
    const [editedSubtaskText, setEditedSubtaskText] = useState('')
    const [expandedSubtaskNotes, setExpandedSubtaskNotes] = useState(new Set())

    /** Reset state when task changes */
    useEffect(() => {
        setEditingTaskTitle(false)
        setEditedTaskTitle('')
        setIsAdding(false)
        setNewSubtaskText('')
        setEditingSubtaskId(null)
        setEditedSubtaskText('')
        setExpandedSubtaskNotes(new Set())
    }, [task?.id, isOpen])

    /** Handle direct updates for new fields */
    const handleFieldUpdate = (field, value) => {
        onUpdateTask(task.id, { [field]: value })
    }

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    /** Close modal when clicking backdrop */
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    /**
     * Handle dropping subtasks on the grid area visible behind the modal
     * This allows extracting subtasks directly to grid positions
     */
    const handleDrop = (e) => {
        e.preventDefault()
        if (!onDrop || !gridRef.current) return

        const rect = gridRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100

        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) {
                const data = JSON.parse(json)
                onDrop(x, y, data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    // ==========================================================================
    // KEYBOARD HANDLING
    // ==========================================================================

    /** Close modal on Escape key */
    useEffect(() => {
        if (!isOpen) return
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    // Don't render if not open or no task
    if (!isOpen || !task) return null

    // ==========================================================================
    // COMPUTED VALUES
    // ==========================================================================

    const priority = (task.y * 0.6) + (task.x * 0.4)

    // ==========================================================================
    // SUBTASK HANDLERS
    // ==========================================================================

    /** Start adding a new subtask */
    const startAdding = () => {
        setIsAdding(true)
        setNewSubtaskText('')
    }

    /** Submit the new subtask */
    const submitSubtask = (e) => {
        e.preventDefault()
        if (newSubtaskText.trim()) {
            onAddSubtask(task.id, newSubtaskText.trim())
            setNewSubtaskText('')
        }
    }

    /** Start editing task title */
    const startEditingTitle = () => {
        setEditedTaskTitle(task.text)
        setEditingTaskTitle(true)
    }

    /** Save edited task title */
    const saveTaskTitle = () => {
        if (editedTaskTitle.trim() && editedTaskTitle !== task.text) {
            onUpdateTask(task.id, { text: editedTaskTitle.trim() })
        }
        setEditingTaskTitle(false)
    }

    /** Start editing subtask */
    const startEditingSubtask = (subtask) => {
        setEditingSubtaskId(subtask.id)
        setEditedSubtaskText(subtask.text)
    }

    /** Save edited subtask */
    const saveSubtask = () => {
        if (editedSubtaskText.trim()) {
            onUpdateSubtask(task.id, editingSubtaskId, { text: editedSubtaskText.trim() })
        }
        setEditingSubtaskId(null)
    }

    /** Toggle subtask notes expansion */
    const toggleSubtaskNotes = (subtaskId) => {
        const next = new Set(expandedSubtaskNotes)
        if (next.has(subtaskId)) next.delete(subtaskId)
        else next.add(subtaskId)
        setExpandedSubtaskNotes(next)
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all"
            onClick={handleBackdropClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[32px] shadow-2xl w-full max-w-lg mx-4 p-6 md:p-10 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700 max-h-[90vh] overflow-y-auto">

                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        {editingTaskTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={editedTaskTitle}
                                    onChange={(e) => setEditedTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTaskTitle()
                                        if (e.key === 'Escape') setEditingTaskTitle(false)
                                    }}
                                    className="flex-1 text-2xl md:text-3xl font-black text-slate-800 dark:text-white bg-transparent border-b-2 border-indigo-500 outline-none px-1"
                                />
                                <button onClick={saveTaskTitle} className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Save">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                                <button onClick={() => setEditingTaskTitle(false)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Cancel">
                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="group/title flex items-center gap-2">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                                    {task.text}
                                </h2>
                                <button
                                    onClick={startEditingTitle}
                                    className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                    title="Edit task"
                                >
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                                Priority: {priority.toFixed(0)}
                            </span>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
                                U: {task.x.toFixed(0)} / I: {task.y.toFixed(0)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Deadlines & Automation Section */}
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Due Date Input */}
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                onChange={(e) => handleFieldUpdate('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        {/* Duration Input */}
                        <div className="w-24">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                                Days Needed
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={task.durationDays || ''}
                                onChange={(e) => handleFieldUpdate('durationDays', parseInt(e.target.value) || 0)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Auto-Urgency Toggle */}
                    {task.dueDate && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Auto-increase urgency</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Task will slide right as deadline approaches</span>
                            </div>
                            <button
                                onClick={() => handleFieldUpdate('autoUrgency', !task.autoUrgency)}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                                    ${task.autoUrgency !== false ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}
                                `}
                            >
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                                        ${task.autoUrgency !== false ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                            </button>
                        </div>
                    )}
                </div>

                {/* Task Notes Section */}
                <div className="mb-8">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                        Task Notes
                    </label>
                    <textarea
                        placeholder="Add notes, bullet points (-), or checklists ([ ])..."
                        value={task.notes || ''}
                        onChange={(e) => handleFieldUpdate('notes', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] whitespace-pre-wrap custom-scrollbar font-medium"
                    />
                </div>

                {/* Subtasks Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            Sub-Tasks
                            {task.subtasks?.length > 0 && (
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px]">
                                    {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
                                </span>
                            )}
                        </h3>
                        {!isAdding && (
                            <button
                                onClick={startAdding}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                + Add Sub-task
                            </button>
                        )}
                    </div>

                    {/* Subtask List (draggable items) */}
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {task.subtasks?.map((sub) => (
                            <div
                                key={sub.id}
                                className="group/subtask"
                            >
                                {editingSubtaskId === sub.id ? (
                                    <div className="flex items-center gap-2 p-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editedSubtaskText}
                                            onChange={(e) => setEditedSubtaskText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveSubtask()
                                                if (e.key === 'Escape') setEditingSubtaskId(null)
                                            }}
                                            className="flex-1 bg-white dark:bg-slate-800 border-b-2 border-indigo-500 outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 px-1"
                                        />
                                        <button onClick={saveSubtask} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Save">
                                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setEditingSubtaskId(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Cancel">
                                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        draggable
                                        onDragStart={(e) => {
                                            e.stopPropagation();
                                            e.dataTransfer.setData('application/json', JSON.stringify({
                                                type: 'SUBTASK_EXTRACT',
                                                taskId: task.id,
                                                subtaskId: sub.id,
                                                text: sub.text
                                            }));
                                            e.dataTransfer.effectAllowed = 'move';
                                            onSubtaskDragStart?.(task.id, sub);
                                        }}
                                        className="flex items-center gap-3 cursor-grab active:cursor-grabbing p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                        onClick={() => onToggleSubtask(task.id, sub.id)}
                                    >
                                        {/* Checkbox */}
                                        <div className={`
                                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                    ${sub.completed
                                                ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 group-hover/sub:border-indigo-300 dark:group-hover/sub:border-indigo-500'}
                                `}>
                                            {sub.completed && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`flex-1 font-semibold text-sm transition-all ${sub.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {sub.text}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                startEditingSubtask(sub)
                                            }}
                                            className="opacity-0 group-hover/subtask:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            title="Edit subtask"
                                        >
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleSubtaskNotes(sub.id)
                                            }}
                                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all ${sub.notes ? 'text-indigo-500 opacity-100' : 'text-slate-400 opacity-0 group-hover/subtask:opacity-100'}`}
                                            title="Sub-task notes"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Subtask Notes Area (Expandable) */}
                                {expandedSubtaskNotes.has(sub.id) && (
                                    <div className="mt-1 ml-10 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 animate-in slide-in-from-top-1 duration-200">
                                        <textarea
                                            autoFocus
                                            placeholder="Sub-task notes..."
                                            value={sub.notes || ''}
                                            onChange={(e) => onUpdateSubtask(task.id, sub.id, { notes: e.target.value })}
                                            className="w-full bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-400 min-h-[60px] whitespace-pre-wrap resize-none custom-scrollbar"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Subtask Form */}
                        {isAdding && (
                            <form onSubmit={submitSubtask} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-2">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="New sub-task..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                    value={newSubtaskText}
                                    onChange={(e) => setNewSubtaskText(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-700"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </form>
                        )}

                        {/* Empty State */}
                        {(!task.subtasks || task.subtasks.length === 0) && !isAdding && (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-300 dark:text-slate-600">No sub-tasks defined</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 md:gap-4 border-t border-slate-100 dark:border-slate-700 pt-6 md:pt-8">
                    <button
                        onClick={() => {
                            if (window.confirm("Delete this task?")) {
                                onDelete(task.id);
                                onClose();
                            }
                        }}
                        className="px-4 md:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Delete Task
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Mark this task as complete?")) {
                                onComplete(task.id);
                            }
                        }}
                        className="px-4 md:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                        ✓ Mark Complete
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={onClose}
                        className="px-6 md:px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg active:scale-95 ml-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

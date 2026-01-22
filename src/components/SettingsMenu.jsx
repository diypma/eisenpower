/**
 * SettingsMenu.jsx - Application Settings Dropdown
 * 
 * Provides access to app settings and data management features.
 * 
 * Features:
 * - Backup tasks to JSON file (for iCloud/cross-device sync)
 * - Restore tasks from JSON backup
 * - Export tasks as human-readable text
 * - Toggle dark/light theme
 */

import { useState, useEffect, useRef } from 'react'

export default function SettingsMenu({ tasks, setTasks, isDark, onToggleTheme }) {
    // ==========================================================================
    // STATE & REFS
    // ==========================================================================

    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)
    const fileInputRef = useRef(null)

    // ==========================================================================
    // CLICK OUTSIDE HANDLER
    // ==========================================================================

    /**
     * Close menu when clicking outside
     */
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // ==========================================================================
    // BACKUP & RESTORE HANDLERS
    // ==========================================================================

    /**
     * Export tasks as JSON file for backup
     * Can be saved to iCloud Drive for cross-device sync
     */
    const handleBackup = () => {
        const data = JSON.stringify(tasks, null, 2)
        const blob = new Blob([data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `eisenpower_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsOpen(false)
    }

    /**
     * Import tasks from JSON backup file
     * Validates file format before overwriting
     */
    const handleRestore = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result)
                if (Array.isArray(data)) {
                    if (window.confirm("This will overwrite your current tasks. Are you sure?")) {
                        setTasks(data)
                        alert("Tasks restored successfully!")
                    }
                } else {
                    alert("Invalid backup file format.")
                }
            } catch (err) {
                console.error(err)
                alert("Error reading backup file.")
            }
        }
        reader.readAsText(file)
        e.target.value = null // Reset input for re-upload
        setIsOpen(false)
    }

    // ==========================================================================
    // TEXT EXPORT HANDLER
    // ==========================================================================

    /**
     * Export tasks as human-readable text file
     * Useful for sharing or printing task lists
     */
    const handleExport = () => {
        let content = "EISENPOWER TASKS EXPORT\n"
        content += `Date: ${new Date().toLocaleString()}\n`
        content += "================================\n\n"

        // Separate active and completed tasks
        const activeTasks = tasks.filter(t => !t.completed)
        const completedTasks = tasks.filter(t => t.completed)

        // Sort by priority score (same algorithm as PriorityPanel)
        const sortedActive = [...activeTasks].sort((a, b) => {
            const scoreA = (a.y * 0.6) + (a.x * 0.4)
            const scoreB = (b.y * 0.6) + (b.x * 0.4)
            return scoreB - scoreA
        })

        content += "ACTIVE TASKS\n"
        content += "------------\n\n"

        sortedActive.forEach((task, index) => {
            const score = (task.y * 0.6) + (task.x * 0.4)
            content += `${index + 1}. ${task.text} [Score: ${score.toFixed(0)}]\n`
            content += `   Position: Urgency ${task.x.toFixed(0)} / Importance ${task.y.toFixed(0)}\n`

            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(sub => {
                    const status = sub.completed ? "[x]" : "[ ]"
                    const positioned = (sub.x !== undefined && sub.x !== null) ? " [ON GRID]" : ""
                    content += `   - ${status} ${sub.text}${positioned}\n`
                })
            } else {
                content += `   (No subtasks)\n`
            }
            content += "\n"
        })

        if (completedTasks.length > 0) {
            content += "\nCOMPLETED TASKS\n"
            content += "---------------\n\n"

            completedTasks.forEach((task, index) => {
                const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown'
                content += `${index + 1}. [COMPLETED] ${task.text}\n`
                content += `   Completed: ${completedDate}\n`

                if (task.subtasks && task.subtasks.length > 0) {
                    const completedSubs = task.subtasks.filter(s => s.completed).length
                    content += `   Sub-tasks: ${completedSubs}/${task.subtasks.length} completed\n`
                }
                content += "\n"
            })
        }

        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `eisenpower_export_${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setIsOpen(false)
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="relative" ref={menuRef}>
            {/* Hidden file input for restore */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleRestore}
            />

            {/* Settings Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                title="Settings"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {/* Backup Button */}
                        <button
                            onClick={handleBackup}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group"
                        >
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Backup Tasks</span>
                                <span className="text-[10px] text-slate-400">Save to JSON</span>
                            </div>
                        </button>

                        {/* Restore Button */}
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group"
                        >
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Restore Tasks</span>
                                <span className="text-[10px] text-slate-400">Load from JSON</span>
                            </div>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group"
                        >
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Export Tasks</span>
                                <span className="text-[10px] text-slate-400">Download .txt file</span>
                            </div>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => {
                                onToggleTheme()
                                setIsOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group"
                        >
                            {isDark ? (
                                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {isDark ? 'Light Mode' : 'Dark Mode'}
                                </span>
                                <span className="text-[10px] text-slate-400">Switch theme</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * SettingsMenu.jsx - Application Settings Dropdown
 * 
 * Provides access to app settings and data management features.
 * 
 * Features:
 * - Backup tasks to JSON file
 * - Export tasks as human-readable text
 * - Toggle dark/light theme
 * - Accessible via the gear icon in the header
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsMenu({ tasks, setTasks, isDark, onToggleTheme, deletedTasks = [], onRestoreTask, onPermanentlyDelete }) {
    // ==========================================================================
    // STATE & REFS
    // ==========================================================================

    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [showLogin, setShowLogin] = useState(false)
    const [showRecycleBin, setShowRecycleBin] = useState(false)

    const menuRef = useRef(null)

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
    // AUTH HANDLER
    // ==========================================================================

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.href
                }
            })
            if (error) throw error
            setMessage('Check your email for the login link!')
        } catch (error) {
            console.error(error)
            alert(error.error_description || error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
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
                        {/* Cloud Sync / Account Section */}
                        <div className="px-4 py-2">
                            {session ? (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Cloud Sync Active</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-2">
                                    {!showLogin ? (
                                        <button
                                            onClick={() => setShowLogin(true)}
                                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                            </svg>
                                            Turn On Cloud Sync
                                        </button>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Sign In</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                Enter your email to receive a magic login link. No password needed.
                                            </p>
                                            {message ? (
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs p-3 rounded-lg mb-3">
                                                    {message}
                                                </div>
                                            ) : (
                                                <form onSubmit={handleLogin}>
                                                    <input
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        required
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowLogin(false)}
                                                            className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                            {loading ? 'Sending...' : 'Send Link'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                        </div>

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

                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />

                        {/* Recycle Bin */}
                        <button
                            onClick={() => setShowRecycleBin(!showRecycleBin)}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors group"
                        >
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <div className="flex flex-col flex-1">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Recycle Bin</span>
                                <span className="text-[10px] text-slate-400">
                                    {deletedTasks.length} deleted task{deletedTasks.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showRecycleBin ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showRecycleBin && deletedTasks.length > 0 && (
                            <div className="px-4 pb-3 space-y-2">
                                {deletedTasks.map(task => {
                                    const deletedTime = new Date(task.deletedAt).getTime()
                                    const expiresAt = deletedTime + (24 * 60 * 60 * 1000)
                                    const hoursLeft = Math.max(0, Math.round((expiresAt - Date.now()) / (60 * 60 * 1000)))

                                    return (
                                        <div key={task.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{task.text}</p>
                                                <p className="text-[10px] text-slate-400">Expires in {hoursLeft}h</p>
                                            </div>
                                            <button
                                                onClick={() => onRestoreTask(task.id)}
                                                className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                                title="Restore"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onPermanentlyDelete(task.id)}
                                                className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                title="Delete forever"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {showRecycleBin && deletedTasks.length === 0 && (
                            <div className="px-4 pb-3">
                                <p className="text-xs text-slate-400 text-center py-2">No deleted tasks</p>
                            </div>
                        )}

                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2 my-1" />

                        {/* Clear All Data - Danger Zone */}
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete ALL your tasks? This cannot be undone.")) {
                                    if (window.confirm("This is your last chance! All tasks will be permanently deleted. Continue?")) {
                                        // Create backup before clearing
                                        localStorage.setItem('eisenpower-tasks-pre-clear', JSON.stringify(tasks))
                                        setTasks([])
                                        localStorage.removeItem('eisenpower-tasks')
                                        alert("All data has been cleared.")
                                        setIsOpen(false)
                                    }
                                }
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors group"
                        >
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400">Clear All Data</span>
                                <span className="text-[10px] text-slate-400">Delete all tasks</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

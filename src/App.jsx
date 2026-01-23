/**
 * App.jsx - Eisenpower Main Application
 * 
 * This is the root component of the Eisenpower task management application.
 * It implements an Eisenhower Matrix (Urgency vs Importance grid) for task prioritization.
 * 
 * Key Features:
 * - Task creation, editing, and deletion
 * - Drag-and-drop task positioning on the matrix
 * - Dark/Light theme support
 * - Mobile-responsive tabbed interface
 * - LocalStorage Persistence
 * 
 * 🚀 AI AGENT INSTRUCTION:
 * When pushing a significant update or fixing a bug, YOU MUST:
 * 1. Increment the "version" in 'package.json'.
 * 2. Commit and Push the changes to trigger the GitHub Actions deployment.
 * The version in the UI header automatically reflects 'package.json'.
 */

import pkg from '../package.json'

import { useState, useRef, useEffect } from 'react'
import GraphPaper from './components/GraphPaper'
import TaskNode from './components/TaskNode'
import PriorityPanel from './components/PriorityPanel'
import TaskModal from './components/TaskModal'
import TaskDetailModal from './components/TaskDetailModal'
import SettingsMenu from './components/SettingsMenu'
import { getTaskAccentColor } from './utils/colorUtils'
import { supabase } from './lib/supabase'

function App() {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  /**
   * Tasks array - persisted to localStorage
   * Each task has: id, text, x (urgency 0-100), y (importance 0-100), subtasks[], completed?, completedAt?
   */
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('eisenpower-tasks')
      return saved ? JSON.parse(saved) : [
        // Default demo tasks
        {
          id: 1,
          text: 'Launch Eisenpower',
          x: 75,
          y: 85,
          subtasks: [
            { id: 101, text: 'Fix drag and drop', completed: true },
            { id: 102, text: 'Implement click-to-add', completed: true },
            { id: 103, text: 'Task detail expansion', completed: true }
          ]
        },
        { id: 2, text: 'Plan next features', x: 25, y: 75, subtasks: [] },
      ]
    } catch (e) {
      console.error('Failed to parse tasks', e)
      // Try loading from backup
      try {
        const backup = localStorage.getItem('eisenpower-tasks-backup')
        if (backup) {
          console.warn('Loaded from backup due to parse failure')
          return JSON.parse(backup)
        }
      } catch (e2) {
        console.error('Backup also failed', e2)
      }
      return []
    }
  })

  /**
   * Deleted tasks array (recycle bin) - persisted to localStorage
   * Each deleted task has: all original fields + deletedAt timestamp
   * Auto-purged after 24 hours
   */
  const [deletedTasks, setDeletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('eisenpower-deleted')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('eisenpower-theme') || 'light'
  })

  // Supabase Session State
  const [session, setSession] = useState(null)

  // ==========================================================================
  // CLOUD SYNC v2.0 (Conflict-Resistant)
  // ==========================================================================

  // Tracking refs to ensure sync logic always uses the latest state
  const tasksRef = useRef(tasks)
  const deletedTasksRef = useRef(deletedTasks)
  const lastConvergedHashRef = useRef(null) // Tracks the state of the last known-good sync
  const syncInProgressRef = useRef(false) // Prevents concurrent uploads

  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { deletedTasksRef.current = deletedTasks }, [deletedTasks])

  /** Initialize Auth Listener */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  /** Load data from cloud on login */
  useEffect(() => {
    if (session) {
      loadCloudData()
    }
  }, [session])

  /**
   * loadCloudData - Robust 3-Way Merge
   * Merges local state with cloud state using per-item timestamps (LWW).
   */
  const loadCloudData = async () => {
    if (!session) return

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('tasks, deleted_tasks')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ Supabase read error:', error)
        return
      }

      const cloudTasks = (data && data.tasks) ? data.tasks : []
      const cloudDeleted = (data && data.deleted_tasks) ? data.deleted_tasks : []

      // 1. Calculate merged Deleted Tasks (LWW)
      const deletedMap = new Map()
      const allDeleted = [...deletedTasksRef.current, ...cloudDeleted]
      allDeleted.forEach(t => {
        const existing = deletedMap.get(t.id)
        const currentVer = t.updatedAt || t.id
        const existingVer = existing ? (existing.updatedAt || existing.id) : -1
        if (currentVer >= existingVer) {
          deletedMap.set(t.id, t)
        }
      })
      const finalDeleted = Array.from(deletedMap.values())

      // 2. Calculate merged Main Tasks (LWW)
      const localMap = new Map(tasksRef.current.map(t => [t.id, t]))
      const cloudMap = new Map(cloudTasks.map(t => [t.id, t]))
      const allIds = new Set([...localMap.keys(), ...cloudMap.keys()])
      const finalDeletedMap = new Map(finalDeleted.map(t => [t.id, t]))
      const finalTasks = []

      allIds.forEach(id => {
        const local = localMap.get(id)
        const cloud = cloudMap.get(id)

        if (local && cloud) {
          const localVer = local.updatedAt || local.id
          const cloudVer = cloud.updatedAt || cloud.id
          finalTasks.push(localVer >= cloudVer ? local : cloud)
        } else if (cloud) {
          // Keep from cloud only if not in finalDeleted
          if (!finalDeletedMap.has(id)) finalTasks.push(cloud)
        } else if (local) {
          // Keep from local only if not in finalDeleted
          if (!finalDeletedMap.has(id)) finalTasks.push(local)
        }
      })

      // Update state & Convergence Tracker
      setDeletedTasks(finalDeleted)
      setTasks(finalTasks)

      const convergedData = { tasks: finalTasks, deleted_tasks: finalDeleted }
      lastConvergedHashRef.current = JSON.stringify(convergedData)

      console.log('🔄 Cloud sync v2.0: Convergence reached')
    } catch (err) {
      console.error('❌ Merge error:', err)
    }
  }

  /** Debounced Sync Upload Hook with Feedback Suppression */
  useEffect(() => {
    if (!session) return

    const timer = setTimeout(async () => {
      if (syncInProgressRef.current) return

      // CHECK: Do we actually have unsaved changes compared to last convergence?
      const localData = { tasks, deleted_tasks: deletedTasks }
      const localHash = JSON.stringify(localData)

      if (localHash === lastConvergedHashRef.current) {
        // console.log('✅ No unsaved changes (feedback loop suppressed)')
        return
      }

      // SAFEGUARD: Don't sync completely empty data on initial load if we've never synced
      if (tasks.length === 0 && deletedTasks.length === 0) {
        if (!localStorage.getItem('eisenpower-has-synced')) return
      }

      try {
        syncInProgressRef.current = true
        localStorage.setItem('eisenpower-tasks-backup', JSON.stringify(tasks))

        const { error } = await supabase
          .from('user_data')
          .upsert(
            {
              user_id: session.user.id,
              tasks: tasks,
              deleted_tasks: deletedTasks
            },
            { onConflict: 'user_id' }
          )

        if (error) {
          console.error('❌ Sync error:', error)
        } else {
          lastConvergedHashRef.current = localHash
          localStorage.setItem('eisenpower-has-synced', 'true')
          console.log(`📤 Synced: ${tasks.length} tasks to cloud`)
        }
      } catch (err) {
        console.error('❌ Sync catch:', err)
      } finally {
        syncInProgressRef.current = false
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [tasks, deletedTasks, session])

  /** Non-blocking Realtime Listener */
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel(`user-sync-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('☁️ Realtime: Remote change detected')
          loadCloudData()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime: Subscribed to cloud updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  // ==========================================================================
  // PERSISTENCE EFFECTS
  // ==========================================================================

  /** Persist tasks to localStorage whenever they change */
  useEffect(() => {
    localStorage.setItem('eisenpower-tasks', JSON.stringify(tasks))
  }, [tasks])

  /** Persist theme and apply to document */
  useEffect(() => {
    localStorage.setItem('eisenpower-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  /** Persist deleted tasks (recycle bin) to localStorage */
  useEffect(() => {
    localStorage.setItem('eisenpower-deleted', JSON.stringify(deletedTasks))
  }, [deletedTasks])

  /** Auto-purge deleted tasks older than 24 hours */
  useEffect(() => {
    const now = Date.now()
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000)

    setDeletedTasks(prev => prev.filter(task => {
      const deletedTime = new Date(task.deletedAt).getTime()
      return deletedTime > twentyFourHoursAgo
    }))
  }, []) // Run once on mount

  // Modal and UI state
  const [modalState, setModalState] = useState({ isOpen: false, x: 50, y: 50 })
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [hoveredTaskFamily, setHoveredTaskFamily] = useState(null)
  const [activeTab, setActiveTab] = useState('matrix') // Mobile tab: 'matrix' | 'list'
  const graphContainerRef = useRef(null)

  // ==========================================================================
  // TASK OPERATIONS
  // ==========================================================================

  /** Open the task creation modal at the specified grid position */
  const handleOpenModal = (x, y) => {
    setModalState({ isOpen: true, x, y })
  }

  /** Create a new task from the modal form data */
  const handleCreateTask = ({ text, subtasks }) => {
    const now = Date.now()
    const newTask = {
      id: now,
      text,
      x: modalState.x,
      y: modalState.y,
      subtasks: subtasks.map((s, i) => ({ ...s, id: now + 1 + i })),
      updatedAt: now
    }
    setTasks([...tasks, newTask])
    setModalState({ ...modalState, isOpen: false })
  }

  /** Move a task to a new position on the grid */
  const moveTask = (id, x, y) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, x, y, updatedAt: Date.now() } : task
    ))
  }

  /** Delete a task by ID (moves to recycle bin) */
  const deleteTask = (id) => {
    const now = Date.now()
    const taskToDelete = tasks.find(t => t.id === id)
    if (taskToDelete) {
      // Move to recycle bin with timestamp
      setDeletedTasks(prev => [...prev, {
        ...taskToDelete,
        deletedAt: new Date().toISOString(),
        updatedAt: now
      }])
    }
    setTasks(prev => prev.filter(t => t.id !== id))
    if (expandedTaskId === id) setExpandedTaskId(null)
  }

  /** Restore a task from recycle bin */
  const restoreTask = (id) => {
    const taskToRestore = deletedTasks.find(t => t.id === id)
    if (taskToRestore) {
      // Remove deletedAt timestamp and add back to tasks
      const { deletedAt, ...restoredTask } = taskToRestore
      setTasks(prev => [...prev, { ...restoredTask, updatedAt: Date.now() }])
      setDeletedTasks(prev => prev.filter(t => t.id !== id))
    }
  }

  /** Permanently delete a task from recycle bin */
  const permanentlyDeleteTask = (id) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== id))
  }

  /** Toggle a subtask's completed state */
  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          updatedAt: Date.now(),
          subtasks: task.subtasks.map(s => {
            if (s.id === subtaskId) {
              const newCompleted = !s.completed
              // Remove from grid if completing a positioned sub-task
              if (newCompleted && s.x !== undefined && s.x !== null) {
                return { ...s, completed: newCompleted, x: undefined, y: undefined }
              }
              return { ...s, completed: newCompleted }
            }
            return s
          })
        }
      }
      return task
    }))
  }

  /** Mark a task as complete and record completion time */
  const completeTask = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
          updatedAt: Date.now()
        }
      }
      return task
    }))
    setExpandedTaskId(null)
  }

  /** Edit task title */
  const editTask = (taskId, newText) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, text: newText, updatedAt: Date.now() } : task
    ))
  }

  /** Edit subtask text */
  const editSubtask = (taskId, subtaskId, newText) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          updatedAt: Date.now(),
          subtasks: task.subtasks.map(s =>
            s.id === subtaskId ? { ...s, text: newText } : s
          )
        }
      }
      return task
    }))
  }

  /** Toggle between light and dark theme */
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // ==========================================================================
  // SUBTASK GRID OPERATIONS
  // ==========================================================================

  /** Handle dropping a subtask onto the grid to extract it */
  const handleSubtaskDrop = (x, y, data) => {
    if (data.type === 'SUBTASK_EXTRACT') {
      setTasks(prev => prev.map(t => {
        if (t.id === data.taskId) {
          return {
            ...t,
            updatedAt: Date.now(),
            subtasks: t.subtasks.map(s =>
              s.id === data.subtaskId ? { ...s, x, y } : s
            )
          }
        }
        return t
      }))
      setExpandedTaskId(null)
    }
  }

  /** Return a subtask from the grid back to its parent task */
  const handleReturnSubtask = (parentId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === parentId) {
        return {
          ...t,
          updatedAt: Date.now(),
          subtasks: t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, x: undefined, y: undefined } : s
          )
        }
      }
      return t
    }))
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200`}>

      {/* Header Bar */}
      <header className="px-8 py-4 flex justify-between items-center bg-white dark:bg-slate-900 z-50 relative shadow-sm dark:shadow-slate-800 border-b border-transparent dark:border-slate-800 transition-colors">
        <h1 className="flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tighter bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            Eisenpower
          </span>
          <span className="text-[10px] font-medium text-slate-300 dark:text-slate-700 tracking-widest select-none">
            v{pkg.version}
          </span>
        </h1>
        <div className="flex items-center gap-4">
          <SettingsMenu
            tasks={tasks}
            setTasks={setTasks}
            isDark={theme === 'dark'}
            onToggleTheme={toggleTheme}
            session={session}
            deletedTasks={deletedTasks}
            onRestoreTask={restoreTask}
            onPermanentlyDelete={permanentlyDeleteTask}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors pb-24 md:pb-8 overflow-hidden">

        {/* Eisenhower Matrix Grid */}
        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative p-0 md:p-2 z-0 transition-colors ${activeTab === 'matrix' ? 'block' : 'hidden md:block'}`}>
          <div className="absolute inset-0 md:inset-2" ref={graphContainerRef}>
            <GraphPaper
              onAddTask={handleOpenModal}
              onDrop={handleSubtaskDrop}
            >
              {/* Main Tasks */}
              {tasks.filter(task => !task.completed).map(task => (
                <TaskNode
                  key={task.id}
                  task={task}
                  onMove={moveTask}
                  onDelete={deleteTask}
                  onExpand={setExpandedTaskId}
                  containerRef={graphContainerRef}
                  onMouseEnter={() => setHoveredTaskFamily(task.id)}
                  onMouseLeave={() => setHoveredTaskFamily(null)}
                  isHighlighted={hoveredTaskFamily === task.id}
                  onReturnSubtask={handleReturnSubtask}
                />
              ))}

              {/* Positioned Sub-tasks (extracted to grid) */}
              {tasks.filter(task => !task.completed).flatMap(task => {
                const parentAccentColor = getTaskAccentColor(task.id)
                return (task.subtasks || [])
                  .filter(sub => sub.x !== undefined && sub.x !== null && !sub.completed)
                  .map(sub => (
                    <TaskNode
                      key={sub.id}
                      task={{ ...sub, isSubtask: true, parentId: task.id }}
                      onMove={(id, x, y) => {
                        setTasks(prev => prev.map(t => {
                          if (t.id === task.id) {
                            return {
                              ...t,
                              updatedAt: Date.now(),
                              subtasks: t.subtasks.map(s =>
                                s.id === id ? { ...s, x, y } : s
                              )
                            }
                          }
                          return t
                        }))
                      }}
                      onDelete={(id) => {
                        setTasks(prev => prev.map(t => {
                          if (t.id === task.id) {
                            return {
                              ...t,
                              updatedAt: Date.now(),
                              subtasks: t.subtasks.map(s =>
                                s.id === id ? { ...s, x: undefined, y: undefined } : s
                              )
                            }
                          }
                          return t
                        }))
                      }}
                      onExpand={() => {
                        setExpandedTaskId(task.id)
                      }}
                      containerRef={graphContainerRef}
                      isSubtaskNode={true}
                      parentAccentColor={parentAccentColor}
                      onMouseEnter={() => setHoveredTaskFamily(task.id)}
                      onMouseLeave={() => setHoveredTaskFamily(null)}
                      isHighlighted={hoveredTaskFamily === task.id}
                      onReturnSubtask={handleReturnSubtask}
                    />
                  ))
              })}
            </GraphPaper>
          </div>
        </div>

        {/* Priority Panel (Sorted Task List) */}
        <div className={`w-full md:w-[320px] flex-shrink-0 flex flex-col h-full overflow-hidden ${activeTab === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <PriorityPanel
            tasks={tasks}
            onToggleSubtask={toggleSubtask}
            onExpandTask={setExpandedTaskId}
            onCompleteTask={completeTask}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-2 pb-safe z-50">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'matrix' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] font-bold">Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'list' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-[10px] font-bold">List</span>
        </button>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSubmit={handleCreateTask}
        position={modalState}
      />

      {/* Task Detail/Edit Modal */}
      <TaskDetailModal
        isOpen={!!expandedTaskId}
        task={tasks.find(t => t.id === expandedTaskId)}
        onClose={() => setExpandedTaskId(null)}
        onToggleSubtask={toggleSubtask}
        onDelete={deleteTask}
        onComplete={completeTask}
        onEditTask={editTask}
        onEditSubtask={editSubtask}
        onAddSubtask={(taskId, text) => {
          setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                updatedAt: Date.now(),
                subtasks: [...(task.subtasks || []), { id: Date.now(), text, completed: false }]
              }
            }
            return task
          }))
        }}
        onSubtaskDragStart={(taskId, subtask) => {
          // Tracking hook for animations (currently unused)
        }}
        onDrop={handleSubtaskDrop}
        gridRef={graphContainerRef}
      />
    </div>
  )
}

export default App

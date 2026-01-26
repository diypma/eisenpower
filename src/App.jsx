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

  /** Initialize Auth Listener */
  useEffect(() => {
    // Listen for auth changes (including initial session restoration)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ==========================================================================
  // CLOUD SYNC v2.0 (Conflict-Resistant)
  // ==========================================================================

  // ==========================================================================
  // CLOUD SYNC v3.0 (Relational + Realtime)
  // ==========================================================================

  // Helper: Map Supabase DB Row -> App Task Object
  const mapTaskFromDb = (row) => ({
    id: row.id, // UUID now, but we handle that
    text: row.text,
    x: row.x_position ?? 50,
    y: row.y_position ?? 50,
    completed: row.is_completed,
    completedAt: row.completed_at,
    dueDate: row.due_date,
    durationDays: row.duration_days,
    autoUrgency: row.auto_urgency,
    subtasks: row.subtasks || [],
    updatedAt: new Date(row.updated_at).getTime()
  })

  // Helper: Map App Task Object -> Supabase DB Row
  const mapTaskToDb = (task) => ({
    text: task.text,
    x_position: task.x,
    y_position: task.y,
    is_completed: task.completed,
    completed_at: task.completedAt,
    due_date: task.dueDate,
    duration_days: task.durationDays,
    auto_urgency: task.autoUrgency,
    subtasks: task.subtasks || [],
    updated_at: new Date().toISOString()
  })

  /**
   * fetchRemoteTasks - Loads the "True State" from Supabase
   */
  const fetchRemoteTasks = async () => {
    if (!session) return

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    if (data) {
      const mapped = data.map(mapTaskFromDb)

      // If we have tasks in the cloud, we use them as the source of truth
      // Merging strategy: Replace local active tasks with cloud tasks.
      // (Migration step handles the initial upload)
      if (mapped.length > 0) {
        setTasks(mapped)
        localStorage.setItem('eisenpower-has-synced-v3', 'true')
      } else {
        // If cloud is empty but we have local tasks, and we haven't synced v3 yet,
        // we might be in the "Pre-Migration" state. 
        // We do NOT wipe local tasks here. We wait for user to click "Migrate".
      }
    }
  }

  /**
   * Realtime Subscription
   * Listens for precise row changes and updates local state instantly.
   */
  // Track previous session to prevent unnecessary re-subscriptions
  const sessionRef = useRef(session?.access_token)

  useEffect(() => {
    if (!session) return

    // Avoid re-running if the token hasn't changed (Supabase sometimes emits new session objects with same token)
    if (sessionRef.current === session.access_token) {
      // checks session stability
    }
    sessionRef.current = session.access_token

    console.log('DEBUG: Session Refreshed or Initialized', new Date().toISOString())

    // 1. Initial Fetch
    console.log('DEBUG: Fetching Remote Tasks...')
    fetchRemoteTasks()

    // 2. Subscribe to Changes
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          console.log('DEBUG: Realtime Event Received', payload.eventType)
          const { eventType, new: newRow, old: oldRow } = payload

          if (eventType === 'INSERT') {
            setTasks(prev => [...prev, mapTaskFromDb(newRow)])
          }
          else if (eventType === 'UPDATE') {
            const mapped = mapTaskFromDb(newRow)
            setTasks(prev => prev.map(t => {
              if (t.id === newRow.id) {
                // Smart Merge: Only overwrite local fields if the DB payload actually contains them.
                // This handles cases where Realtime sends partial updates or defaults are missing.
                return {
                  ...t,
                  ...mapped,
                  // Explicitly preserve local values if mapped values are undefined/null/invalid due to partial payload
                  text: mapped.text !== undefined ? mapped.text : t.text,
                  completed: mapped.completed !== undefined ? mapped.completed : t.completed,
                  completedAt: mapped.completed !== undefined ? mapped.completedAt : t.completedAt, // Link completion state/time
                  x: (mapped.x !== 50 || newRow.x_position !== undefined) ? mapped.x : t.x, // 50 is default, check raw row
                  y: (mapped.y !== 50 || newRow.y_position !== undefined) ? mapped.y : t.y
                }
              }
              return t
            }))
          }
          else if (eventType === 'DELETE') {
            setTasks(prev => {
              const task = prev.find(t => t.id === oldRow.id)
              if (task) {
                return prev.filter(t => t.id !== oldRow.id)
              }
              return prev
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('DEBUG: Realtime Status:', status)
      })

    return () => {
      console.log('DEBUG: Unsubscribing Realtime')
      supabase.removeChannel(channel)
    }
  }, [session?.access_token]) // Only re-run if the ACCESS TOKEN changes

  // ==========================================================================
  // PERSISTENCE EFFECTS
  // ==========================================================================

  /** Persist tasks to localStorage whenever they change */
  useEffect(() => {
    // Debounce persistence to prevent main-thread blocking during high-frequency updates (updates at 60fps during drag)
    const timeout = setTimeout(() => {
      localStorage.setItem('eisenpower-tasks', JSON.stringify(tasks))
    }, 1000)
    return () => clearTimeout(timeout)
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

  // ==========================================================================
  // DYNAMIC URGENCY ENGINE
  // ==========================================================================

  /**
   * runUrgencyEngine - Automatically boosts task urgency as deadlines approach.
   * Handles:
   * - Deadline + Duration: Ramps up 7 days before "Must Start" date.
   * - Deadline Only: Ramps up 5 days before Due Date.
   * - Shift Detection: Adds 'urgencyShifted' flag to draw user attention.
   */
  const runUrgencyEngine = () => {
    setTasks(prev => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let shifted = false;

      const updatedTasks = prev.map(task => {
        if (!task.dueDate || task.autoUrgency === false || task.completed) return task;

        const due = new Date(task.dueDate);
        const duration = task.durationDays || 0;

        // Panic Date = The last possible day to start
        const panicDate = new Date(due);
        panicDate.setDate(due.getDate() - duration);

        // Pressure Window: How early to start the drift
        const windowSize = task.durationDays ? 7 : 5;

        const diffDays = Math.ceil((panicDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays <= windowSize) {
          // Calculate ramped urgency (capped at 94% to leave edge room)
          let targetX = 94;
          if (diffDays > 0) {
            const progress = (windowSize - diffDays) / windowSize;
            targetX = task.x + (94 - task.x) * progress;
          }

          // Only update if it's a significant forward shift
          if (targetX > task.x + 0.1) {
            shifted = true;
            return { ...task, x: targetX, urgencyShifted: true, updatedAt: Date.now() };
          }
        }
        return task;
      });

      if (shifted) console.log('⚡ Urgency Engine: Tasks shifted due to approaching deadlines');
      return updatedTasks;
    });
  };

  /** Run engine on initial load */
  useEffect(() => {
    // Small delay to ensure state and theme are ready
    const timer = setTimeout(runUrgencyEngine, 1000);
    return () => clearTimeout(timer);
  }, []);

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
  const handleCreateTask = async ({ text, subtasks, dueDate, durationDays, autoUrgency }) => {
    const now = Date.now()
    const newTask = {
      id: now.toString(), // Temporary ID, will be replaced by Supabase UUID if we re-fetch, but for now string is safer
      text,
      x: modalState.x,
      y: modalState.y,
      subtasks: subtasks.map((s, i) => ({ ...s, id: now + 1 + i })),
      dueDate,
      durationDays,
      autoUrgency,
      updatedAt: now,
      completed: false // Default
    }

    // Optimistic Update
    setTasks(prev => [...prev, newTask])
    setModalState({ ...modalState, isOpen: false })

    if (session) {
      try {
        const dbPayload = {
          ...mapTaskToDb(newTask),
          user_id: session.user.id
        }
        // Let Supabase generate the ID
        const { data, error } = await supabase.from('tasks').insert(dbPayload).select().single()

        if (data) {
          // Update the local task with the real UUID from DB
          setTasks(prev => prev.map(t => t.id === newTask.id ? mapTaskFromDb(data) : t))
        }
      } catch (err) {
        console.error('Failed to create task:', err)
      }
    }
  }

  /** Move a task (Local State Only - High Performance) */
  const moveTask = (id, x, y) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, x, y, updatedAt: Date.now() } : task
    ))
  }

  /** Commit new position to Database (Called on Drag End) */
  const handleMoveEnd = (id, x, y) => {
    if (session) {
      supabase.from('tasks')
        .update({ x_position: x, y_position: y, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then()
    }
  }

  /** Move Subtask (Local State Only) */
  const moveSubtask = (parentId, subtaskId, x, y) => {
    setTasks(prev => prev.map(task => {
      if (task.id === parentId) {
        return {
          ...task,
          updatedAt: Date.now(),
          subtasks: task.subtasks.map(s =>
            s.id === subtaskId ? { ...s, x, y } : s
          )
        }
      }
      return task
    }))
  }

  /** Commit Subtask to Database */
  const handleSubtaskMoveEnd = (parentId, subtaskId, x, y) => {
    // Get the latest task state to ensure we save the full valid array
    // Note: We access the 'tasks' state directly. 
    // Ideally this should use a functional update or refs, but since this runs on 'Drop',
    // the render cycle should be fresh enough. 
    const task = tasks.find(t => t.id === parentId)
    if (!task || !session) return

    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, x, y } : s
    )

    supabase.from('tasks')
      .update({ subtasks: updatedSubtasks, updated_at: new Date().toISOString() })
      .eq('id', parentId)
      .then()
  }

  /** Delete a task by ID (moves to recycle bin) */
  const deleteTask = (id) => {
    const now = Date.now()
    const taskToDelete = tasks.find(t => t.id === id)
    if (taskToDelete) {
      // Local Recycle Bin
      setDeletedTasks(prev => [...prev, {
        ...taskToDelete,
        deletedAt: new Date().toISOString(),
        updatedAt: now
      }])
    }
    setTasks(prev => prev.filter(t => t.id !== id))
    if (expandedTaskId === id) setExpandedTaskId(null)

    if (session) {
      supabase.from('tasks').delete().eq('id', id).then()
    }
  }

  /** Restore a task from recycle bin */
  const restoreTask = async (id) => {
    const taskToRestore = deletedTasks.find(t => t.id === id)
    if (taskToRestore) {
      const { deletedAt, ...restoredTask } = taskToRestore
      const restored = { ...restoredTask, updatedAt: Date.now() }

      setTasks(prev => [...prev, restored])
      setDeletedTasks(prev => prev.filter(t => t.id !== id))

      if (session) {
        // We need to re-insert it because we Hard Deleted it.
        // If ID is UUID, we can try to reuse it? Supabase allows specifying ID on insert.
        const dbPayload = mapTaskToDb(restored)
        dbPayload.id = restored.id
        await supabase.from('tasks').insert(dbPayload)
      }
    }
  }

  /** Permanently delete a task from recycle bin */
  const permanentlyDeleteTask = (id) => {
    setDeletedTasks(prev => prev.filter(t => t.id !== id))
  }

  /** Toggle a subtask's completed state */
  const toggleSubtask = (taskId, subtaskId) => {
    let updatedTask = null

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const nextTask = {
          ...task,
          updatedAt: Date.now(),
          subtasks: task.subtasks.map(s => {
            if (s.id === subtaskId) {
              const newCompleted = !s.completed
              if (newCompleted && s.x !== undefined && s.x !== null) {
                return { ...s, completed: newCompleted, x: undefined, y: undefined }
              }
              return { ...s, completed: newCompleted }
            }
            return s
          })
        }
        updatedTask = nextTask
        return nextTask
      }
      return task
    }))

    // Sync subtasks JSON
    if (updatedTask && session) {
      supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', taskId).then()
    }
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

    if (session) {
      supabase.from('tasks')
        .update({ is_completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .then(({ error }) => {
          if (error) console.error('DEBUG: completeTask Failed', error)
        })
    }
  }

  /** Update task specific fields */
  const updateTask = (taskId, updates) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates, updatedAt: Date.now() } : task
    ))

    if (session) {
      // Map updates to DB keys
      const dbUpdates = { updated_at: new Date().toISOString() }
      if (updates.text !== undefined) dbUpdates.text = updates.text
      if (updates.x !== undefined) dbUpdates.x_position = updates.x
      if (updates.y !== undefined) dbUpdates.y_position = updates.y
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
      if (updates.durationDays !== undefined) dbUpdates.duration_days = updates.durationDays
      if (updates.autoUrgency !== undefined) dbUpdates.auto_urgency = updates.autoUrgency

      supabase.from('tasks').update(dbUpdates).eq('id', taskId).then()
    }
  }

  /** Update subtask specific fields */
  const updateSubtask = (taskId, subtaskId, updates) => {
    let updatedTask = null
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const nextTask = {
          ...task,
          updatedAt: Date.now(),
          subtasks: task.subtasks.map(s =>
            s.id === subtaskId ? { ...s, ...updates } : s
          )
        }
        updatedTask = nextTask
        return nextTask
      }
      return task
    }))

    if (updatedTask && session) {
      supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', taskId).then()
    }
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
      let updatedTask = null
      setTasks(prev => prev.map(t => {
        if (t.id === data.taskId) {
          const nextTask = {
            ...t,
            updatedAt: Date.now(),
            subtasks: t.subtasks.map(s =>
              s.id === data.subtaskId ? { ...s, x, y } : s
            )
          }
          updatedTask = nextTask
          return nextTask
        }
        return t
      }))
      setExpandedTaskId(null)

      if (updatedTask && session) {
        supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', data.taskId).then()
      }
    }
  }

  /** Return a subtask from the grid back to its parent task */
  const handleReturnSubtask = (parentId, subtaskId) => {
    let updatedTask = null
    setTasks(prev => prev.map(t => {
      if (t.id === parentId) {
        const nextTask = {
          ...t,
          updatedAt: Date.now(),
          subtasks: t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, x: undefined, y: undefined } : s
          )
        }
        updatedTask = nextTask
        return nextTask
      }
      return t
    }))

    if (updatedTask && session) {
      supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', parentId).then()
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200`}>

      {/* Header Bar */}
      {/* Header Bar */}
      <header className="px-4 py-2 flex justify-between items-center bg-white dark:bg-slate-900 z-50 relative shadow-sm dark:shadow-slate-800 border-b border-transparent dark:border-slate-800 transition-colors">
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
                  onUpdateTask={updateTask}
                  onMoveEnd={handleMoveEnd}
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
                      onMove={(subId, x, y) => moveSubtask(task.id, subId, x, y)}
                      onMoveEnd={(subId, x, y) => handleSubtaskMoveEnd(task.id, subId, x, y)}
                      onDelete={(id) => {
                        let updatedTask = null
                        setTasks(prev => prev.map(t => {
                          if (t.id === task.id) {
                            const next = {
                              ...t,
                              updatedAt: Date.now(),
                              subtasks: t.subtasks.map(s =>
                                s.id === id ? { ...s, x: undefined, y: undefined } : s
                              )
                            }
                            updatedTask = next
                            return next
                          }
                          return t
                        }))
                        if (updatedTask && session) {
                          supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', task.id).then()
                        }
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
                      onUpdateTask={updateTask}
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-center gap-4 p-2 pb-safe z-50">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'matrix' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-xs font-bold">Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeTab === 'list' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-xs font-bold">List</span>
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
        onUpdateTask={updateTask}
        onUpdateSubtask={updateSubtask}
        onAddSubtask={(taskId, text) => {
          let updatedTask = null
          setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
              const next = {
                ...task,
                updatedAt: Date.now(),
                subtasks: [...(task.subtasks || []), { id: Date.now(), text, completed: false }]
              }
              updatedTask = next
              return next
            }
            return task
          }))
          if (updatedTask && session) {
            supabase.from('tasks').update({ subtasks: updatedTask.subtasks, updated_at: new Date().toISOString() }).eq('id', taskId).then()
          }
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

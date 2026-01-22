import { useState, useRef, useEffect } from 'react'
import GraphPaper from './components/GraphPaper'
import TaskNode from './components/TaskNode'
import PriorityPanel from './components/PriorityPanel'
import TaskModal from './components/TaskModal'
import TaskDetailModal from './components/TaskDetailModal'
import SettingsMenu from './components/SettingsMenu'
import { getTaskAccentColor } from './utils/colorUtils'

function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('eisenpower-tasks')
      return saved ? JSON.parse(saved) : [
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
      return []
    }
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('eisenpower-theme') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('eisenpower-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('eisenpower-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const [modalState, setModalState] = useState({ isOpen: false, x: 50, y: 50 })
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [hoveredTaskFamily, setHoveredTaskFamily] = useState(null) // Track parent ID for highlighting
  const [activeTab, setActiveTab] = useState('matrix') // 'matrix' | 'list'
  const [zoom, setZoom] = useState(1)
  const graphContainerRef = useRef(null)

  const handleOpenModal = (x, y) => {
    setModalState({ isOpen: true, x, y })
  }

  const handleCreateTask = ({ text, subtasks }) => {
    const newTask = {
      id: Date.now(),
      text,
      x: modalState.x,
      y: modalState.y,
      subtasks: subtasks.map((s, i) => ({ ...s, id: Date.now() + i }))
    }
    setTasks([...tasks, newTask])
    setModalState({ ...modalState, isOpen: false })
  }

  const moveTask = (id, x, y) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, x, y } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (expandedTaskId === id) setExpandedTaskId(null)
  }

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(s => {
            if (s.id === subtaskId) {
              const newCompleted = !s.completed
              // If completing a positioned sub-task, remove it from grid
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

  const completeTask = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: true,
          completedAt: new Date().toISOString()
        }
      }
      return task
    }))
    setExpandedTaskId(null)
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleSubtaskDrop = (x, y, data) => {
    if (data.type === 'SUBTASK_EXTRACT') {
      setTasks(prev => prev.map(t => {
        if (t.id === data.taskId) {
          return {
            ...t,
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

  const handleReturnSubtask = (parentId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === parentId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, x: undefined, y: undefined } : s
          )
        }
      }
      return t
    }))
  }

  return (
    <div className={`h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200`}>
      {/* Ultra Compact Header */}
      <header className="px-8 py-4 flex justify-between items-center bg-white dark:bg-slate-900 z-50 relative shadow-sm dark:shadow-slate-800 border-b border-transparent dark:border-slate-800 transition-colors">
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
          Eisenpower
        </h1>
        <div className="flex items-center gap-4">
          <SettingsMenu
            tasks={tasks}
            setTasks={setTasks}
            isDark={theme === 'dark'}
            onToggleTheme={toggleTheme}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors pb-24 md:pb-8 overflow-hidden">
        {/* Graph Paper Matrix */}
        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[32px] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative p-2 md:p-8 md:pr-20 z-0 transition-colors ${activeTab === 'matrix' ? 'block' : 'hidden md:block'}`}>
          <div className="absolute inset-2 md:inset-8" ref={graphContainerRef}>
            <GraphPaper
              onAddTask={handleOpenModal}
              onDrop={handleSubtaskDrop}
              zoom={zoom}
              onZoomChange={setZoom}
            >
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

              {/* Positioned Sub-tasks */}
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

        {/* Priority Panel */}
        {/* Priority Panel */}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-[10px] font-bold">List</span>
        </button>
      </div>

      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSubmit={handleCreateTask}
        position={modalState}
      />

      <TaskDetailModal
        isOpen={!!expandedTaskId}
        task={tasks.find(t => t.id === expandedTaskId)}
        onClose={() => setExpandedTaskId(null)}
        onToggleSubtask={toggleSubtask}
        onDelete={deleteTask}
        onComplete={completeTask}
        onAddSubtask={(taskId, text) => {
          setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: [...(task.subtasks || []), { id: Date.now(), text, completed: false }]
              }
            }
            return task
          }))
        }}
        onSubtaskDragStart={(taskId, subtask) => {
          // Track
        }}
        onDrop={handleSubtaskDrop}
        gridRef={graphContainerRef}
      />
    </div>
  )
}

export default App

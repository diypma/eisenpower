import { useState, useRef } from 'react'
import GraphPaper from './components/GraphPaper'
import TaskNode from './components/TaskNode'
import PriorityPanel from './components/PriorityPanel'
import TaskModal from './components/TaskModal'

function App() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: 'Launch Eisenpower',
      x: 75,
      y: 85,
      subtasks: [
        { id: 101, text: 'Fix drag and drop', completed: true },
        { id: 102, text: 'Implement click-to-add', completed: false }
      ]
    },
    { id: 2, text: 'Plan next features', x: 25, y: 75, subtasks: [] },
  ])

  const [modalState, setModalState] = useState({ isOpen: false, x: 50, y: 50 })
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
  }

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          )
        }
      }
      return task
    }))
  }

  return (
    <div className="h-screen bg-white font-sans text-slate-900 flex flex-col overflow-hidden">
      {/* Ultra Compact Header */}
      <header className="px-8 py-4 flex justify-between items-center bg-white">
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent">
          Eisenpower
        </h1>
        <div className="flex items-center gap-4">
          {/* Add any global actions here */}
        </div>
      </header>

      <main className="flex-1 flex gap-8 p-8 overflow-hidden bg-slate-50/50">
        {/* Graph Paper Matrix */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm relative pr-20 p-8">
          <div className="absolute inset-8" ref={graphContainerRef}>
            <GraphPaper onAddTask={handleOpenModal}>
              {tasks.map(task => (
                <TaskNode
                  key={task.id}
                  task={task}
                  onMove={moveTask}
                  onDelete={deleteTask}
                  containerRef={graphContainerRef}
                />
              ))}
            </GraphPaper>
          </div>
        </div>

        {/* Priority Panel */}
        <div className="w-[320px] flex-shrink-0 flex flex-col h-full">
          <PriorityPanel tasks={tasks} onToggleSubtask={toggleSubtask} />
        </div>
      </main>

      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSubmit={handleCreateTask}
        position={modalState}
      />
    </div>
  )
}

export default App

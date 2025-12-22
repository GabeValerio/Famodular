'use client';

export { TaskPlannerPage as default } from './pages/TaskPlannerPage';

export default function TaskPlanner() {
  // Sample data - in a real app, this would come from your API/database
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      text: 'Complete project documentation',
      type: 'code',
      completed: false,
      priority: 1,
      due_date: '2024-12-25',
      timezone: 'America/New_York',
      estimated_time: 120,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      text: 'Review pull request',
      type: 'code',
      completed: true,
      priority: 2,
      timezone: 'America/New_York',
      completed_time: 45,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      text: 'Daily standup meeting',
      type: 'daily',
      completed: false,
      priority: 3,
      timezone: 'America/New_York',
      created_at: new Date().toISOString(),
    }
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      text: 'Complete Q4 projects',
      goal: 'Complete Q4 projects',
      progress: 75,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      text: 'Learn TypeScript',
      goal: 'Learn TypeScript',
      progress: 30,
      created_at: new Date().toISOString(),
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');

  // Initialize new task form
  const initialNewTask: NewTaskForm = {
    title: '',
    description: '',
    date: '',
    end_date: '',
    time: '',
    end_time: '',
    timezone: selectedTimezone,
    type: 'personal',
    goal_id: null,
    parent_id: null,
    is_recurring: false,
    recurrence_pattern: 'daily',
    recurrence_interval: 1,
    recurrence_day_of_week: [],
    recurrence_day_of_month: [],
    recurrence_month: [],
    recurrence_end_type: 'never',
    recurrence_end_date: '',
    recurrence_count: 1,
  };

  const [newTask, setNewTask] = useState<NewTaskForm>(initialNewTask);

  // Timezones - in a real app, this might come from a library or API
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'UTC', label: 'UTC' },
  ];

  // Task handlers
  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Create new task object
    const task: Task = {
      id: Date.now().toString(),
      text: newTask.title,
      title: newTask.title,
      description: newTask.description,
      type: newTask.type,
      goal_id: newTask.goal_id,
      parent_id: newTask.parent_id,
      due_date: newTask.date ? new Date(newTask.date + 'T' + (newTask.time || '12:00') + ':00').toISOString() : undefined,
      timezone: newTask.timezone,
      is_recurring: newTask.is_recurring,
      recurrence_pattern: newTask.recurrence_pattern,
      recurrence_interval: newTask.recurrence_interval,
      recurrence_day_of_week: newTask.recurrence_day_of_week,
      recurrence_day_of_month: newTask.recurrence_day_of_month,
      recurrence_month: newTask.recurrence_month,
      recurrence_end_date: newTask.recurrence_end_date,
      recurrence_count: newTask.recurrence_count,
      image_url: newTask.image_url,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // In a real app, you would save to your database here
    setTasks(prev => [...prev, task]);

    // Reset form
    setNewTask(initialNewTask);
    setIsAddingTask(false);
  }, [newTask, initialNewTask]);

  const handleTaskToggle = useCallback((task: Task) => {
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      !t.completed
    ).length;

    return { total, completed, pending, overdue };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Planner</h1>
            <p className="text-gray-600 mt-1">Organize your tasks and achieve your goals</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsAddingTask(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskList
                  tasks={tasks}
                  selectedTask={selectedTask}
                  setSelectedTask={setSelectedTask}
                  onTaskToggle={handleTaskToggle}
                  onTaskDelete={handleTaskDelete}
                  selectedTimezone={selectedTimezone}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Task Form */}
            {isAddingTask && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddTaskForm
                    newTask={newTask}
                    setNewTask={setNewTask}
                    handleAddTask={handleAddTask}
                    setIsAddingTask={setIsAddingTask}
                    goals={goals}
                    tasks={tasks}
                    timezones={timezones}
                    selectedTimezone={selectedTimezone}
                  />
                </CardContent>
              </Card>
            )}

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{goal.goal}</div>
                        <div className="text-xs text-gray-500">{goal.progress}% complete</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

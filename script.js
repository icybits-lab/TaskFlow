// Task Management Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const statsToggle = document.getElementById('statsToggle');
    const statsModal = document.getElementById('statsModal');
    const searchInput = document.getElementById('searchInput');
    const sortTasksBtn = document.getElementById('sortTasks');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const selectAllBtn = document.getElementById('selectAll');
    const deleteSelectedBtn = document.getElementById('deleteSelected');
    
    // Category buttons
    const categoryButtons = document.querySelectorAll('.category-btn');
    const currentCategoryDisplay = document.getElementById('currentCategory');
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    const priorityFilterButtons = document.querySelectorAll('.priority-filter-btn');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentCategory = 'all';
    let currentFilter = 'all';
    let currentPriorityFilter = 'all';
    let sortOrder = 'newest';
    let selectedTasks = new Set();

    // Initialize the app
    function init() {
        loadTasks();
        updateUI();
        updateStats();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').min = today;
    }

    // Load tasks from localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'No due date';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    // Check if task is overdue
    function isOverdue(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        return due < today;
    }

    // Check if task is due today
    function isDueToday(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        const due = new Date(dueDate);
        return due.toDateString() === today.toDateString();
    }

    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;
        
        if (!title) {
            alert('Please enter a task title');
            return;
        }
        
        const newTask = {
            id: generateId(),
            title,
            description,
            category,
            priority,
            dueDate: dueDate || null,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        tasks.unshift(newTask);
        saveTasks();
        updateUI();
        updateStats();
        
        // Reset form
        taskForm.reset();
        document.getElementById('taskDueDate').min = new Date().toISOString().split('T')[0];
        
        // Show success animation
        const addButton = taskForm.querySelector('button[type="submit"]');
        const originalText = addButton.innerHTML;
        addButton.innerHTML = '<i class="fas fa-check"></i> Task Added!';
        addButton.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        
        setTimeout(() => {
            addButton.innerHTML = originalText;
            addButton.style.background = '';
        }, 1500);
    });

    // Toggle task completion
    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveTasks();
            updateUI();
            updateStats();
        }
    }

    // Edit task
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // In a real app, you might open a modal for editing
        // For simplicity, we'll just allow inline editing of title
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        const titleElement = taskElement.querySelector('.task-title');
        
        const currentTitle = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 5px;
            font-size: 1.1rem;
            font-weight: 600;
            border: 2px solid var(--primary-color);
            border-radius: 4px;
            font-family: inherit;
        `;
        
        titleElement.replaceWith(input);
        input.focus();
        input.select();
        
        function saveEdit() {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                task.title = newTitle;
                saveTasks();
            }
            updateUI();
        }
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });
    }

    // Delete task
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(t => t.id !== taskId);
            selectedTasks.delete(taskId);
            saveTasks();
            updateUI();
            updateStats();
        }
    }

    // Filter tasks based on current selections
    function filterTasks() {
        let filteredTasks = tasks;
        
        // Filter by category
        if (currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }
        
        // Filter by status
        switch (currentFilter) {
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'today':
                filteredTasks = filteredTasks.filter(task => isDueToday(task.dueDate));
                break;
        }
        
        // Filter by priority
        if (currentPriorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === currentPriorityFilter);
        }
        
        // Search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm)
            );
        }
        
        return filteredTasks;
    }

    // Sort tasks
    function sortTasks(taskArray) {
        return [...taskArray].sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                default:
                    return 0;
            }
        });
    }

    // Update UI with filtered and sorted tasks
    function updateUI() {
        const filteredTasks = filterTasks();
        const sortedTasks = sortTasks(filteredTasks);
        
        // Update category counts
        updateCategoryCounts();
        
        // Update task list
        renderTaskList(sortedTasks);
        
        // Update bulk actions button
        deleteSelectedBtn.disabled = selectedTasks.size === 0;
        
        // Update current category display
        const categoryNames = {
            all: 'All Tasks',
            work: 'Work Tasks',
            personal: 'Personal Tasks',
            shopping: 'Shopping Tasks',
            health: 'Health Tasks',
            learning: 'Learning Tasks'
        };
        currentCategoryDisplay.textContent = categoryNames[currentCategory] || currentCategory + ' Tasks';
    }

    // Update category counts
    function updateCategoryCounts() {
        const categories = ['all', 'work', 'personal', 'shopping', 'health', 'learning'];
        
        categories.forEach(category => {
            const count = category === 'all' 
                ? tasks.length 
                : tasks.filter(task => task.category === category).length;
            
            const countElement = document.getElementById(`count${category.charAt(0).toUpperCase() + category.slice(1)}`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
        
        // Update quick stats
        document.getElementById('totalTasks').textContent = tasks.length;
        document.getElementById('completedTasks').textContent = tasks.filter(t => t.completed).length;
        document.getElementById('pendingTasks').textContent = tasks.filter(t => !t.completed).length;
        document.getElementById('todayTasks').textContent = tasks.filter(t => isDueToday(t.dueDate)).length;
    }

    // Render task list
    function renderTaskList(taskArray) {
        if (taskArray.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No tasks found</h3>
                    <p>${searchInput.value ? 'Try a different search term' : 'Add a new task to get started!'}</p>
                </div>
            `;
            return;
        }
        
        taskList.innerHTML = '';
        
        taskArray.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    // Create task element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate) ? 'overdue' : ''}`;
        taskElement.dataset.taskId = task.id;
        
        const isSelected = selectedTasks.has(task.id);
        const dueDateClass = isOverdue(task.dueDate) ? 'overdue' : isDueToday(task.dueDate) ? 'today' : '';
        
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="task-${task.id}" ${isSelected ? 'checked' : ''}>
                <label for="task-${task.id}" class="checkmark">
                    <i class="fas fa-check"></i>
                </label>
            </div>
            <div class="task-content">
                <div class="task-header">
                    <div>
                        <h3 class="task-title">${escapeHtml(task.title)}</h3>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn delete" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="task-category">
                        <i class="fas fa-tag"></i> ${task.category}
                    </span>
                    ${task.dueDate ? `
                        <span class="task-due-date ${dueDateClass}">
                            <i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}
                            ${isOverdue(task.dueDate) ? '(Overdue)' : ''}
                        </span>
                    ` : ''}
                    <span class="task-created">
                        <i class="far fa-clock"></i> ${formatDate(task.createdAt)}
                    </span>
                </div>
            </div>
        `;
        
        // Add event listeners
        const checkbox = taskElement.querySelector(`#task-${task.id}`);
        checkbox.addEventListener('change', () => toggleTaskSelection(task.id));
        
        const checkmark = taskElement.querySelector('.checkmark');
        checkmark.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
        });
        
        const editBtn = taskElement.querySelector('.edit');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(task.id);
        });
        
        const deleteBtn = taskElement.querySelector('.delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        // Task completion on click anywhere
        taskElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-checkbox') && 
                !e.target.closest('.task-actions') &&
                !e.target.closest('.edit-input')) {
                toggleTaskCompletion(task.id);
            }
        });
        
        return taskElement;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toggle task selection
    function toggleTaskSelection(taskId) {
        if (selectedTasks.has(taskId)) {
            selectedTasks.delete(taskId);
        } else {
            selectedTasks.add(taskId);
        }
        deleteSelectedBtn.disabled = selectedTasks.size === 0;
    }

    // Update statistics
    function updateStats() {
        // Update modal stats if modal is open
        if (statsModal.classList.contains('active')) {
            updateStatisticsModal();
        }
    }

    // Update statistics modal
    function updateStatisticsModal() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;
        const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate && !isOverdue(t.dueDate)).length;
        
        // Calculate completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
        
        // Calculate average tasks per day (last 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentCompleted = tasks.filter(t => 
            t.completed && new Date(t.completedAt) > lastWeek
        ).length;
        document.getElementById('avgCompletion').textContent = (recentCompleted / 7).toFixed(1);
        
        // Update other stats
        document.getElementById('overdueTasks').textContent = overdueTasks;
        document.getElementById('upcomingTasks').textContent = upcomingTasks;
        
        // Update charts
        updateCategoryChart();
        updatePriorityChart();
    }

    // Update category chart
    function updateCategoryChart() {
        const categories = ['work', 'personal', 'shopping', 'health', 'learning'];
        const categoryNames = {
            work: 'Work',
            personal: 'Personal',
            shopping: 'Shopping',
            health: 'Health',
            learning: 'Learning'
        };
        
        const categoryCounts = {};
        categories.forEach(cat => {
            categoryCounts[cat] = tasks.filter(t => t.category === cat).length;
        });
        
        const maxCount = Math.max(...Object.values(categoryCounts), 1);
        
        let chartHTML = '';
        categories.forEach(cat => {
            const count = categoryCounts[cat];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            chartHTML += `
                <div class="bar">
                    <span class="bar-label">${categoryNames[cat]}</span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%; background-color: ${getCategoryColor(cat)};"></div>
                    </div>
                    <span class="bar-value">${count}</span>
                </div>
            `;
        });
        
        document.getElementById('categoryChart').innerHTML = chartHTML;
    }

    // Update priority chart
    function updatePriorityChart() {
        const priorities = ['high', 'medium', 'low'];
        const priorityNames = {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        };
        
        const priorityCounts = {};
        priorities.forEach(pri => {
            priorityCounts[pri] = tasks.filter(t => t.priority === pri).length;
        });
        
        const maxCount = Math.max(...Object.values(priorityCounts), 1);
        
        let chartHTML = '';
        priorities.forEach(pri => {
            const count = priorityCounts[pri];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            chartHTML += `
                <div class="bar">
                    <span class="bar-label">${priorityNames[pri]}</span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%; background-color: ${getPriorityColor(pri)};"></div>
                    </div>
                    <span class="bar-value">${count}</span>
                </div>
            `;
        });
        
        document.getElementById('priorityChart').innerHTML = chartHTML;
    }

    // Get category color
    function getCategoryColor(category) {
        const colors = {
            work: '#3498db',
            personal: '#2ecc71',
            shopping: '#9b59b6',
            health: '#e74c3c',
            learning: '#f39c12'
        };
        return colors[category] || '#95a5a6';
    }

    // Get priority color
    function getPriorityColor(priority) {
        const colors = {
            high: '#e74c3c',
            medium: '#f39c12',
            low: '#2ecc71'
        };
        return colors[priority] || '#95a5a6';
    }

    // Event Listeners

    // Theme toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        const icon = this.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // Save theme preference
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('i').classList.remove('fa-moon');
        themeToggle.querySelector('i').classList.add('fa-sun');
    }

    // Statistics modal
    statsToggle.addEventListener('click', function() {
        updateStatisticsModal();
        statsModal.classList.add('active');
    });

    // Close modal
    statsModal.querySelector('.close-modal').addEventListener('click', function() {
        statsModal.classList.remove('active');
    });

    // Close modal on outside click
    statsModal.addEventListener('click', function(e) {
        if (e.target === statsModal) {
            statsModal.classList.remove('active');
        }
    });

    // Category selection
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            updateUI();
        });
    });

    // Filter selection
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            updateUI();
        });
    });

    // Priority filter selection
    priorityFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            priorityFilterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentPriorityFilter = this.dataset.priority;
            updateUI();
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        updateUI();
    });

    // Sort tasks
    sortTasksBtn.addEventListener('click', function() {
        const sortOrders = ['newest', 'oldest', 'priority', 'dueDate'];
        const currentIndex = sortOrders.indexOf(sortOrder);
        sortOrder = sortOrders[(currentIndex + 1) % sortOrders.length];
        
        // Update button icon/title
        const sortIcons = {
            newest: 'fa-sort-amount-down',
            oldest: 'fa-sort-amount-up',
            priority: 'fa-flag',
            dueDate: 'fa-calendar'
        };
        const sortTitles = {
            newest: 'Newest First',
            oldest: 'Oldest First',
            priority: 'By Priority',
            dueDate: 'By Due Date'
        };
        
        this.innerHTML = `<i class="fas ${sortIcons[sortOrder]}"></i>`;
        this.title = `Sort: ${sortTitles[sortOrder]}`;
        
        updateUI();
    });

    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', function() {
        if (confirm('Clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            selectedTasks.clear();
            saveTasks();
            updateUI();
            updateStats();
        }
    });

    // Select all tasks
    selectAllBtn.addEventListener('click', function() {
        const filteredTasks = filterTasks();
        const allFilteredIds = new Set(filteredTasks.map(t => t.id));
        
        if (selectedTasks.size === allFilteredIds.size) {
            // Deselect all if all are selected
            selectedTasks.clear();
        } else {
            // Select all filtered tasks
            selectedTasks = new Set(allFilteredIds);
        }
        
        updateUI();
    });

    // Delete selected tasks
    deleteSelectedBtn.addEventListener('click', function() {
        if (selectedTasks.size === 0) return;
        
        if (confirm(`Delete ${selectedTasks.size} selected task(s)?`)) {
            tasks = tasks.filter(task => !selectedTasks.has(task.id));
            selectedTasks.clear();
            saveTasks();
            updateUI();
            updateStats();
        }
    });

    // Initialize the app
    init();
});
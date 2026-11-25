const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

// Task controller functions for handling CRUD operations on tasks.
async function create(req, res) {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    const task = await prisma.task.create({
        data: {
            title: value.title,
            priority: value.priority,
            userId: req.user.id,
        },
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
        },
    });

    return res.status(201).json(task);
}

// Retrieve all tasks for the authenticated user.
async function index(req, res) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                message: "Invalid pagination parameters",
            });
        }

        const skip = (page - 1) * limit;

        const where = {
            userId: req.user.id,
        };

        if (req.query.find) {
            where.title = {
                contains: req.query.find,
                mode: "insensitive",
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            skip: skip,
            take: limit,
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const total = await prisma.task.count({
            where,
        });

        const pages = Math.ceil(total / limit);

        if (total === 0) {
            return res.status(404).json({
                message: "No tasks found",
            });
        }

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Page not found",
            });
        }

        return res.status(200).json({
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
        });

    } catch (error) {
        console.error("Task retrieval error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Retrieve a specific task by ID for the authenticated user.
async function show(req, res, next) {
    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
        return res.status(400).json({
            message: "The task ID passed is not valid.",
        });
    }

    try {
        const task = await prisma.task.findUnique({
            where: {
                id: taskId,
                userId: req.user.id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        return res.status(200).json(task);

    } catch (error) {
        next(error);
    }
}

// Update a specific task by ID for the authenticated user.
async function update(req, res, next) {
    if (!req.body) req.body = {};

    const { error, value } = patchTaskSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
        return res.status(400).json({
            message: "The task ID passed is not valid.",
        });
    }

    try {
        const task = await prisma.task.update({
            where: {
                id: taskId,
                userId: req.user.id,
            },
            data: value,
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
            },
        });

        return res.status(200).json(task);

    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        next(error);
    }
}

// Delete a specific task by ID for the authenticated user.
async function deleteTask(req, res, next) {
    const taskId = parseInt(req.params?.id);

    if (isNaN(taskId)) {
        return res.status(400).json({
            message: "The task ID passed is not valid.",
        });
    }

    try {
        const task = await prisma.task.delete({
            where: {
                id: taskId,
                userId: req.user.id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
            },
        });

        return res.status(200).json(task);

    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        next(error);
    }
}

// Create multiple tasks in one request.
async function bulkCreate(req, res) {
    const tasks = req.body?.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
            message: "Tasks must be a non-empty array",
        });
    }

    const validTasks = [];

    for (const task of tasks) {
        const { error, value } = taskSchema.validate(task, {
            abortEarly: false,
        });

        if (error) {
            return res.status(400).json({
                message: error.message,
            });
        }

        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted,
            priority: value.priority,
            userId: req.user.id,
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
        });

        return res.status(201).json({
            message: "success!",
            tasksCreated: result.count,
            totalRequested: validTasks.length,
        });

    } catch (error) {
        console.error("Bulk task creation error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

module.exports = { create, index, show, update, deleteTask, bulkCreate };

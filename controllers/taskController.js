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

    try {
        const task = await prisma.task.create({
            data: {
                title: value.title,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        return res.status(201).json(task);

    } catch (error) {
        console.error("Task creation error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Retrieve all tasks for the authenticated user.
async function index(req, res) {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: global.user_id,
            },
            select: {
                title: true,
                isCompleted: true,
                id: true,
            },
            orderBy: {
                id: "asc",
            },
        });

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "No tasks found",
            });
        }

        return res.status(200).json(tasks);

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
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
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
                userId: global.user_id,
            },
            data: value,
            select: {
                id: true,
                title: true,
                isCompleted: true,
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
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
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

module.exports = { create, index, show, update, deleteTask };

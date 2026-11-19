const prisma = require("../db/prisma");

// Get task analytics for a specific user.
async function getUserAnalytics(req, res) {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({
            message: "Invalid user ID",
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const taskStats = await prisma.task.groupBy({
            by: ["isCompleted"],
            where: {
                userId: userId,
            },
            _count: {
                id: true,
            },
        });

        const recentTasks = await prisma.task.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyProgress = await prisma.task.groupBy({
            by: ["createdAt"],
            where: {
                userId: userId,
                createdAt: {
                    gte: oneWeekAgo,
                },
            },
            _count: {
                id: true,
            },
        });

        return res.status(200).json({
            taskStats,
            recentTasks,
            weeklyProgress,
        });

    } catch (error) {
        console.error("User analytics error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Get users with their task statistics.
async function getUsersWithStats(req, res) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            message: "Invalid pagination parameters",
        });
    }

    const skip = (page - 1) * limit;

    try {
        const users = await prisma.user.findMany({
            skip,
            take: limit,
            include: {
                Task: {
                    where: {
                        isCompleted: false,
                    },
                    select: {
                        id: true,
                    },
                    take: 5,
                },
                _count: {
                    select: {
                        Task: true,
                    },
                },
            },
        });

        const total = await prisma.user.count();
        const pages = Math.ceil(total / limit);

        const safeUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            _count: user._count,
            Task: user.Task,
        }));

        return res.status(200).json({
            users: safeUsers,
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
        console.error("Users analytics error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Search tasks using raw SQL.
async function searchTasks(req, res) {
    const q = req.query.q;

    if (typeof q !== "string" || q.trim().length < 2) {
        return res.status(400).json({
            message: "Search query must be at least 2 characters long",
        });
    }

    const searchTerm = q.trim();
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            message: "Invalid limit parameter",
        });
    }

    try {
        const searchPattern = `%${searchTerm}%`;
        const prefixPattern = `${searchTerm}%`;

        const results = await prisma.$queryRaw`
            SELECT
                t.id,
                t.title,
                t.is_completed AS "isCompleted",
                t.priority,
                t.created_at AS "createdAt",
                t.user_id AS "userId",
                u.name AS "user_name"
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.title ILIKE ${searchPattern}
            OR u.name ILIKE ${searchPattern}
            ORDER BY
                CASE
                    WHEN LOWER(t.title) = LOWER(${searchTerm}) THEN 1
                    WHEN t.title ILIKE ${prefixPattern} THEN 2
                    ELSE 3
                END,
                t.created_at DESC
            LIMIT ${limit}
        `;

        return res.status(200).json({
            results,
            query: searchTerm,
            count: results.length,
        });

    } catch (error) {
        console.error("Task search error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

module.exports = {
    getUserAnalytics,
    getUsersWithStats,
    searchTasks,
};

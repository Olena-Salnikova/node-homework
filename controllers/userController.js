const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

// eslint-disable-next-line no-unused-vars
const cookieFlags = (req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // only when HTTPS is available
        sameSite: "Strict",
    };
};

const setJwtCookie = (req, res, user) => {
    // Sign JWT
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
    // Set cookie. Note that the cookie flags have to be different in production and in test.
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
    return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

const scrypt = util.promisify(crypto.scrypt);

// Hash the password using scrypt with a random salt.
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);

    return `${salt}:${derivedKey.toString("hex")}`;
}

// Compare the provided password with the stored hash.
async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// Register a new user and create three welcome tasks in a transaction.
async function register(req, res, next) {
    if (!req.body) req.body = {};

    const { error, value } = userSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    const { name, email, password } = value;
    const hashedPassword = await hashPassword(password);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email: email.toLowerCase(),
                    hashedPassword,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            });

            await tx.task.createMany({
                data: [
                    {
                        title: "Complete your profile",
                        priority: "medium",
                        userId: user.id,
                    },
                    {
                        title: "Add your first task",
                        priority: "high",
                        userId: user.id,
                    },
                    {
                        title: "Explore the app",
                        priority: "low",
                        userId: user.id,
                    },
                ],
            });

            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: user.id,
                },
            });

            return { user, welcomeTasks };
        });

        const { user, welcomeTasks } = result;

        const csrfToken = setJwtCookie(req, res, user);

        return res.status(201).json({
            name: user.name,
            email: user.email,
            csrfToken,
            user,
            welcomeTasks,
            transactionStatus: "success",
        });

    } catch (error) {
        if (
            error.name === "PrismaClientKnownRequestError" &&
            error.code === "P2002"
        ) {
            return res.status(400).json({
                message: "Email already registered",
            });
        }

        next(error);
    }
}

// Handle user login.
async function logon(req, res) {
    const { email, password } = req.body || {};

    // Validate login credentials before querying the database.
    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password.trim()
    ) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }

    try {
        const normalizedEmail = email?.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        const goodCredentials = user &&
            await comparePassword(password, user.hashedPassword);

        if (!goodCredentials) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const csrfToken = setJwtCookie(req, res, user);

        return res.status(200).json({
            name: user.name,
            email: user.email,
            csrfToken,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Handle user logout.
function logoff(req, res) {
    res.clearCookie("jwt", cookieFlags(req));

    return res.sendStatus(200);
}

module.exports = {
    register,
    logon,
    logoff,
};

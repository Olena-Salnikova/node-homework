const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);

// Hash the password using scrypt with a random salt.
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);

    return `${salt}:${derivedKey.toString("hex")}`;
}

// Register a new user with hashed password.
async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// Handle user registration, login, and logout.
async function register(req, res) {
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

        const result = await pool.query(
            `INSERT INTO users (name, email, hashed_password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email`,
            [name, email, hashedPassword]
        );

        global.user_id = result.rows[0].id;

        return res.status(201).json({ name, email });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({
                message: "Email already registered",
            });
        }

        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// Handle user login.
async function logon(req, res) {
    const { email, password } = req.body || {};
    try {

        const result = await pool.query(
            "SELECT id, name, email, hashed_password FROM users WHERE email = $1",
            [email]
        );

        const user = result.rows[0];

        const goodCredentials = user && await comparePassword(password, user.hashed_password);

        if (!goodCredentials) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        global.user_id = user.id;

        return res.status(200).json({
            name: user.name,
            email: user.email,
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
    global.user_id = null;

    return res.sendStatus(200);
}

module.exports = {
    register,
    logon,
    logoff,
};

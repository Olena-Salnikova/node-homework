function errorHandler(err, req, res, next) {
    void next;

    if (err.name === "PrismaClientInitializationError") {
        console.error("Couldn't connect to the database. Is it running?");
    } else if (err.code === "ECONNREFUSED") {
        console.error(
            "Database connection refused. Make sure PostgreSQL is running."
        );
    } else {
        console.error(err);
    }

    return res.status(500).json({
        message: "Internal server error",
    });
}

module.exports = errorHandler;

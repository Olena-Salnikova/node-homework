function errorHandler(err, req, res, next) {
    void next;

    if (err.code === "ECONNREFUSED") {
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

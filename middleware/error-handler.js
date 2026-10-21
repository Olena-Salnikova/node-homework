function errorHandler(err, req, res, next) {
    void next;

    console.error(err);

    return res.status(500).json({
        message: "Internal server error",
    });
}

module.exports = errorHandler;

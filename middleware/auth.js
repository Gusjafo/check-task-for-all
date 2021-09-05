const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
    // console.log("body: ", req);
    const token = 
    req.headers.cookie["x-access-token"] || req.headers.cookie || req.headers["x-access-token"];
    console.log("token: " + token);
    if(!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.decode(token);
        console.log("decoded: " + decoded);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
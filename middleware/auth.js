// const jwt = require("jsonwebtoken");

// const config = process.env;

const verifyToken = (req, res, next) => {
    // console.log("body: ", req);
    const token = 
    req.headers.cookie["token"] ||
    req.headers.cookie ||
    req.headers["token"];
    // console.log("token: " + token);
    if(!token) {
        return res
        .clearCookie('token', { path: './inicio'})
        .status(403).send("A token is required for authentication");
    }
    try {
        // const decoded = jwt.decode(token);    
        // console.log("decoded: ", decoded);    
        // req.user = decoded;        

    } catch (err) {
        return res
        .clearCookie('token', { path: './inicio'})
        .status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
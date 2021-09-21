const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // console.log("body: ", req);
    let token = 
    req.headers.cookie["token"] ||
    req.headers.cookie ||
    req.headers["token"];
    token = token.split("=").pop();
    if(!token) {
        return res
        .clearCookie('token', { path: '/'})
        .status(403).send("A token is required for authentication");
    }
    try {
        // let decoded = jwt.verify(token, process.env.TOKEN_KEY); 
        let decoded = jwt.decode(token);     
        res.user = decoded;        

    } catch (err) {
        return res
        .clearCookie('token', { path: '/'})
        .status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
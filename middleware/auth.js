const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // console.log("body: ", req);
    let token = 
    req.headers.cookie["token"] ||
    req.headers.cookie ||
    req.headers["token"];
    token = token.split("=").pop();
    // console.log("token en auth: " + token);
    if(!token) {
        return res
        .clearCookie('token', { path: './inicio'})
        .status(403).send("A token is required for authentication");
    }
    try {
        // console.log('en try');
        // let decoded = jwt.verify(token, process.env.TOKEN_KEY); 
        let decoded = jwt.decode(token);   
        // console.log("decoded en auth: ", decoded);    
        res.user = decoded;        

    } catch (err) {
        // console.log('en catch');
        return res
        .clearCookie('token', { path: './inicio'})
        .status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
const jwt = require("jsonwebtoken");

interface JwtPayload {
    email: string;
    password: string;
}

const secretKey = process.env.JWT_SECRET as string;

function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, secretKey);
}

function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, secretKey) as JwtPayload;
}

export { generateToken, verifyToken };

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const JWT_ACCESS = process.env.JWT_ACCESS;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;

// refrehs token logic doesnt nesscarily work currently due to this only being backend. Will have to use access
// tokens in the db instead for now
const JWT_REFRESH = process.env.JWT_REFRESH;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;


export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
//    const { exp, iat, nbf, ...cleanPayload } = payload;
    // console.log(payload);
   return jwt.sign(payload, JWT_ACCESS, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

export function verifyToken(token) {
  try {

    return jwt.verify(token, JWT_ACCESS);

  } catch (error) {
    // console.log(JWT_ACCESS_EXPIRES_IN);
    // const now = Math.floor(Date.now() / 1000); // Current server time in seconds
    // console.log("Server Time (UTC):", new Date(now * 1000).toISOString());
    // console.log(error)
    return null;
  }
}
// to be used for refresh tokens
export function generateToken2(payload) {
//   const { exp, iat, nbf, ...cleanPayload } = payload;
  return jwt.sign(payload, JWT_REFRESH, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyToken2(token) {
  try {
    return jwt.verify(token, JWT_REFRESH);
  } catch (error) {
    return null;
  }
}

export async function authorize(token, refreshToken) {
    if (!token) {
        return null;
    }

    // const token = auth.split(" ")[1];

    const check = verifyToken(token, refreshToken);
    if (!check) {
        return null;
    } else {
        return check;
    }
}
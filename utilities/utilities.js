var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var crypto = require('node:crypto');
var jwt = require("jsonwebtoken");

/**
 * Returns a JSON Web Token 
 * @param {payload} payload data string or buffer
 * @param {secretKey} secretKey the key for the HMAC "hashing" algorithm
 * @return {string} A Hashed JSON Web Token string
 */
function generateJWT(payload, secretKey) { 
    return jwt.sign(payload, secretKey);
}

/**
 * Decodes a JSON Web Token inside a cookie
 * @param {req} req the request object that contains a cookie
 * @param {entryName} entryName the stored setting name
 * @param {secretKey} secretKey the key for the HMAC "hashing" algorithm
 * @return {string} If found, the decoded JSON Web Token string inside the cookie. null otherwise
 */
function decodeJWT(req, entryName, secretKey) { 

    var result = null;
    if ( !req.headers['cookie'] ) return null;

    var token;
    var entries = req.headers['cookie'].split(';');
    for(let i = 0; i < entries.length; i++) {
        var entry = entries[i].split('=');
        if (entry[0] === entryName) { token = entry[1]; }
    }
    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) return null;
        result = decoded;
    });

    return result;
}

/**
 * Generates pseudorandom hexadecimal string using 'crypto'. require('node:crypto')
 * @param {nbytes} nbytes integer number of bytes to generate { <= 2^31 - 1 }.
 * @return {string} hexadecimal string
 */
function randomHexString(nbytes) { 
    return crypto.randomBytes(Math.abs(Math.round(Number(nbytes)))).toString('hex');
}

/**
 * Sends an email using nodemailer (https://www.npmjs.com/package/nodemailer).
 * @param {email} email the email address to send to.
 * @param {subject} subject the subject of your email.
 * @param {htmlContent} htmlContent the message body in HTML format.
 */
async function sendEMail(email, subject, htmlContent) { 
    var emailTransporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      port: parseInt(process.env.MAILING_PORT),
      secure: false,
      auth: {
        type: 'login',
        user: process.env.MAIL_ACCOUNT,
        pass: process.env.APP_PASSWORD }
    });
  
    await emailTransporter.sendMail ({ 
        from: process.env.MAIL_ACCOUNT,
        to: email,
        subject: subject,
        html: htmlContent
    });
}

/**
 * Encrypts a plain text using bcrypt (https://www.npmjs.com/package/bcrypt).
 * (2^costFactor) rounds used to generate salt.
 * @param {costFactor} costFactor Integer (cast implemented). Don't go beyond 15.
 * @param {plainText} plainText string to encrypt.
 * @return {string} The encypted text string.
 */
async function hashString(costFactor, plainText) {
    var rounds = parseInt(costFactor);
    var salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash( plainText, salt );
}

/**
 *  compare plain text to a hashed one using bcrypt (https://www.npmjs.com/package/bcrypt).
 * @param {plainText} plainText String to compare.
 * @param {hashedString} hashedString The encypted text string.
 * @return {boolean} true if they match, false otherwise
 */
async function hashCompare(plainText, hashedString) {
    return await bcrypt.compare(plainText, hashedString);
}

// Exports
module.exports = {
    hashString,
    hashCompare,
    sendEMail,
    randomHexString,
    generateJWT,
    decodeJWT

}

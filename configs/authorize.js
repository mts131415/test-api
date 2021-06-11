const jwt = require('jsonwebtoken');
const fs = require('fs');

const authorization = ((req, res, next) => {
    const authorization = req.headers['authorization']
    if (authorization === undefined) {
        return res.status(401).json({
            "status": 401,
            "message": "Unauthorized 1"
        });
    }
    const token = req.headers['authorization'].split(' ')[1]
    if (token === undefined) {
        return res.status(401).json({
            "status": 401,
            "message": "Unauthorized 2"
        });
    }
    const privateKey = fs.readFileSync('./configs/public.pem', 'utf8')
    jwt.verify(token, privateKey, { algorithms: ['RS256'] }, function (error, payload) {
        if (error) {
            return res.status(401).json({
                "status": 401,
                "message": error
            });
        }
        // console.log(error)
        // console.log(payload)
        // if (payload.role === undefined || payload.role !== 'admin') {
        //     return res.status(403).json({
        //         "status": 403,
        //         "message": "Forbidden"
        //     });
        // }

        //  Complete all authorization
        next()
    })
})

module.exports = authorization
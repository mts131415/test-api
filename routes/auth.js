const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const pool = require('../configs/db');
var router = express.Router();

router.post('/login', function (req, res) {
    let body = req.body;
    let email = body.email;
    let password = body.password;

    //  Find all rows
    let sql = `SELECT t1.id, t1.group_id, t2.group_name, t1.email, t1.image_url, t1.firstname, t1.lastname
    FROM tb_member t1
    INNER JOIN (SELECT id, name AS group_name FROM tb_member_group) t2 ON t2.id = t1.group_id
    WHERE 1 = 1
    AND t1.email = ?
    AND t1.password = MD5(?)`;

    pool.query(sql, [email, password], (err, results) => {
        if (err) throw err
        if (results.length == 0) {
            let json = {
                success: false,
                message: 'Email or password incorrect'
            };
            res.status(401).json(json);
        } else {
            let row = results[0];

            const path = '/uploads/profiles/' + row.image_url;
            row.image_url = req.protocol + '://' + req.get('host') + path;
            let status = 'online';

            //  Create access token
            const privateKey = fs.readFileSync(__dirname + '/../configs/private.pem', 'utf8')
            const payload = {
                id: row.id,
                email: row.email,
                group_id: row.group_id,
                email: row.email
            };
            const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
            const refreshToken = randtoken.uid(256);

            let json = {
                success: true,
                message: 'Login successfully',
                data: { user: row, token: { access_token: accessToken, refresh_token: refreshToken } }
            };
            res.status(200).json(json);
        }
    })
});

router.post('/token', function (req, res) {
    let body = req.body;
    let email = body.email;
    let refresh_token = body.refresh_token;

    //  Find all rows
    let sql = `SELECT t1.id, t1.email, t1.image_url, t1.group_id, t2.name AS group_name, t1.firstname, t1.lastname
    FROM tb_member t1 
    INNER JOIN tb_member_group t2 ON t2.id = t1.group_id
    WHERE 1 = 1
    AND t1.email = ${pool.escape(email)}`;

    pool.query(sql, (err, results) => {
        if (err) throw err
        if (results.length == 0) {
            let json = {
                success: false,
                message: 'Email or password incorrect'
            };
            res.status(401).json(json);
        } else {
            let row = results[0];
            const path = '/uploads/profiles/' + row.image_url;
            row.image_url = req.protocol + '://' + req.get('host') + path;

            //  Create access token
            const privateKey = fs.readFileSync(__dirname + '/../configs/private.pem', 'utf8')
            const payload = {
                id: row.id,
                email: row.email,
                group_id: row.group_id,
                email: row.email
            };
            const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1d' });
            const refreshToken = randtoken.uid(256);

            let json = {
                success: true,
                message: 'Login successfully',
                data: { user: row, token: { access_token: accessToken, refresh_token: refreshToken } }
            };
            res.status(200).json(json);
        }
    })
});

router.post('/logout', function (req, res) {
    let body = req.body;

    let json = {
        success: true,
        message: 'Logout successfully',
    };
    res.status(200).json(json);
});

module.exports = router;
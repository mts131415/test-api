const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const pool = require('../configs/db');
const authorize = require('../configs/authorize');
var router = express.Router();

router.get('/topics', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query
    const search = query.search;
    const category_id = query.category_id;

    let sql = `SELECT id,
    title,
    description
    FROM tb_objection_handler
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')`;
    if (category_id !== '') {
        sql += `AND category_id = ${category_id}`;
    }

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get material successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

module.exports = router;
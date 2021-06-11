const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../../configs/db');
const authorize = require('../../configs/authorize');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
var router = express.Router();

router.get('/materials', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    let sql = `SELECT COUNT(id) AS total_rows
    FROM tb_training_material
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;

    sql += `; SELECT t1.id, t1.title, t2.journal_name, t1.is_enabled
    FROM tb_training_material t1
    INNER JOIN (SELECT id, name AS journal_name FROM tb_overall_landscape) t2 ON t2.id = t1.journal_id
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR t1.title LIKE '%${search}%')
    `;
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get materials successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/materials', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_training_material SET ?`;
    pool.query(sql, body, (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add material successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/materials/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_training_material SET
    is_deleted = 1,
    updated_date = NOW(),
    updated_by = ?
    WHERE 1 = 1
    AND id = ?`;
    pool.query(sql, [userId, id], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Delete material successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/materials/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, journal_id, title, attach_url, is_enabled
    FROM tb_training_material
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get material by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/materials/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Check thumbnail
    if (body.attach_url !== undefined) {
        //  Delete old image
        let sql = `SELECT attach_url
        FROM tb_training_material
        WHERE 1 = 1
        AND id = ?
        `;
        const rows = await pool.query(sql, [id]);
        if (body.attach_url !== undefined) {
            try {
                fs.unlinkSync(__dirname + "/../../uploads/materials/" + rows[0].attach_url);
            } catch (error) {}
        }
    }

    //  Update data
    let sql = `UPDATE tb_training_material SET
    ?,
    updated_date = NOW(),
    updated_by = ?
    WHERE 1 = 1
    AND id = ?`;
    pool.query(sql, [body, userId, id], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Update material successfully',
        };
        res.status(200).json(json);
    })
});

router.post('/materials/upload', function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    const id = body.id;

    const image = req.files.file;
    const ext = path.extname(image.name);
    const newName = uuidv4() + ext;
    const newPath = '/../../uploads/materials/' + newName;
    image.mv(__dirname + newPath, function (err) {
        if (err)
            return res.status(500).send(err);

        const url = newName;

        let json = {
            success: true,
            message: 'Add material file successfully',
            data: { attach_url: url }
        };
        res.status(200).json(json);
    });
});

module.exports = router;
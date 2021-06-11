const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const pool = require('../../configs/db');
const authorize = require('../../configs/authorize');
var router = express.Router();

router.get('/categories', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    let sql = `SELECT COUNT(id) AS total_rows
    FROM tb_landscape_category
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;

    sql += `; SELECT id, name, is_enabled
    FROM tb_landscape_category
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results[1].forEach((row) => {
            row.thumbnail_url = process.env.UPLOADS_URL + '/landscapes/' + row.thumbnail_url;
        });

        let json = {
            success: true,
            message: 'Get categories successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/categories', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_landscape_category SET ?`;
    pool.query(sql, body, (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add category successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/categories/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_landscape_category SET
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
            message: 'Delete category successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/categories/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, name, is_enabled
    FROM tb_landscape_category
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get category by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/categories/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Update data
    let sql = `UPDATE tb_landscape_category SET
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
            message: 'Update category successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/landscapes', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const category_id = query.category_id;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_landscape
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;
    if (category_id !== '-1') {
        sql += `AND category_id = '${category_id}'`;    
    }

    sql += `; SELECT t1.id, t1.title, t1.seq_no, t1.is_enabled, t2.name AS category_name
    FROM tb_landscape t1
    INNER JOIN tb_landscape_category t2 ON t2.id = t1.category_id
    WHERE 1 = 1
    AND t1.is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;
    if (category_id !== '-1') {
        sql += `AND t1.category_id = '${category_id}'`;    
    }
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get landscapes successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/landscapes', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_landscape (category_id, seq_no, title, created_by) SELECT ?, MAX(seq_no) + 1 AS seq_no, ?, ? FROM tb_indication`;
    pool.query(sql, [body.category_id, body.title, body.created_by], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add landscape successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/landscapes/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_landscape SET
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
            message: 'Delete landscape successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/landscapes/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, category_id, seq_no, title, description, is_enabled
    FROM tb_landscape
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get landscape by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/landscapes/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Update data
    let sql = `UPDATE tb_landscape SET
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
            message: 'Update landscape successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/overall/categories', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    let sql = `SELECT COUNT(id) AS total_rows
    FROM tb_overall_landscape_category
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;

    sql += `; SELECT t1.id, t1.name, t2.indication_title, t1.is_enabled
    FROM tb_overall_landscape_category t1
    INNER JOIN (SELECT id, title AS indication_title FROM tb_indication) t2 ON t2.id = t1.indication_id
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
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
            message: 'Get categories successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    });
});

router.post('/overall/categories', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_overall_landscape_category SET ?`;
    pool.query(sql, body, (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add category successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/overall/categories/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_overall_landscape_category SET
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
            message: 'Delete category successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/overall/categories/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, name, indication_id, is_enabled
    FROM tb_overall_landscape_category
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get category by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/overall/categories/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Update data
    let sql = `UPDATE tb_overall_landscape_category SET
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
            message: 'Update category successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/overall/details', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query
    const search = query.search;
    const category_id = query.category_id;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    let sql = `SELECT COUNT(id) AS total_rows
    FROM tb_overall_landscape
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;
    if (category_id !== '-1') {
        sql += `AND category_id = '${category_id}'`;    
    }

    sql += `; SELECT t1.id, t1.name, t2.category_name, t1.is_enabled
    FROM tb_overall_landscape t1
    INNER JOIN (SELECT id, name AS category_name FROM tb_overall_landscape_category) t2 ON t2.id = t1.category_id
    WHERE 1 = 1
    AND t1.is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;
    if (category_id !== '-1') {
        sql += `AND t1.category_id = '${category_id}'`;    
    }
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get details successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    });
});

router.post('/overall/details', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_overall_landscape SET ?`;
    pool.query(sql, body, (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add detail successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/overall/details/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_overall_landscape SET
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
            message: 'Delete detail successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/overall/details/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, name, category_id, name, phase, patiants, io, 
    orr, dor, median_os, median_pfs, grade, followup, key_message, is_enabled
    FROM tb_overall_landscape
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;

    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get detail by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/overall/details/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Update data
    let sql = `UPDATE tb_overall_landscape SET
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
            message: 'Update detail successfully',
        };
        res.status(200).json(json);
    })
});

module.exports = router;
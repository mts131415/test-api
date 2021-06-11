const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../../configs/db');
const authorize = require('../../configs/authorize');
var router = express.Router();

router.get('/profile/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let sql = `SELECT t1.id, t1.email, t1.image_url, t1.group_id, t2.name AS group_name, t1.firstname, t1.lastname
    FROM tb_member t1 
    INNER JOIN tb_member_group t2 ON t2.id = t1.group_id
    WHERE 1 = 1
    AND t1.id = ?`;
    pool.query(sql, [id], (err, results) => {
        if (err)
            return res.status(500).send(err);

        results[0].image_url = process.env.UPLOADS_URL + '/profiles/' + results[0].image_url;

        let json = {
            success: true,
            message: 'Get profile successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.get('/groups', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const type = query.type === undefined ? '' : query.type;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_member_group
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;

    sql += `; SELECT id, name, is_enabled
    FROM tb_member_group
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR name LIKE '%${search}%')
    `;
    if (type === 'all') {
        sql += ` ORDER BY type asc, ${sort_by} ${sort_order}`;
    } else {
        sql += ` ORDER BY ${sort_by} ${sort_order}`;
    }
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get groups successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/groups', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_member_group SET ?`;
    pool.query(sql, body, (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add group successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.get('/groups/:id', authorize, function (req, res) {
    const type = req.params.type;
    const id = req.params.id;

    const sql = `SELECT id, name, is_enabled
    FROM tb_member_group
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get group by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/groups/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    
    let sql = `UPDATE tb_member_group SET
    ?,
    updated_date = NOW(),
    updated_by = ?
    WHERE 1 = 1
    AND id = ?;`;
    pool.query(sql, [body, userId, id], (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Update group successfully'
        };
        res.status(200).json(json);

    })
});

router.delete('/groups/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_member_group SET
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
            message: 'Delete group successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.get('/teams', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query
    const search = query.search;
    const group_ids = query.group_ids;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_member
WHERE 1 = 1
AND is_deleted = 0
AND ('${search}' = '' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%')`;
if (group_ids !== '') {
    sql += `AND group_id IN (${group_ids})`;
}

sql += `; SELECT t1.id,
    email,
    CONCAT(firstname, ' ', lastname) AS name,
    image_url,
    last_login_date,
    created_date,
    is_enabled,
    t2.group_name
FROM tb_member t1
INNER JOIN (SELECT id, name AS group_name FROM tb_member_group) t2 ON t2.id = t1.group_id
WHERE 1 = 1
AND is_deleted = 0
AND ('${search}' = '' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%')`;
if (group_ids !== '') {
    sql += `AND group_id IN (${group_ids})`;
}
sql += ` ORDER BY ${sort_by} ${sort_order}`;
if (rows_per_page !== '-1') {
    sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
}

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results[1].forEach((row) => {
            row.image_url = process.env.UPLOADS_URL + '/profiles/' + row.image_url;
        });

        let json = {
            success: true,
            message: 'Get teams successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/teams', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const password = body.password;
    delete body.password;

    const sql = `INSERT INTO tb_member SET ?, password = MD5(?)`;
    pool.query(sql, [body, password], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add member successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.patch('/teams/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_member SET
    ?,
    updated_date = NOW(),
    updated_by = ?
    WHERE 1 = 1
    AND id = ?
    AND is_deleted = 0`;
    pool.query(sql, [body, userId, id], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Update profile successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/teams/password/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let password = body.password;
    let sql = `UPDATE tb_member SET
    password = MD5(?)
    WHERE 1 = 1
    AND id = ?`;
    pool.query(sql, [password, id], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Update password successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.delete('/teams/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let sql = `UPDATE tb_member SET
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
            message: 'Delete profile successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

module.exports = router;
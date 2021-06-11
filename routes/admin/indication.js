const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../../configs/db');
const authorize = require('../../configs/authorize');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
var router = express.Router();

router.get('/indications', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_indication
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;

    sql += `; SELECT id, title, seq_no, thumbnail_url, is_enabled
    FROM tb_indication
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results[1].forEach((row) => {
            row.thumbnail_url = process.env.UPLOADS_URL + '/indications/' + row.thumbnail_url;
        });

        let json = {
            success: true,
            message: 'Get indications successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/indications', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_indication (seq_no, title, created_by) SELECT MAX(seq_no) + 1 AS seq_no, ?, ? FROM tb_indication`;
    pool.query(sql, [body.title], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add content successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/indications/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_indication SET
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
            message: 'Delete indication successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/indications/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, seq_no, title, description, thumbnail_url, is_enabled
    FROM tb_indication
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        if (results[0].thumbnail_url === null) {
            results[0].thumbnail_url = '';
        } else {
            results[0].thumbnail_url = process.env.UPLOADS_URL + '/indications/' + results[0].thumbnail_url;
        }

        let json = {
            success: true,
            message: 'Get indication by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/indications/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Check thumbnail
    if (body.thumbnail_url !== undefined) {
        //  Delete old image
        let sql = `SELECT thumbnail_url
        FROM tb_indication
        WHERE 1 = 1
        AND id = ?
        `;
        const rows = await pool.query(sql, [id]);
        if (body.thumbnail_url !== undefined) {
            try {
                fs.unlinkSync(__dirname + "/../../uploads/indications/" + rows[0].thumbnail_url);
            } catch (error) {}
        }
    }

    //  Update data
    let sql = `UPDATE tb_indication SET
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
            message: 'Update indication successfully',
        };
        res.status(200).json(json);
    })
});

router.post('/indications/upload', function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    const id = body.id;

    const image = req.files.image;
    const ext = path.extname(image.name);
    const newName = uuidv4() + ext;
    const newPath = '/../../uploads/indications/' + newName;
    image.mv(__dirname + newPath, function (err) {
        if (err)
            return res.status(500).send(err);

        const url = newName;

        let json = {
            success: true,
            message: 'Add indication image successfully',
            data: { image_url: url }
        };
        res.status(200).json(json);
    });
});

router.get('/nccn/versions', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_indication_nccn_version
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;

    sql += `; SELECT t1.id, t1.title, t2.indication_title, t1.thumbnail_url, t1.is_enabled
    FROM tb_indication_nccn_version t1
    INNER JOIN (SELECT id, title AS indication_title FROM tb_indication) t2 ON t2.id = t1.indication_id
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;
    sql += ` ORDER BY ${sort_by} ${sort_order}`;
    if (rows_per_page !== '-1') {
        sql += ` LIMIT ${page * rows_per_page}, ${rows_per_page}`;
    }
    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results[1].forEach((row) => {
            row.thumbnail_url = process.env.UPLOADS_URL + '/nccn/' + row.thumbnail_url;
        });

        let json = {
            success: true,
            message: 'Get nccn versions successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: results[1]
            }
        };
        res.status(200).json(json);
    })
});

router.post('/nccn/versions', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_indication_nccn_version SET ?`;
    pool.query(sql, [body.title], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add version successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/nccn/versions/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_indication_nccn_version SET
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
            message: 'Delete version successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/nccn/versions/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, indication_id, title, description, thumbnail_url, is_enabled
    FROM tb_indication_nccn_version
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        if (results[0].thumbnail_url === null) {
            results[0].thumbnail_url = '';
        } else {
            results[0].thumbnail_url = process.env.UPLOADS_URL + '/nccn/' + results[0].thumbnail_url;
        }

        let json = {
            success: true,
            message: 'Get version by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/nccn/versions/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Check thumbnail
    if (body.thumbnail_url !== undefined) {
        //  Delete old image
        let sql = `SELECT thumbnail_url
        FROM tb_indication_nccn_version
        WHERE 1 = 1
        AND id = ?
        `;
        const rows = await pool.query(sql, [id]);
        if (body.thumbnail_url !== undefined) {
            try {
                fs.unlinkSync(__dirname + "/../../uploads/nccn/" + rows[0].thumbnail_url);
            } catch (error) {}
        }
    }

    //  Update data
    let sql = `UPDATE tb_indication_nccn_version SET
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
            message: 'Update nccn successfully',
        };
        res.status(200).json(json);
    })
});

router.post('/nccn/versions/upload', function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    const id = body.id;

    const image = req.files.image;
    const ext = path.extname(image.name);
    const newName = uuidv4() + ext;
    const newPath = '/../../uploads/nccn/' + newName;
    image.mv(__dirname + newPath, function (err) {
        if (err)
            return res.status(500).send(err);

        const url = newName;

        let json = {
            success: true,
            message: 'Add version image successfully',
            data: { image_url: url }
        };
        res.status(200).json(json);
    });
});

router.get('/nccn/guidelines', authorize, function (req, res) {
    const query = req.query
    const search = query.search;
    const page = query.page;
    const sort_by = query.sort_by;
    const sort_order = query.sort_order;
    const rows_per_page = query.rows_per_page;

    var sql = `SELECT COUNT(id) AS total_rows
    FROM tb_indication_nccn
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
    `;

    sql += `; SELECT t1.id, t1.parent_id, t3.parent_title, t1.title, t2.version_title, t1.is_enabled
    FROM tb_indication_nccn t1
    INNER JOIN (SELECT id, title AS version_title FROM tb_indication_nccn_version) t2 ON t2.id = t1.version_id
    LEFT JOIN (SELECT id, title AS parent_title FROM tb_indication_nccn) t3 ON t3.id = t1.parent_id
    WHERE 1 = 1
    AND is_deleted = 0
    AND ('${search}' = '' OR title LIKE '%${search}%')
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
            message: 'Get nccn guidelines successfully',
            data: {
                total_rows: results[0][0].total_rows,
                items: (rows_per_page === '-1' ? buildHierarchy(results[1]) : results[1])
            }
        };
        res.status(200).json(json);
    })
});

router.post('/nccn/guidelines', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const body = req.body;
    body.created_by = userId;
    const sql = `INSERT INTO tb_indication_nccn SET ?`;
    pool.query(sql, [body.title], (err, results) => {
        if (err)
            return res.status(500).send(err);
        let json = {
            success: true,
            message: 'Add guideline successfully',
            data: { id: results.insertId }
        };
        res.status(200).json(json);
    });
});

router.delete('/nccn/guidelines/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let body = req.body;
    let sql = `UPDATE tb_indication_nccn SET
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
            message: 'Delete guideline successfully',
        };
        res.status(200).json(json);
    })
});

router.get('/nccn/guidelines/:id', authorize, function (req, res) {
    const id = req.params.id;

    const sql = `SELECT id, parent_id, version_id, title, description, is_enabled
    FROM tb_indication_nccn
    WHERE 1 = 1
    AND id = '${id}'
    AND is_deleted = 0`;
    pool.query(sql, (err, results) => {
        if (err || results.length === 0)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get guideline by id successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.patch('/nccn/guidelines/:id', authorize, async function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;
    let body = req.body;

    //  Update data
    let sql = `UPDATE tb_indication_nccn SET
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
            message: 'Update guideline successfully',
        };
        res.status(200).json(json);
    })
});

function buildHierarchy(arry) {
    var roots = [], children = {};

    var data = [];

    // find the top level nodes and hash the children based on parent
    for (var i = 0, len = arry.length; i < len; ++i) {
        var item = arry[i];
            p = item.parent_id,
            target = !p ? roots : (children[p] || (children[p] = []));
        target.push(item);
    }

    // function to recursively build the tree
    var findChildren = function(parent) {
        data.push(parent);
        if (children[parent.id]) {
            for (var i = 0; i < children[parent.id].length; ++i) {
                children[parent.id][i].title = parent.title + ' > ' + children[parent.id][i].title;
            }
            parent.items = children[parent.id];
            for (var i = 0, len = parent.items.length; i < len; ++i) {
                findChildren(parent.items[i]);
            }
        }
    };

    // enumerate through to handle the case where there are multiple roots
    for (var i = 0, len = roots.length; i < len; ++i) {
        findChildren(roots[i]);
    }

    return data;
}

module.exports = router;
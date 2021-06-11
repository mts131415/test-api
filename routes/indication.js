const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const pool = require('../configs/db');
const authorize = require('../configs/authorize');
var router = express.Router();

router.get('/categories', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query;
    const category_ids = query.category_ids;
    const search = query.search;
    const approval_id = query.approval_id;
    const sort_by = query.sort_by;

    let sql = `SELECT id,
    name,
    thumbnail_url
    FROM tb_indication_category
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0`;
    if (category_ids !== undefined && category_ids !== '') {
        sql += ` AND id IN (${category_ids})`;
    }

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results.forEach((row) => {
            const path = '/uploads/indications/' + row.thumbnail_url;
            row.thumbnail_url = req.protocol + '://' + req.get('host') + path;
            row.files_count = 5;
        });

        let json = {
            success: true,
            message: 'Get category successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/approvals', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    let sql = `SELECT id,
    name,
    thumbnail_url
    FROM tb_approval
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0`;

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results.forEach((row) => {
            const path = '/uploads/approvals/' + row.thumbnail_url;
            row.thumbnail_url = req.protocol + '://' + req.get('host') + path
        });

        let json = {
            success: true,
            message: 'Get approval successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/indications', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query;
    const search = query.search;
    const category_id = query.category_id;
    const approval_id = query.approval_id;
    const sort_by = query.sort_by;

    let sql = `SELECT id,
    seq_no,
    title,
    description,
    thumbnail_url
    FROM tb_indication
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

        results.forEach((row) => {
            const path = '/uploads/indications/' + row.thumbnail_url;
            row.thumbnail_url = req.protocol + '://' + req.get('host') + path
            row.files_count = 2;
        });

        let json = {
            success: true,
            message: 'Get indications successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/indications/:id/nccn', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let sql = `SELECT id,
    parent_id,
    title,
    description
    FROM tb_indication_nccn
    WHERE 1 = 1
    AND indication_id = ${id}
    AND is_enabled = 1
    AND is_deleted = 0
    `;

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get indications nccn successfully',
            data: {
                title: 'Non-Small Cell Lung Cancer (NSCLC)',
                description: 'NCCN Guidelines Version 3.2020',
                items: buildHierarchy(results)
            }
        };
        res.status(200).json(json);
    })
});

function buildHierarchy(arry) {
    var roots = [], children = {};

    // find the top level nodes and hash the children based on parent
    for (var i = 0, len = arry.length; i < len; ++i) {
        var item = arry[i],
            p = item.parent_id,
            target = !p ? roots : (children[p] || (children[p] = []));
        target.push(item);
    }

    // function to recursively build the tree
    var findChildren = function(parent) {
        if (children[parent.id]) {
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

    return roots;
}

router.get('/indications/subs', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query;
    const search = query.search;
    const category_id = query.category_id;

    const results = [
        {
            id: 1,
            name: 'MONO Therapy (mNSCLC)',
            items: [
                { id: 11, name: 'KN024' },
                { id: 12, name: 'KN042' }
            ]
        },
        {
            id: 2,
            name: 'Combo Therapy (mNSCLC)',
            items: [
                { id: 21, name: 'KN-189 (Non-Squamous)' },
                { id: 22, name: 'KN-407 (Squamous)' }
            ]
        }
    ];

    let json = {
        success: true,
        message: 'Get indications sub successfully',
        data: results
    };
    res.status(200).json(json);
});

module.exports = router;
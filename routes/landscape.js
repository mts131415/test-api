const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const pool = require('../configs/db');
const authorize = require('../configs/authorize');
var router = express.Router();

router.get('/global', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    // let sql = `SELECT id,
    // name
    // FROM tb_landscape_category
    // WHERE 1 = 1
    // AND is_enabled = 1
    // AND is_deleted = 0`;

    // pool.query(sql, (err, results) => {
    //     if (err)
    //         return res.status(500).send(err);

    //     let json = {
    //         success: true,
    //         message: 'Get category successfully',
    //         data: results
    //     };
    //     res.status(200).json(json);
    // })

    let json = {
        success: true,
        message: 'Get global successfully',
        data: 'http://203.150.107.40:7777/uploads/landscapes/global.png'
    };
    res.status(200).json(json);
});

router.get('/categories', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    let sql = `SELECT id,
    name
    FROM tb_landscape_category
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0`;

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        let json = {
            success: true,
            message: 'Get category successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/landscapes', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const query = req.query
    const search = query.search;
    const category_id = query.category_id;

    let sql = `SELECT id,
    seq_no,
    title,
    description
    FROM tb_landscape
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
            message: 'Get landscapes successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/overall/categories/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    let sql = `SELECT id,
    name
    FROM tb_landscape_category
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0`;

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results.forEach((row) => {
            row.items = [
                { id: 11, name: 'IMPower150' },
                { id: 12, name: 'IMPower130' },
                { id: 13, name: 'KN-189' }
            ]
        });

        let json = {
            success: true,
            message: 'Get category successfully',
            data: results
        };
        res.status(200).json(json);
    })
});

router.get('/overall/details/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    let sql = `SELECT id,
    name
    FROM tb_landscape_category
    WHERE 1 = 1
    AND is_enabled = 1
    AND is_deleted = 0`;

    pool.query(sql, (err, results) => {
        if (err)
            return res.status(500).send(err);

        results.forEach((row) => {
            row.phase = 'PH3 randomized';
            row.patiants = '205 [Atezo 107/ Ct 98]';
            row.io = '1,200mg Q3W';
            row.orr = '38.3%';
            row.dor = 'NR';
            row.medianOS = '20.2 mo(HR 0.59)';
            row.medianPFS = '8.1 mo(HR 0.63)';
            row.grade = '12.9%';
            row.followup = '15.7 mo';
            row.key_message = '<p>OS Benefit</p>';
        });

        let json = {
            success: true,
            message: 'Get detail successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});

router.get('/overall/categories/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    // let sql = `SELECT id,
    // name
    // FROM tb_landscape_category
    // WHERE 1 = 1
    // AND is_enabled = 1
    // AND is_deleted = 0`;

    // pool.query(sql, (err, results) => {
    //     if (err)
    //         return res.status(500).send(err);

    //     results.forEach((row) => {
    //         row.items = [
    //             { id: 11, name: 'IMPower150' },
    //             { id: 12, name: 'IMPower130' },
    //             { id: 13, name: 'KN-189' }
    //         ]
    //     });

    //     let json = {
    //         success: true,
    //         message: 'Get category successfully',
    //         data: results
    //     };
    //     res.status(200).json(json);
    // })

    let results = [];
    results[0] = { id: 1, name: 'Pembrolizumab', items: [{ id: 1, name: 'Keynote-024' },{ id: 2, name: 'Keynote-042' }] };
    results[1] = { id: 2, name: 'Atezolizumab', items: [{ id: 3, name: 'Impower 110' }] };
    results[2] = { id: 3, name: 'Pembrolizumab', items: [{ id: 4, name: 'Keynote-189' },{ id: 5, name: 'Keynote-407' }] };
    results[3] = { id: 4, name: 'Atezolizumab', items: [{ id: 6, name: 'Impower 150' },{ id: 7, name: 'Impower 130' }] };
    results[4] = { id: 5, name: 'Nivolumab', items: [{ id: 8, name: 'Checkmate 227'}] };

    let json = {
        success: true,
        message: 'Get categories successfully',
        data: results
    };
    res.status(200).json(json);
});

router.get('/overall/details/:id', authorize, function (req, res) {
    const token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.id;

    const id = req.params.id;

    let sql = `SELECT *
    FROM tb_overall_landscape
    WHERE 1 = 1
    AND id = ?`;

    pool.query(sql, [id], (err, results) => {
        if (err)
            return res.status(500).send(err);

        // results.forEach((row) => {
        //     row.phase = 'PH3 randomized';
        //     row.patiants = '205 [Atezo 107/ Ct 98]';
        //     row.io = '1,200mg Q3W';
        //     row.orr = '38.3%';
        //     row.dor = 'NR';
        //     row.medianOS = '20.2 mo(HR 0.59)';
        //     row.medianPFS = '8.1 mo(HR 0.63)';
        //     row.grade = '12.9%';
        //     row.followup = '15.7 mo';
        //     row.key_message = '<p>OS Benefit</p>';
        // });

        let json = {
            success: true,
            message: 'Get detail successfully',
            data: results[0]
        };
        res.status(200).json(json);
    })
});


module.exports = router;
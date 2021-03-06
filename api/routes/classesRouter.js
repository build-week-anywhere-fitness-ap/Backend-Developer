require('dotenv').config();
const express = require('express');
const helper = require('../../data/helpers/helperFunctions');

const router = express.Router();

const { restrictedByToken, restrictedById, instructorsOnly } = helper; // deconstructed middleware
const userRestriction = [restrictedByToken, instructorsOnly]; // combines middleware

// ------------ Get All Classes ------------ //

router.get('/classes/', restrictedByToken, async (req, res) => {
    try {
        let classes = await helper.getFromDatabase('classes');

        res.status(200).json(classes);
    } catch (error) {
        res.status(500).send(error);
    }
});

// --------- Get Specific Class ------------ //

router.get('/classes/:id', restrictedByToken, async (req, res) => {
    const { id } = req.params;

    try {
        let foundClass = await helper.getClassById(id);

        res.status(200).json(foundClass);
    } catch (error) {
        res.status(404).send(error);
    }
});

// --------- Get Sessions by Class --------- //

router.get('/classes/:id/sessions/', restrictedByToken, async (req, res) => {
    const { id } = req.params;

    try {
        let sessions = await helper.getSessionsByClass(id);

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).send(error);
    }
});

// --------------- Add Class --------------- //

router.post('/classes/', userRestriction, async (req, res) => {
    const classInfo = req.body;

    try {
        let newClass = await helper.addToDatabase('classes', classInfo);

        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).send(error);
    }
});

// -------------- Update Class ------------- //

router.put('/classes/:id', userRestriction, async (req, res) => {
    const { id } = req.params;
    const classInfo = req.body;

    try {
        let updatedClass = await helper.updateDatabase(
            'classes',
            id,
            classInfo
        );

        res.status(200).json(updatedClass);
    } catch (error) {
        res.status(404).send(error);
    }
});

// -------------- Delete Class ------------- //

router.delete('/classes/:id', userRestriction, async (req, res) => {
    const { id } = req.params;

    try {
        let deletedClass = await helper.deleteFromDatabase('classes', id);

        res.status(200).json(deletedClass);
    } catch (error) {
        res.status(404).send(error);
    }
});

module.exports = router;

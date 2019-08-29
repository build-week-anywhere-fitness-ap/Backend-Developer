require('dotenv').config();
const jwt = require('jsonwebtoken');
const knex = require('knex');
const knexConfig = require('../../knexfile');
const dbEnv = process.env.dbConfig || 'development';

const db = knex(knexConfig[dbEnv]);

// ----------------- Users ----------------- //

const register = user => {
    return db('users')
        .insert(user)
        .returning('id');
};

const loginStart = username => {
    return db('users')
        .where({ username })
        .first();
};

const getUsers = () => {
    return db('users').select(
        'id',
        'username',
        'firstName',
        'lastName',
        'client',
        'instructor'
    );
};

const getUserById = async id => {
    const user = db('users')
        .where({ id })
        .select(
            'id',
            'username',
            'firstName',
            'lastName',
            'client',
            'instructor'
        );

    const classes = db('classes')
        .where({ instructor_id: id })
        .select('id', 'name', 'type', 'location');

    const passes = db('passes')
        .where({ client_id: id })
        .select('id', 'class_id', 'timesUsed', 'completed');

    let result = await Promise.all([user, classes, passes]);

    return {
        ...result[0][0],
        classes: result[1],
        passes: result[2]
    };
};

const updateUser = (id, data) => {
    return db('users')
        .where({ id })
        .first()
        .update(data);
};

const deleteUser = id => {
    return db('users')
        .where({ id })
        .first()
        .del();
};

// --------------- Classes ----------------- //

const getClasses = () => {
    return db('classes').select(
        'id',
        'name',
        'type',
        'location',
        'instructor_id'
    );
};

const getClassById = async id => {
    const foundClass = db('classes')
        .where({ id })
        .first();

    const sessions = db('sessions')
        .where({ class_id: id })
        .select('id', 'dateTime');

    let result = await Promise.all([foundClass, sessions]);

    return { ...result[0], sessions: result[1] };
};

const getClassesByUser = id => {
    return db('classes')
        .where({ instructor_id: id })
        .select('id', 'name', 'type', 'location', 'instructor_id');
};

const addClass = classInfo => {
    return db('classes')
        .insert(classInfo)
        .returning('id');
};

const updateClass = (id, classInfo) => {
    return db('classes')
        .where({ id })
        .first()
        .update(classInfo);
};

const deleteClass = id => {
    return db('classes')
        .where({ id })
        .first()
        .del();
};

// ---------------- Passes ----------------- //

const getPasses = () => {
    return db('passes').select(
        'id',
        'client_id',
        'class_id',
        'timesUsed',
        'completed'
    );
};

const getPassById = id => {
    return db('passes')
        .where({ id })
        .first()
        .select('id', 'client_id', 'class_id', 'timesUsed', 'completed');
};

const getPassesByClient = client_id => {
    return db('passes')
        .where({ client_id })
        .select('id', 'client_id', 'class_id', 'timesUsed', 'completed');
};

const addPass = info => {
    return db('passes')
        .insert(info)
        .returning('id');
};

const updatePass = (id, info) => {
    return db('passes')
        .where({ id })
        .first()
        .update(info);
};

const deletePass = id => {
    return db('passes')
        .where({ id })
        .first()
        .del();
};

// -------------- Sessions ----------------- //

const getSessions = () => {
    return db('sessions').select('id', 'class_id', 'dateTime');
};

const getSessionById = id => {
    return db('sessions')
        .where({ id })
        .first()
        .select('id', 'class_id', 'dateTime');
};

const getSessionsByClass = class_id => {
    return db('sessions')
        .where({ class_id })
        .select('id', 'class_id', 'dateTime');
};

const addSession = info => {
    return db('sessions')
        .insert(info)
        .returning('id');
};

const updateSession = (id, sessionInfo) => {
    return db('sessions')
        .where({ id })
        .first()
        .update(sessionInfo);
};

const deleteSession = id => {
    return db('sessions')
        .where({ id })
        .first()
        .del();
};
// --------------- Tokens ------------------ //

const generateToken = user => {
    const { secret } = process.env;

    const payload = {
        id: user.id,
        instructor: user.instructor,
        client: user.client
    };

    const options = {
        expiresIn: '240m'
    };

    return jwt.sign(payload, secret, options);
};

// ------------ Restrictions --------------- //

const restrictedByToken = (req, res, next) => {
    const token = req.headers.authorization;
    const { secret } = process.env;

    if (token) {
        jwt.verify(token, secret, (error, decodedToken) => {
            if (error) {
                res.status(401).json({
                    message: `Invalid token!`
                });
            } else {
                req.decodedToken = decodedToken;
                next();
            }
        }); // end jwt.verify
    } else {
        res.status(401).json({
            error: `No token found!`
        });
    }
};

const restrictedById = (req, res, next) => {
    const token = req.headers.authorization;
    const { secret } = process.env;

    if (token) {
        jwt.verify(token, secret, (error, decodedToken) => {
            if (decodedToken.id.toString() === req.params.id.toString()) {
                req.decodedToken = decodedToken;
                next();
            } else {
                res.status(401).json({
                    message: `This user isn't authorized to take this action!`
                });
            }
        }); // end jwt.verify
    } else {
        res.status(401).json({
            error: `No token found!`
        });
    }
};

const clientsOnly = (req, res, next) => {
    const token = req.headers.authorization;
    const { secret } = process.env;

    if (token) {
        jwt.verify(token, secret, (error, decodedToken) => {
            if (decodedToken.client) {
                req.decodedToken = decodedToken;
                next();
            } else {
                res.status(401).json({
                    message: `This user isn't authorized to take this action!`
                });
            }
        }); // end jwt.verify
    } else {
        res.status(401).json({
            error: `No token found!`
        });
    }
};

const instructorsOnly = (req, res, next) => {
    const token = req.headers.authorization;
    const { secret } = process.env;

    if (token) {
        jwt.verify(token, secret, (error, decodedToken) => {
            if (decodedToken.instructor) {
                req.decodedToken = decodedToken;
                next();
            } else {
                res.status(401).json({
                    message: `This user isn't authorized to take this action!`
                });
            }
        }); // end jwt.verify
    } else {
        res.status(401).json({
            error: `No token found!`
        });
    }
};

module.exports = {
    register,
    loginStart,
    generateToken,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getClasses,
    getClassById,
    getClassesByUser,
    addClass,
    updateClass,
    deleteClass,
    getPasses,
    getPassById,
    getPassesByClient,
    addPass,
    updatePass,
    deletePass,
    getSessions,
    getSessionById,
    getSessionsByClass,
    addSession,
    updateSession,
    deleteSession,
    restrictedByToken,
    restrictedById,
    clientsOnly,
    instructorsOnly
};

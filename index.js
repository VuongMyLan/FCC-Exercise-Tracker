const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));

// moongoseDB connect
const mongoose = require('mongoose');
mongoose.connect(process.env.mongoURI);
const { User, Exercises } = require('./models/UserSchema');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
    // console.log(req.body);
    const user = new User({ username: req.body.username });
    user.save()
        .then((savedUser) => {
            res.json({
                username: savedUser.username,
                _id: savedUser._id,
            });
        })
        .catch((error) => {
            console.error('Error saving user:', error);
        });
});

app.get('/api/users', (req, res) => {
    User.find({})
        .then((data) => {
            const responseObject = data.map((info) => {
                return {
                    username: info.username,
                    _id: info._id,
                };
            });
            res.json(responseObject);
        })
        .catch((error) => {
            console.error('Error saving user:', error);
        });
});

app.post('/api/users/:_id/exercises', async (req, res) => {
    const userId = req.params._id;
    if (userId != undefined) {
        const newSession = new Exercises({
            description: req.body.description,
            duration: parseInt(req.body.duration),
            date: req.body.date || new Date(),
        });

        newSession.save();

        console.log('userId', userId);

        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.json({});
        }

        User.findOneAndUpdate(
            { _id: userId },
            {
                $push: {
                    log: newSession,
                },
            },
            { new: true }
        )
            .then((data) => {
                const resObj = {};
                if (data == null) {
                    return resObj;
                }
                resObj['_id'] = data._id;
                resObj['username'] = data.username;
                resObj['date'] = new Date(newSession.date).toDateString();
                resObj['duration'] = newSession.duration;
                resObj['description'] = newSession.description;
                res.json(resObj);
            })
            .catch((error) => {
                console.error('Error saving user:', error);
            });
    } else {
        return res.json({ error: 'User ID is required.' });
    }
});

app.get('/api/users/:_id/logs/', (req, res) => {
    let fromDate = new Date('1990-01-01');
    let toDate = new Date();
    let limit;
    if (req.query.from) {
        if (new Date(req.query.from) != 'Invalid Date') {
            fromDate = new Date(req.query.from);
        }
    }

    if (req.query.to) {
        if (new Date(req.query.to) != 'Invalid Date') {
            toDate = new Date(req.query.to);
        }
    }

    if (req.query.limit) {
        limit = req.query.limit;
    }

    User.findById(req.params._id)
        .exec()
        .then((data) => {
            const resObj = {};
            resObj['_id'] = data._id;
            resObj['username'] = data.username;
            resObj['count'] = data.log.length;

            resObj['log'] = data.log.filter((exercise) => {
                return (
                    exercise.date.getTime() >= fromDate.getTime() &&
                    exercise.date.getTime() <= toDate.getTime()
                );
            });
            if (limit) {
                resObj['log'] = resObj['log'].slice(0, limit);
            }

            resObj['log'] = resObj['log'].map((exercise) => {
                const updatedExercise = {
                    ...exercise.toObject(),
                    date: exercise.date.toDateString(),
                };
                return updatedExercise;
            });
            res.json(resObj);
        })
        .catch((err) => console.log(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});

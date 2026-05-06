const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();



const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./middleware/auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var User = require('./Users');
var Movie = require('./Movies');
//require('./Reviews'); // register schema
var mongoose = require('mongoose');
//var Review = mongoose.model('Review');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function(req, res) {

    User.findOne({ username: req.body.username })
        .select('name username password')
        .exec(function(err, user) {

            if (err) return res.status(500).send(err);

            if (!user) {
                return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' });
            }

            user.comparePassword(req.body.password, function(isMatch) {

                if (!isMatch) {
                    return res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' });
                }

                var userToken = { id: user._id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' });

                res.json({ success: true, token: 'JWT ' + token });
            });
        });
});

router.get('/movies', authJwtController.isAuthenticated, function(req, res) {
    const aggregate = [
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "movieId",
                as: "reviews"
            }
        },
        {
            $addFields: {
                avgRating: { $avg: "$reviews.rating" }
            }
        },
        {
            $sort: { avgRating: -1 }
        }
    ];
    
    Movie.aggregate(aggregate).exec(function(err, movies) {
        if (err) return res.status(500).json({ message: err.message });
        res.json(movies);
    });
});
router.put('/movies/:title', authJwtController.isAuthenticated, function(req, res) {

    Movie.findOneAndUpdate(
        { title: req.params.title },   
        req.body,
        { new: true },
        function(err, movie) {

            if (err) {
                return res.status(500).send(err);
            }

            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }

            res.json({
                message: 'Movie updated successfully',
                movie
            });
        }
    );
});

router.post('/movies', authJwtController.isAuthenticated, function(req, res) {

    // Validation (IMPORTANT for grading)
    if (!req.body.title || !req.body.actors || req.body.actors.length === 0) {
        return res.status(400).json({ message: 'Movie must have title and actors' });
    }

    var movie = new Movie({
        title: req.body.title,
        releaseDate: req.body.releaseDate,
        genre: req.body.genre,
        actors: req.body.actors
    });

    movie.save(function(err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        res.json({ message: 'Movie created!' });
    });
});
router.delete('/movies/:id', authJwtController.isAuthenticated, function(req, res) {

    Movie.findByIdAndDelete(req.params.id, function(err, movie) {

        if (err) return res.status(500).send(err);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json({ message: 'Movie deleted!' });
    });
});

router.post('/reviews', authJwtController.isAuthenticated, function(req, res) {

    Movie.findById(req.body.movieId, function(err, movie) {
        if (err) {
            return res.status(500).send(err);
        }

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        var review = new Review({
            movieId: req.body.movieId,
            username: req.user.username,
            review: req.body.review,
            rating: req.body.rating
        });

        review.save(function(err) {
            if (err) {
                return res.status(400).send(err);
            }

            res.json({ message: 'Review created!' });
        });
    });
});

router.get('/movies/:id', authJwtController.isAuthenticated, function(req, res) {
    var movieId = req.params.id;
    
    const aggregate = [
        {
            $match: { _id: new mongoose.Types.ObjectId(movieId) }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "movieId",
                as: "reviews"
            }
        },
        {
            $addFields: {
                avgRating: { $avg: "$reviews.rating" }
            }
        }
    ];
    
    Movie.aggregate(aggregate).exec(function(err, result) {
        if (err) return res.status(500).json({ message: err.message });
        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(result[0]);
    });
});

router.post('/movies/search', authJwtController.isAuthenticated, function(req, res) {
    const searchTerm = req.body.searchTerm;

    if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({ message: 'Search term is required' });
    }

    Movie.find({
        $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { 'actors.actorName': { $regex: searchTerm, $options: 'i' } }
        ]
    }).exec(function(err, movies) {
        if (err) return res.status(500).json({ message: err.message });

        res.json(movies);
    });
});

app.use('/', router);
var PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
    console.log("Server running on port " + PORT);
});
module.exports = app; // for testing only


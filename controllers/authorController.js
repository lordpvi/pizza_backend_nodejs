var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.author_list = (req, res, next) => {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function(err, items) {
            if(err) {
                next(err);
            }
            res.render('author_list', { 
                title: 'Author List', 
                author_list: items
            });
        });
};

exports.author_detail = (req, res, next) => {
    async.parallel({
        author: (cb) => {
            Author.findById(req.params.id)
                .exec(cb);
        }, 
        author_books: (cb) => {
            Book.find({'author': req.params.id}, 'title summary')
                .exec(cb);
        }
    }, (err, results) => {
        if(err) {
            return next(err);
        }

        if(results.author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }

        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author,
            author_books: results.author_books
        });
    });
};

exports.author_create_get = (req, res) => {
    res.render('author_form', {
        title: 'Create Author'
    })
};

exports.author_create_post = [
    body('first_name')
        .isLength({ min: 1 }).trim().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
        .isLength({ min: 1 }).trim().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Create Author',
                author: req.body,
                errors: errors.array()
            });
        } else {
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });

            author.save((err) => {
                if(err) {
                    return next(err);
                }

                res.redirect(author.url);
            });
        }
    }
];

exports.author_delete_get = (req, res, next) => {
    async.parallel({
        author: (cb) => {
            Author.findById(req.params.id)
                .exec(cb);
        },
        author_books: (cb) => {
            Book.find({ 'author': req.params.id })
                .exec(cb);
        }
    }, (err, results) => {
        if(err) {
            return next(err);
        }
        if(results.author==null) {
            res.redirect('/catalog/authors');
        }

        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.author_books
        });
    });
};

exports.author_delete_post = (req, res, next) => {
    async.parallel({
        author: (cb) => {
            Author.findById(req.body.authorid)
                .exec(cb);
        },
        author_books: (cb) => {
            Book.find({ 'author': req.body.authorid })
                .exec(cb);
        }

    }, (err, results) => {
        if(err) {
            return next(err);
        }

        if(results.author_books.length > 0) {
            res.render('author_delete', {
                title: 'Delete Author',
                author: results.author,
                author_books: results.author_books
            });
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, (err) => {
                if(err) {
                    return next(err);
                }

                res.redirect('/catalog/authors');
            });
        }
    });
};

exports.author_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: Author update GET');
};

exports.author_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: Author update POST');
};
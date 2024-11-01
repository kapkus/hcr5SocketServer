const Joi = require('joi');

const userValidator = Joi.object({
    username: Joi.string().min(3).max(50).required()
        .error(errors => {
            errors.forEach(err => {
                switch (err.type) {
                    case 'string.base':
                        err.message = 'Username must be a text.';
                        break;
                    case 'string.empty':
                        err.message = 'Username is required.';
                        break;
                    case 'string.min':
                        err.message = `Username must be at least ${err.context.limit} characters long.`;
                        break;
                    case 'string.max':
                        err.message = `Username must be at most ${err.context.limit} characters long.`;
                        break;
                    case 'any.required':
                        err.message = 'Username is required.';
                        break;
                }
            });
            return errors;
        }),

    password: Joi.string().min(3).required()
        .error(errors => {
            errors.forEach(err => {
                switch (err.type) {
                    case 'string.base':
                        err.message = 'Password must be a text.';
                        break;
                    case 'string.empty':
                        err.message = 'Password is required.';
                        break;
                    case 'string.min':
                        err.message = `Password must be at least ${err.context.limit} characters long.`;
                        break;
                    case 'any.required':
                        err.message = 'Password is required.';
                        break;
                }
            });
            return errors;
        })
}).options({ abortEarly: false });

module.exports = userValidator;

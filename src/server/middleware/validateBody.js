const validateBody = (schema) => {
    return (req, res, next) => {
        const {error} = schema.validate(req.body);
        
        if(error) {
            let details = [];

            if(error.details){
                details = error.details.map((detail) => ({
                    message: detail.message,
                    field: detail.context.key,
                }));
            }

            next(error);
        } else {
            next();
        }
    }
}

module.exports = validateBody;
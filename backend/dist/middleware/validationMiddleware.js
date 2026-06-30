"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const validate = (schema) => {
    return async (req, _res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors
                    .map((err) => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                next(new errors_1.AppError(errorMessages, 400));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;

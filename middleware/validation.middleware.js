import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

export function validationMiddleware(
  dtoClass,
  skipMissingProperties = false,
  whitelist = false
) {
  return (req, res, next) => {
    const dto = plainToClass(dtoClass, req.body);

    validate(dto, {
      skipMissingProperties,
      whitelist,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
    })
      .then((errors) => {
        if (errors.length > 0) {
          const validationErrors = errors.map((error) =>
            Object.values(error.constraints)
          );
          return res.status(400).json({
            status: "failed",
            msg: validationErrors,
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        next();
      });
  };
}

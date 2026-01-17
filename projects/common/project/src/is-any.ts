import {
  registerDecorator,
  validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

import type {} from "reflect-metadata";

interface IsAnyWrapperInterface {
  field: unknown;
}

@ValidatorConstraint({ name: "IsAny", async: true })
class IsAnyValidator implements ValidatorConstraintInterface {
  private readonly validationErrors: string[] = [];

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const validators = args
      .constraints[0] as (new () => IsAnyWrapperInterface)[];

    const results = await Promise.all(
      validators.map((validator) => {
        const instance = new validator();
        instance.field = value;
        return validate(instance);
      }),
    );

    const isValid = results.find((result) => result.length === 0);
    if (isValid === undefined) {
      this.validationErrors.push(
        ...results.map((result) =>
          result
            .map((errors) =>
              Object.entries(errors.constraints || {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(" and "),
            )
            .join(" and "),
        ),
      );
    }
    return isValid !== undefined;
  }

  defaultMessage(_validationArguments?: ValidationArguments): string {
    return this.validationErrors.join(" or ");
  }
}

export function IsAny(
  validators: PropertyDecorator[][],
  options?: ValidationOptions,
): PropertyDecorator {
  const wrappers = validators.map((validator) => {
    class IsAnyWrapper implements IsAnyWrapperInterface {
      field: unknown;
    }
    Reflect.decorate(validator, IsAnyWrapper.prototype, "field", undefined);
    return IsAnyWrapper;
  });
  return (target: object, propertyName: string | symbol) => {
    if (typeof propertyName !== "string") {
      throw new Error(
        `IsAny decorator can only be used on string properties, got ${typeof propertyName}`,
      );
    }
    registerDecorator({
      target: target.constructor,
      propertyName,
      options,
      constraints: [wrappers],
      validator: IsAnyValidator,
    });
  };
}

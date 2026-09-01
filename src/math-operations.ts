/**
 * APL2 Math Operations for TypeScript
 */

import {
    APLType, Scalar, IntegerType, FloatingPointType, ComplexType,
    StringType, ArrayType
} from './types';

export class MathOperations {
    static add(left: APLType, right: APLType): APLType {
        if (left instanceof IntegerType && right instanceof IntegerType) {
            return new IntegerType(left.value + right.value);
        }
        if (left instanceof ComplexType && right instanceof ComplexType) {
            return left.add(right);
        }
        return new FloatingPointType(
            this.toNumeric(left) + this.toNumeric(right)
        );
    }

    static subtract(left: APLType, right: APLType): APLType {
        if (left instanceof IntegerType && right instanceof IntegerType) {
            return new IntegerType(left.value - right.value);
        }
        if (left instanceof ComplexType && right instanceof ComplexType) {
            return left.subtract(right);
        }
        return new FloatingPointType(
            this.toNumeric(left) - this.toNumeric(right)
        );
    }

    static multiply(left: APLType, right: APLType): APLType {
        if (left instanceof IntegerType && right instanceof IntegerType) {
            return new IntegerType(left.value * right.value);
        }
        if (left instanceof ComplexType && right instanceof ComplexType) {
            return left.multiply(right);
        }
        return new FloatingPointType(
            this.toNumeric(left) * this.toNumeric(right)
        );
    }

    static divide(left: APLType, right: APLType): APLType {
        const rval = this.toNumeric(right);
        if (Math.abs(rval) < 1e-15) {
            throw new Error("Division by zero");
        }
        if (left instanceof IntegerType && right instanceof IntegerType) {
            return new FloatingPointType(left.value / right.value);
        }
        if (left instanceof ComplexType && right instanceof ComplexType) {
            return left.divide(right);
        }
        return new FloatingPointType(this.toNumeric(left) / rval);
    }

    static power(left: APLType, right: APLType): APLType {
        const base = this.toNumeric(left);
        const exponent = this.toNumeric(right);
        return new FloatingPointType(Math.pow(base, exponent));
    }

    static negate(operand: APLType): APLType {
        if (operand instanceof IntegerType) {
            return new IntegerType(-operand.value);
        }
        if (operand instanceof ComplexType) {
            return new ComplexType(-operand.real, -operand.imaginary);
        }
        return new FloatingPointType(-this.toNumeric(operand));
    }

    static abs(operand: APLType): APLType {
        if (operand instanceof IntegerType) {
            return new IntegerType(Math.abs(operand.value));
        }
        if (operand instanceof ComplexType) {
            return new FloatingPointType(operand.toNumeric());
        }
        return new FloatingPointType(Math.abs(this.toNumeric(operand)));
    }

    static sqrt(operand: APLType): APLType {
        const value = this.toNumeric(operand);
        if (value < 0) {
            return new ComplexType(0, Math.sqrt(-value));
        }
        return new FloatingPointType(Math.sqrt(value));
    }

    static ceiling(operand: APLType): APLType {
        if (operand instanceof IntegerType) {
            return operand;
        }
        return new IntegerType(Math.ceil(this.toNumeric(operand)));
    }

    static floor(operand: APLType): APLType {
        if (operand instanceof IntegerType) {
            return operand;
        }
        return new IntegerType(Math.floor(this.toNumeric(operand)));
    }

    static sign(operand: APLType): APLType {
        const value = this.toNumeric(operand);
        if (value > 0) return new IntegerType(1);
        if (value < 0) return new IntegerType(-1);
        return new IntegerType(0);
    }

    static log(operand: APLType): APLType {
        const value = this.toNumeric(operand);
        if (value <= 0) {
            throw new Error("Logarithm of non-positive number");
        }
        return new FloatingPointType(Math.log(value));
    }

    static exp(operand: APLType): APLType {
        return new FloatingPointType(Math.exp(this.toNumeric(operand)));
    }

    static sin(operand: APLType): APLType {
        return new FloatingPointType(Math.sin(this.toNumeric(operand)));
    }

    static cos(operand: APLType): APLType {
        return new FloatingPointType(Math.cos(this.toNumeric(operand)));
    }

    static tan(operand: APLType): APLType {
        return new FloatingPointType(Math.tan(this.toNumeric(operand)));
    }

    static max(left: APLType, right: APLType): APLType {
        const lval = this.toNumeric(left);
        const rval = this.toNumeric(right);
        return new FloatingPointType(Math.max(lval, rval));
    }

    static min(left: APLType, right: APLType): APLType {
        const lval = this.toNumeric(left);
        const rval = this.toNumeric(right);
        return new FloatingPointType(Math.min(lval, rval));
    }

    private static toNumeric(value: APLType): number {
        if (value instanceof Scalar) {
            return value.toNumeric();
        }
        throw new Error("Cannot convert non-scalar to numeric");
    }
}

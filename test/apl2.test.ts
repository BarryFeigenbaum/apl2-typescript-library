/**
 * APL2 TypeScript Library Tests
 */

import {
    BooleanType, IntegerType, FloatingPointType, ComplexType,
    StringType, ArrayType
} from '../src/types';
import { MathOperations } from '../src/math-operations';
import { ArrayOperations } from '../src/array-operations';

describe('Scalar Types', () => {
    it('should create boolean types', () => {
        const trueVal = new BooleanType(true);
        const falseVal = new BooleanType(false);
        expect(trueVal.value).toBe(true);
        expect(falseVal.value).toBe(false);
        expect(trueVal.toNumeric()).toBe(1.0);
        expect(falseVal.toNumeric()).toBe(0.0);
    });

    it('should create integer types', () => {
        const num = new IntegerType(42);
        expect(num.value).toBe(42);
        expect(num.toNumeric()).toBe(42.0);
        expect(num.toBoolean()).toBe(true);
    });

    it('should create floating point types', () => {
        const num = new FloatingPointType(3.14);
        expect(num.value).toBeCloseTo(3.14);
        expect(num.toBoolean()).toBe(true);
    });

    it('should create complex types', () => {
        const c = new ComplexType(3.0, 4.0);
        expect(c.real).toBe(3.0);
        expect(c.imaginary).toBe(4.0);
        expect(c.toNumeric()).toBe(5.0); // magnitude
    });

    it('should format values using the default context', () => {
        expect(new BooleanType(true).format()).toBe('1');
        expect(new IntegerType(42).format()).toBe('42');
        expect(new FloatingPointType(3.5).format()).toBe('3.5');
        expect(new ComplexType(3, -4).format()).toBe('3-4i');
        expect(new StringType('APL').format()).toBe('APL');
    });

    it('should compare values using the default context', () => {
        expect(new IntegerType(5).equals(new FloatingPointType(5))).toBe(true);
        expect(new FloatingPointType(1).equals(new FloatingPointType(1 + 1e-12))).toBe(false);
        expect(new ComplexType(2, 0).equals(new IntegerType(2))).toBe(true);
        expect(new StringType('APL').equals(new StringType('APL'))).toBe(true);
    });
});

describe('Math Operations', () => {
    it('should add integers', () => {
        const result = MathOperations.add(new IntegerType(5), new IntegerType(3));
        expect((result as IntegerType).value).toBe(8);
    });

    it('should subtract integers', () => {
        const result = MathOperations.subtract(new IntegerType(10), new IntegerType(3));
        expect((result as IntegerType).value).toBe(7);
    });

    it('should multiply integers', () => {
        const result = MathOperations.multiply(new IntegerType(6), new IntegerType(7));
        expect((result as IntegerType).value).toBe(42);
    });

    it('should divide integers', () => {
        const result = MathOperations.divide(new IntegerType(20), new IntegerType(4));
        expect((result as FloatingPointType).toNumeric()).toBe(5.0);
    });

    it('should throw on division by zero', () => {
        expect(() => {
            MathOperations.divide(new IntegerType(5), new IntegerType(0));
        }).toThrow();
    });

    it('should negate values', () => {
        const result = MathOperations.negate(new IntegerType(42));
        expect((result as IntegerType).value).toBe(-42);
    });

    it('should compute absolute value', () => {
        const result = MathOperations.abs(new IntegerType(-42));
        expect((result as IntegerType).value).toBe(42);
    });

    it('should compute square root', () => {
        const result = MathOperations.sqrt(new FloatingPointType(16.0));
        expect((result as FloatingPointType).toNumeric()).toBe(4.0);
    });
});

describe('Array Operations', () => {
    it('should create arrays', () => {
        const elements = [new IntegerType(1), new IntegerType(2), new IntegerType(3)];
        const array = new ArrayType(elements);
        expect(array.getRank()).toBe(1);
        expect(array.getShape()).toEqual([3]);
    });

    it('should sum array elements', () => {
        const elements = [new IntegerType(1), new IntegerType(2), new IntegerType(3)];
        const array = new ArrayType(elements);
        const result = ArrayOperations.sum(array);
        expect((result as IntegerType).value).toBe(6);
    });

    it('should find product', () => {
        const elements = [new IntegerType(2), new IntegerType(3), new IntegerType(4)];
        const array = new ArrayType(elements);
        const result = ArrayOperations.product(array);
        expect((result as IntegerType).value).toBe(24);
    });

    it('should reverse arrays', () => {
        const elements = [new IntegerType(1), new IntegerType(2), new IntegerType(3)];
        const array = new ArrayType(elements);
        const reversed = ArrayOperations.reverse(array);
        expect((reversed.elements[0] as IntegerType).value).toBe(3);
        expect((reversed.elements[2] as IntegerType).value).toBe(1);
    });

    it('should format arrays and compare them element-wise', () => {
        const left = new ArrayType([new IntegerType(1), new IntegerType(2), new IntegerType(3)]);
        const right = new ArrayType([new IntegerType(1), new IntegerType(2), new IntegerType(3)]);
        const different = new ArrayType([new IntegerType(1), new IntegerType(2), new IntegerType(4)]);

        expect(left.format()).toBe('1 2 3');
        expect(left.equals(right)).toBe(true);
        expect(left.equals(different)).toBe(false);
    });
});

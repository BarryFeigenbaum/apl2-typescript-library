/**
 * APL2 Array Operations for TypeScript
 */

import { APLType, Scalar, IntegerType, ArrayType } from './types';
import { MathOperations } from './math-operations';

export class ArrayOperations {
    static reshape(array: ArrayType, ...newShape: number[]): ArrayType {
        return array.reshape(...newShape);
    }

    static flatten(array: ArrayType): ArrayType {
        return array.flatten();
    }

    static reverse(array: ArrayType): ArrayType {
        const elements = [...array.elements].reverse();
        return new ArrayType(elements, array.getShape());
    }

    static rotate(array: ArrayType, n: number): ArrayType {
        const elements = array.elements;
        const size = elements.length;
        if (size === 0) return array;
        let rotN = n % size;
        if (rotN < 0) rotN += size;
        const rotated = [...elements.slice(-rotN), ...elements.slice(0, -rotN)];
        return new ArrayType(rotated, array.getShape());
    }

    static transpose(array: ArrayType): ArrayType {
        return array.transpose();
    }

    static concatenate(left: ArrayType, right: ArrayType): ArrayType {
        const combined = [...left.elements, ...right.elements];
        const newShape = [...left.getShape()];
        newShape[0] = left.getShape()[0] + right.getShape()[0];
        return new ArrayType(combined, newShape);
    }

    static take(array: ArrayType, n: number): ArrayType {
        const elements = array.elements;
        const size = Math.min(n, elements.length);
        const taken = [...elements.slice(0, size)];
        if (n > elements.length) {
            for (let i = elements.length; i < n; i++) {
                taken.push(new IntegerType(0));
            }
        }
        const newShape = [...array.getShape()];
        newShape[0] = n;
        return new ArrayType(taken, newShape);
    }

    static drop(array: ArrayType, n: number): ArrayType {
        const elements = array.elements;
        const size = Math.max(0, elements.length - n);
        const start = Math.min(n, elements.length);
        const dropped = elements.slice(start);
        const newShape = [...array.getShape()];
        newShape[0] = size;
        return new ArrayType(dropped, newShape);
    }

    static count(array: ArrayType): number {
        return array.elements.filter(
            elem => elem instanceof APLType && (elem as Scalar).toBoolean()
        ).length;
    }

    static sum(array: ArrayType): APLType {
        if (array.elements.length === 0) {
            return new IntegerType(0);
        }
        let result = array.elements[0].deepCopy();
        for (let i = 1; i < array.elements.length; i++) {
            result = MathOperations.add(result, array.elements[i]);
        }
        return result;
    }

    static product(array: ArrayType): APLType {
        if (array.elements.length === 0) {
            return new IntegerType(1);
        }
        let result = array.elements[0].deepCopy();
        for (let i = 1; i < array.elements.length; i++) {
            result = MathOperations.multiply(result, array.elements[i]);
        }
        return result;
    }

    static maximum(array: ArrayType): APLType {
        if (array.elements.length === 0) {
            throw new Error("Cannot find maximum of empty array");
        }
        let result = array.elements[0];
        for (let i = 1; i < array.elements.length; i++) {
            result = MathOperations.max(result, array.elements[i]);
        }
        return result;
    }

    static minimum(array: ArrayType): APLType {
        if (array.elements.length === 0) {
            throw new Error("Cannot find minimum of empty array");
        }
        let result = array.elements[0];
        for (let i = 1; i < array.elements.length; i++) {
            result = MathOperations.min(result, array.elements[i]);
        }
        return result;
    }
}

/**
 * APL2 Type System for TypeScript
 */

import { APLRuntime } from './context';

function formatReal(value: number): string {
    const precision = Math.max(0, APLRuntime.current().printPrecision);
    if (!Number.isFinite(value)) {
        return value.toString();
    }

    const formatted = value.toFixed(precision);
    return precision === 0 ? formatted : formatted.replace(/\.?0+$/, '');
}

function numericEquals(left: number, right: number): boolean {
    return Math.abs(left - right) <= APLRuntime.current().comparisonTolerance;
}

export abstract class APLType {
    abstract getTypeName(): string;
    abstract deepCopy(): APLType;
    abstract getRank(): number;
    abstract getShape(): number[];
    abstract format(): string;
    abstract equals(other: APLType): boolean;

    toString(): string {
        return this.format();
    }
}

export abstract class Scalar extends APLType {
    getRank(): number {
        return 0;
    }

    getShape(): number[] {
        return [];
    }

    abstract toNumeric(): number;
    abstract toBoolean(): boolean;
    abstract toCharacter(): string;
}

export class BooleanType extends Scalar {
    constructor(public value: boolean) {
        super();
    }

    getTypeName(): string {
        return "Boolean";
    }

    deepCopy(): BooleanType {
        return new BooleanType(this.value);
    }

    toNumeric(): number {
        return this.value ? 1.0 : 0.0;
    }

    toBoolean(): boolean {
        return this.value;
    }

    toCharacter(): string {
        return this.value ? '1' : '0';
    }

    format(): string {
        return this.toCharacter();
    }

    equals(other: APLType): boolean {
        if (other instanceof BooleanType) {
            return this.value === other.value;
        }

        if (other instanceof ComplexType) {
            return numericEquals(this.toNumeric(), other.real) && numericEquals(0, other.imaginary);
        }

        if (other instanceof Scalar && !(other instanceof StringType)) {
            return numericEquals(this.toNumeric(), other.toNumeric());
        }

        return false;
    }
}

export class IntegerType extends Scalar {
    constructor(public value: number) {
        super();
        this.value = Math.floor(value);
    }

    getTypeName(): string {
        return "Integer";
    }

    deepCopy(): IntegerType {
        return new IntegerType(this.value);
    }

    toNumeric(): number {
        return this.value;
    }

    toBoolean(): boolean {
        return this.value !== 0;
    }

    toCharacter(): string {
        return String.fromCharCode(this.value);
    }

    format(): string {
        return this.value.toString();
    }

    equals(other: APLType): boolean {
        if (other instanceof ComplexType) {
            return numericEquals(this.value, other.real) && numericEquals(0, other.imaginary);
        }

        if (other instanceof Scalar && !(other instanceof StringType) && !(other instanceof BooleanType)) {
            return numericEquals(this.value, other.toNumeric());
        }

        return false;
    }
}

export class FloatingPointType extends Scalar {
    private static readonly EPSILON = 1e-15;

    constructor(public value: number) {
        super();
    }

    getTypeName(): string {
        return "FloatingPoint";
    }

    deepCopy(): FloatingPointType {
        return new FloatingPointType(this.value);
    }

    toNumeric(): number {
        return this.value;
    }

    toBoolean(): boolean {
        return Math.abs(this.value) > FloatingPointType.EPSILON;
    }

    toCharacter(): string {
        return String.fromCharCode(Math.floor(this.value));
    }

    format(): string {
        return formatReal(this.value);
    }

    equals(other: APLType): boolean {
        if (other instanceof ComplexType) {
            return numericEquals(this.value, other.real) && numericEquals(0, other.imaginary);
        }

        if (other instanceof Scalar && !(other instanceof StringType) && !(other instanceof BooleanType)) {
            return numericEquals(this.value, other.toNumeric());
        }

        return false;
    }
}

export class ComplexType extends Scalar {
    private static readonly EPSILON = 1e-15;

    constructor(public real: number, public imaginary: number) {
        super();
    }

    getTypeName(): string {
        return "Complex";
    }

    deepCopy(): ComplexType {
        return new ComplexType(this.real, this.imaginary);
    }

    toNumeric(): number {
        return Math.sqrt(this.real ** 2 + this.imaginary ** 2);
    }

    toBoolean(): boolean {
        return Math.abs(this.real) > ComplexType.EPSILON || 
               Math.abs(this.imaginary) > ComplexType.EPSILON;
    }

    toCharacter(): string {
        return String.fromCharCode(Math.floor(this.real));
    }

    format(): string {
        if (numericEquals(this.imaginary, 0)) {
            return formatReal(this.real);
        }

        const real = formatReal(this.real);
        const imaginary = formatReal(Math.abs(this.imaginary));
        const sign = this.imaginary < 0 ? '-' : '+';
        return `${real}${sign}${imaginary}i`;
    }

    equals(other: APLType): boolean {
        if (other instanceof ComplexType) {
            return numericEquals(this.real, other.real) && numericEquals(this.imaginary, other.imaginary);
        }

        if (other instanceof Scalar && !(other instanceof StringType) && !(other instanceof BooleanType)) {
            return numericEquals(this.real, other.toNumeric()) && numericEquals(this.imaginary, 0);
        }

        return false;
    }

    add(other: ComplexType): ComplexType {
        return new ComplexType(this.real + other.real, this.imaginary + other.imaginary);
    }

    subtract(other: ComplexType): ComplexType {
        return new ComplexType(this.real - other.real, this.imaginary - other.imaginary);
    }

    multiply(other: ComplexType): ComplexType {
        const real = this.real * other.real - this.imaginary * other.imaginary;
        const imag = this.real * other.imaginary + this.imaginary * other.real;
        return new ComplexType(real, imag);
    }

    divide(other: ComplexType): ComplexType {
        const denominator = other.real ** 2 + other.imaginary ** 2;
        const real = (this.real * other.real + this.imaginary * other.imaginary) / denominator;
        const imag = (this.imaginary * other.real - this.real * other.imaginary) / denominator;
        return new ComplexType(real, imag);
    }
}

export class StringType extends Scalar {
    constructor(public value: string) {
        super();
    }

    getTypeName(): string {
        return "String";
    }

    deepCopy(): StringType {
        return new StringType(this.value);
    }

    toNumeric(): number {
        const num = parseFloat(this.value);
        return isNaN(num) ? 0.0 : num;
    }

    toBoolean(): boolean {
        return this.value.length > 0;
    }

    toCharacter(): string {
        return this.value[0] || '\0';
    }

    format(): string {
        return this.value;
    }

    equals(other: APLType): boolean {
        return other instanceof StringType && this.value === other.value;
    }
}

export class ArrayType extends APLType {
    private static readonly MAX_DEPTH = 15;
    public rank: number;
    public shape: number[];

    constructor(public elements: APLType[], shape?: number[]) {
        super();
        if (shape) {
            this.shape = [...shape];
            const expectedSize = shape.reduce((a, b) => a * b, 1);
            if (elements.length !== expectedSize) {
                throw new Error(`Elements size ${elements.length} doesn't match shape ${shape}`);
            }
        } else {
            this.shape = [elements.length];
        }
        this.rank = this.shape.length;
    }

    getTypeName(): string {
        return "Array";
    }

    deepCopy(): ArrayType {
        return new ArrayType(
            this.elements.map(e => e.deepCopy()),
            this.shape
        );
    }

    getRank(): number {
        return this.rank;
    }

    getShape(): number[] {
        return [...this.shape];
    }

    getElement(...indices: number[]): APLType {
        const flatIndex = this.toFlatIndex(...indices);
        const element = this.elements[flatIndex];
        if (element === undefined) {
            throw new Error(`Index ${indices} out of bounds for shape ${this.shape}`);
        }
        return element;
    }

    private toFlatIndex(...indices: number[]): number {
        if (indices.length !== this.rank) {
            throw new Error(`Expected ${this.rank} indices, received ${indices.length}`);
        }

        const indexOrigin = APLRuntime.current().indexOrigin;
        let flatIndex = 0;
        let multiplier = 1;
        for (let i = this.rank - 1; i >= 0; i--) {
            const index = indices[i];
            const dimension = this.shape[i];
            if (index === undefined || dimension === undefined) {
                throw new Error(`Index ${indices} out of bounds for shape ${this.shape}`);
            }

            const adjustedIndex = index - indexOrigin;
            if (adjustedIndex < 0 || adjustedIndex >= dimension) {
                throw new Error(`Index ${indices} out of bounds for shape ${this.shape}`);
            }
            flatIndex += adjustedIndex * multiplier;
            multiplier *= dimension;
        }
        return flatIndex;
    }

    reshape(...newShape: number[]): ArrayType {
        const newSize = newShape.reduce((a, b) => a * b, 1);
        if (newSize !== this.elements.length) {
            throw new Error(`Cannot reshape array of size ${this.elements.length} to shape ${newShape}`);
        }
        return new ArrayType(this.elements, newShape);
    }

    flatten(): ArrayType {
        return new ArrayType(this.elements);
    }

    transpose(): ArrayType {
        if (this.rank !== 2) {
            throw new Error("Transpose only works on 2-D arrays");
        }
        const [rows, cols] = this.shape;
        const transposed: APLType[] = [];
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows; i++) {
                const element = this.elements[i * cols + j];
                if (element === undefined) {
                    throw new Error("Transpose encountered an invalid array element");
                }
                transposed.push(element);
            }
        }
        return new ArrayType(transposed, [cols, rows]);
    }

    format(): string {
        const formattedElements = this.elements.map(element => element.format());
        const formatted = formattedElements.join(' ');
        const { printWidth } = APLRuntime.current();
        if (formatted.length <= printWidth) {
            return formatted;
        }

        if (printWidth <= 3) {
            return printWidth === 0 ? '' : '.'.repeat(printWidth);
        }

        const limit = printWidth - 3;
        const visible: string[] = [];
        let currentLength = 0;

        for (const element of formattedElements) {
            const nextLength = currentLength === 0
                ? element.length
                : currentLength + 1 + element.length;
            if (nextLength > limit) {
                break;
            }

            visible.push(element);
            currentLength = nextLength;
        }

        return visible.length === 0 ? '...' : `${visible.join(' ')}...`;
    }

    equals(other: APLType): boolean {
        return other instanceof ArrayType &&
            this.rank === other.rank &&
            this.shape.length === other.shape.length &&
            this.shape.every((dimension, index) => dimension === other.shape[index]) &&
            this.elements.length === other.elements.length &&
            this.elements.every((element, index) => element.equals(other.elements[index] as APLType));
    }
}

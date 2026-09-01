/**
 * APL2 Type System for TypeScript
 */

export abstract class APLType {
    abstract getTypeName(): string;
    abstract deepCopy(): APLType;
    abstract getRank(): number;
    abstract getShape(): number[];
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
        if (indices.length === 1) {
            return this.elements[indices[0]];
        }
        const flatIndex = this.toFlatIndex(...indices);
        return this.elements[flatIndex];
    }

    private toFlatIndex(...indices: number[]): number {
        let flatIndex = 0;
        let multiplier = 1;
        for (let i = this.rank - 1; i >= 0; i--) {
            if (indices[i] < 0 || indices[i] >= this.shape[i]) {
                throw new Error(`Index ${indices} out of bounds for shape ${this.shape}`);
            }
            flatIndex += indices[i] * multiplier;
            multiplier *= this.shape[i];
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
                transposed.push(this.elements[i * cols + j]);
            }
        }
        return new ArrayType(transposed, [cols, rows]);
    }
}

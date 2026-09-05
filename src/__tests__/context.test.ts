import {
    APLContext,
    APLRuntime,
    createContext,
    currentContext,
    popContext,
    pushContext
} from '../context';
import { ArrayType, FloatingPointType, IntegerType } from '../types';

function resetDefaultRuntime(): void {
    while (APLRuntime.currentContext().indexOrigin !== 0 ||
        APLRuntime.currentContext().printWidth !== 80 ||
        APLRuntime.currentContext().printPrecision !== 6 ||
        APLRuntime.currentContext().comparisonTolerance !== 1e-15) {
        const previous = APLRuntime.currentContext();
        popContext();
        if (APLRuntime.currentContext() === previous) {
            break;
        }
    }
}

describe('APL runtime context', () => {
    afterEach(() => {
        resetDefaultRuntime();
    });

    it('creates contexts with defaults', () => {
        const context = createContext();

        expect(context).toBeInstanceOf(APLContext);
        expect(context.indexOrigin).toBe(0);
        expect(context.printWidth).toBe(80);
        expect(context.printPrecision).toBe(6);
        expect(context.comparisonTolerance).toBe(1e-15);
    });

    it('supports stack push/pop nesting on the default runtime', () => {
        pushContext({ indexOrigin: 1 });
        expect(currentContext().indexOrigin).toBe(1);

        pushContext({ printPrecision: 3 });
        expect(currentContext().indexOrigin).toBe(1);
        expect(currentContext().printPrecision).toBe(3);

        popContext();
        expect(currentContext().indexOrigin).toBe(1);
        expect(currentContext().printPrecision).toBe(6);

        popContext();
        expect(currentContext().indexOrigin).toBe(0);
    });

    it('isolates stack state across runtime instances', () => {
        const runtimeA = new APLRuntime();
        const runtimeB = new APLRuntime();

        runtimeA.pushContext({ indexOrigin: 1, printPrecision: 2 });
        runtimeB.pushContext({ indexOrigin: 0, printPrecision: 8 });

        expect(runtimeA.currentContext().indexOrigin).toBe(1);
        expect(runtimeA.currentContext().printPrecision).toBe(2);
        expect(runtimeB.currentContext().indexOrigin).toBe(0);
        expect(runtimeB.currentContext().printPrecision).toBe(8);
    });

    it('uses index origin when accessing array elements', () => {
        const array = new ArrayType([
            new IntegerType(10),
            new IntegerType(20),
            new IntegerType(30)
        ]);

        expect((array.getElement(0) as IntegerType).value).toBe(10);

        pushContext({ indexOrigin: 1 });
        try {
            expect((array.getElement(1) as IntegerType).value).toBe(10);
            expect((array.getElement(3) as IntegerType).value).toBe(30);
            expect(() => array.getElement(0)).toThrow();
        } finally {
            popContext();
        }
    });

    it('uses print precision when formatting floating-point values', () => {
        const value = new FloatingPointType(3.1415926535);

        expect(value.format()).toBe('3.14159');

        pushContext({ printPrecision: 2 });
        try {
            expect(value.format()).toBe('3.1');
        } finally {
            popContext();
        }
    });

    it('uses print width when formatting arrays', () => {
        const array = new ArrayType([
            new IntegerType(10),
            new IntegerType(20),
            new IntegerType(30),
            new IntegerType(40),
            new IntegerType(50)
        ]);

        expect(array.format()).toBe('10 20 30 40 50');

        pushContext({ printWidth: 8 });
        try {
            expect(array.format()).toBe('10 20...');
        } finally {
            popContext();
        }
    });

    it('uses comparison tolerance when testing equality', () => {
        const left = new FloatingPointType(1);
        const right = new FloatingPointType(1 + 5e-7);

        expect(left.equals(right)).toBe(false);

        pushContext({ comparisonTolerance: 1e-6 });
        try {
            expect(left.equals(right)).toBe(true);
        } finally {
            popContext();
        }
    });
});

import { APLContext, APLRuntime } from '../src/context';
import { ArrayType, FloatingPointType, IntegerType } from '../src/types';

function resetRuntime(): void {
    while (true) {
        const current = APLRuntime.current();
        APLRuntime.pop();
        if (APLRuntime.current() === current) {
            return;
        }
    }
}

describe('APL runtime context', () => {
    afterEach(() => {
        resetRuntime();
    });

    it('creates contexts with the expected defaults', () => {
        const context = APLRuntime.create();

        expect(context).toBeInstanceOf(APLContext);
        expect(context.indexOrigin).toBe(0);
        expect(context.printWidth).toBe(80);
        expect(context.printPrecision).toBe(6);
        expect(context.comparisonTolerance).toBe(1e-15);
    });

    it('isolates async context state with AsyncLocalStorage', async () => {
        const results = await Promise.all(
            [1, 0].map(async indexOrigin => {
                return APLRuntime.run({ indexOrigin }, async () => {
                    await new Promise(resolve => setTimeout(resolve, indexOrigin === 1 ? 10 : 0));
                    return APLRuntime.current().indexOrigin;
                });
            })
        );

        expect(results).toEqual([1, 0]);
        expect(APLRuntime.current().indexOrigin).toBe(0);
    });

    it('uses index origin when accessing array elements', () => {
        const array = new ArrayType([
            new IntegerType(10),
            new IntegerType(20),
            new IntegerType(30)
        ]);

        expect((array.getElement(0) as IntegerType).value).toBe(10);

        APLRuntime.push({ indexOrigin: 1 });
        try {
            expect((array.getElement(1) as IntegerType).value).toBe(10);
            expect((array.getElement(3) as IntegerType).value).toBe(30);
            expect(() => array.getElement(0)).toThrow();
        } finally {
            APLRuntime.pop();
        }
    });

    it('uses print precision when formatting floating-point values', () => {
        const value = new FloatingPointType(3.1415926535);

        expect(value.format()).toBe('3.14159');

        APLRuntime.push({ printPrecision: 2 });
        try {
            expect(value.format()).toBe('3.1');
        } finally {
            APLRuntime.pop();
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

        APLRuntime.push({ printWidth: 8 });
        try {
            expect(array.format()).toBe('10 20...');
        } finally {
            APLRuntime.pop();
        }
    });

    it('does not split formatted elements when truncating arrays', () => {
        const array = new ArrayType([
            new IntegerType(10),
            new IntegerType(200),
            new IntegerType(3000)
        ]);

        APLRuntime.push({ printWidth: 7 });
        try {
            expect(array.format()).toBe('10...');
        } finally {
            APLRuntime.pop();
        }
    });

    it('uses comparison tolerance when testing equality', () => {
        const left = new FloatingPointType(1);
        const right = new FloatingPointType(1 + 5e-7);

        expect(left.equals(right)).toBe(false);

        APLRuntime.push({ comparisonTolerance: 1e-6 });
        try {
            expect(left.equals(right)).toBe(true);
        } finally {
            APLRuntime.pop();
        }
    });
});

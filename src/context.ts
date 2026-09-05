import { AsyncLocalStorage } from 'node:async_hooks';

export class APLContext {
    constructor(
        public indexOrigin: number = 0,
        public printWidth: number = 80,
        public printPrecision: number = 6,
        public comparisonTolerance: number = 1e-15
    ) {}

    clone<T extends APLContext = APLContext>(overrides: Partial<T> = {}): T {
        const context = new APLContext(
            overrides.indexOrigin ?? this.indexOrigin,
            overrides.printWidth ?? this.printWidth,
            overrides.printPrecision ?? this.printPrecision,
            overrides.comparisonTolerance ?? this.comparisonTolerance
        );
        return context as T;
    }
}

export class APLRuntime {
    private static readonly storage = new AsyncLocalStorage<APLContext[]>();
    private static fallbackStack: APLContext[] = [new APLContext()];

    static create<T extends APLContext = APLContext>(overrides: Partial<T> = {}): T {
        return new APLContext().clone(overrides);
    }

    static push<T extends APLContext = APLContext>(contextOrOverrides: Partial<T> | T = {}): T {
        if (this.storage.getStore()) {
            throw new Error('Use APLRuntime.run() to scope async context changes');
        }

        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.current<T>().clone(contextOrOverrides);
        const stack = [...this.getStack(), context];
        this.setStack(stack);
        return context as T;
    }

    static pop<T extends APLContext = APLContext>(): T {
        if (this.storage.getStore()) {
            throw new Error('Use APLRuntime.run() to scope async context changes');
        }

        const stack = this.getStack();
        const removed = stack[stack.length - 1] as T;
        if (stack.length <= 1) {
            return removed;
        }

        const nextStack = stack.slice(0, -1);
        this.setStack(nextStack);
        return removed;
    }

    static current<T extends APLContext = APLContext>(): T {
        const stack = this.getStack();
        return stack[stack.length - 1] as T;
    }

    static run<TResult, T extends APLContext = APLContext>(
        contextOrOverrides: Partial<T> | T,
        callback: () => TResult
    ): TResult {
        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.current<T>().clone(contextOrOverrides);
        const stack = [...this.getStack(), context];
        return this.storage.run(stack, callback);
    }

    private static getStack(): APLContext[] {
        return this.storage.getStore() ?? this.fallbackStack;
    }

    private static setStack(stack: APLContext[]): void {
        if (!this.storage.getStore()) {
            this.fallbackStack = stack;
            return;
        }

        this.storage.enterWith(stack);
    }
}

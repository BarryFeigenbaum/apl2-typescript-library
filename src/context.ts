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
        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.current<T>().clone(contextOrOverrides);
        const stack = [...this.getStack(), context];
        this.setStack(stack);
        return context as T;
    }

    static pop<T extends APLContext = APLContext>(): T {
        const stack = this.getStack();
        if (stack.length <= 1) {
            return stack[0] as T;
        }

        const nextStack = stack.slice(0, -1);
        this.setStack(nextStack);
        return nextStack[nextStack.length - 1] as T;
    }

    static current<T extends APLContext = APLContext>(): T {
        const stack = this.getStack();
        return stack[stack.length - 1] as T;
    }

    private static getStack(): APLContext[] {
        return this.storage.getStore() ?? this.fallbackStack;
    }

    private static setStack(stack: APLContext[]): void {
        if (this.storage.getStore()) {
            this.storage.enterWith(stack);
            return;
        }

        this.fallbackStack = stack;
        this.storage.enterWith(stack);
    }
}

export class APLContext {
    constructor(
        public indexOrigin: number = 0,
        public printWidth: number = 80,
        public printPrecision: number = 6,
        public comparisonTolerance: number = 1e-15
    ) {}

    clone(overrides: Partial<APLContext> = {}): APLContext {
        return new APLContext(
            overrides.indexOrigin ?? this.indexOrigin,
            overrides.printWidth ?? this.printWidth,
            overrides.printPrecision ?? this.printPrecision,
            overrides.comparisonTolerance ?? this.comparisonTolerance
        );
    }
}

export class APLRuntime {
    private static readonly stacks = new WeakMap<APLRuntime, APLContext[]>();
    private static readonly defaultRuntime = new APLRuntime();

    constructor(initialContext: APLContext = new APLContext()) {
        APLRuntime.stacks.set(this, [initialContext.clone()]);
    }

    createContext(overrides: Partial<APLContext> = {}): APLContext {
        return this.currentContext().clone(overrides);
    }

    currentContext(): APLContext {
        return this.getStack()[this.getStack().length - 1] as APLContext;
    }

    pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        const context = contextOrOverrides instanceof APLContext
            ? contextOrOverrides.clone()
            : this.currentContext().clone(contextOrOverrides);
        this.getStack().push(context);
        return context;
    }

    popContext(): APLContext {
        const stack = this.getStack();
        if (stack.length <= 1) {
            return stack[0] as APLContext;
        }
        return stack.pop() as APLContext;
    }

    private getStack(): APLContext[] {
        const stack = APLRuntime.stacks.get(this);
        if (stack === undefined) {
            const defaultStack = [new APLContext()];
            APLRuntime.stacks.set(this, defaultStack);
            return defaultStack;
        }
        return stack;
    }

    static createContext(overrides: Partial<APLContext> = {}): APLContext {
        return this.defaultRuntime.createContext(overrides);
    }

    static currentContext(): APLContext {
        return this.defaultRuntime.currentContext();
    }

    static pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        return this.defaultRuntime.pushContext(contextOrOverrides);
    }

    static popContext(): APLContext {
        return this.defaultRuntime.popContext();
    }

    static create(overrides: Partial<APLContext> = {}): APLContext {
        return this.createContext(overrides);
    }

    static current(): APLContext {
        return this.currentContext();
    }

    static push(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
        return this.pushContext(contextOrOverrides);
    }

    static pop(): APLContext {
        return this.popContext();
    }
}

export function createContext(overrides: Partial<APLContext> = {}): APLContext {
    return APLRuntime.createContext(overrides);
}

export function currentContext(): APLContext {
    return APLRuntime.currentContext();
}

export function pushContext(contextOrOverrides: Partial<APLContext> | APLContext = {}): APLContext {
    return APLRuntime.pushContext(contextOrOverrides);
}

export function popContext(): APLContext {
    return APLRuntime.popContext();
}

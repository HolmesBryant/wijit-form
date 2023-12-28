/**
 * Simple class to unit test web components
 * @usage
 * import Tester from "/tester.js";
 * const component = new MyWebComponentName();
 * const tester = await new Tester(component);
 *
 * tester.test('should call sayHello() when button is clicked', () => {
 *    // ... test setup and assertions
 * });
 */
export default class Tester {
    instance;
    // componentClass;
    testResults = [];

    constructor(instance) {
        this.instance = instance;
        // this.init();
    }

    async init() {
        // this.componentClass = await customElements.whenDefined(this.instance.localName);
    }

    test(description, callback) {
        try {
          callback();
          this.testResults.push({ description, passed: true });
        } catch (error) {
          this.testResults.push({ description, passed: false, error });
          console.error(error);
        }
    }

    is (actual, expected, message) {
        const msg = `${actual} is not a ${expected}`;
        if (actual instanceof expected) {
        } else {
            throw new Error(`Failed: ${message || msg}`)
        }
    }

    isEqual(actual, expected, message) {
        const msg = `${actual} is not equal to ${expected}`;
        if (actual !== expected) {
          throw new Error(`Failed: ${message || msg}`);
        }
    }

    isBool (actual=Bool, message) {
        const msg = `${actual} is not Boolean`;
        if (typeof actual !== "boolean") {
            throw new Error(`Failed: ${message || msg}`);
        }
    }

    isOneOf (actual='', allowed=[], message) {
        if (!Array.isArray(allowed)) allowed = [allowed];
        const msg = `"${actual}" is not one of [${allowed}]`;
        if (allowed.indexOf(actual) === -1) {
            throw new Error (`Failed: ${message || msg}`)
        }
    }

    isType (actual, allowed=[], message) {
        let ret = false;
        if (!Array.isArray(allowed)) allowed = [allowed];
        const msg = `type of ${actual} is not one of [${allowed}]`;
        for (const item of allowed) {
            if (typeof actual === item) ret = true;
        }
        if (!ret) {
            throw new Error(`Failed: ${message || msg}`)
        }
    }

    isNodeList (actual, message) {
        const msg = `${actual} is not a NodeList`;
        if (!NodeList.prototype.isPrototypeOf(actual)) {
            throw new Error (`Failed: ${message || msg}`)
        }
    }


    getAllCombinations(options) {
        return Object.entries(options).reduce(
            (acc, [key, values]) =>
            acc.flatMap((combination) =>
                values.map((value) => ({ ...combination, [key]: value }))
            ),
            [[]]
        );
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    setAttributes(attrs) {
        for (let attr in attrs) {
            attr = this.camelToKebab(attr);
            this.instance.setAttribute(attr, attrs[attr]);
        }
    }


    printResults() {
        console.log("Test Results:");
        this.testResults.forEach(result => {
            console.log(`- ${result.description}: ${result.passed ? "PASSED" : "FAILED"}`);
            if (!result.passed) console.error(result.error);
        });
    }
}

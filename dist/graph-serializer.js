(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A scheme is in the context of our serializer defined as a pair of a serializer and a deserializer.
     */
    var Scheme = /** @class */ (function () {
        function Scheme() {
            this.serializer = function (v) { return v; };
            this.deserializer = function (v) { return v; };
        }
        return Scheme;
    }());
    exports.Scheme = Scheme;
    /**
     * Property decorator storage.
     *
     * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
     * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
     */
    var PropertyDescription = /** @class */ (function () {
        function PropertyDescription(propertyName, settings) {
            if (settings === void 0) { settings = {}; }
            this.name = propertyName;
            this.setDecoration(settings);
        }
        /**
         * Add new property decorator settings here.
         *
         * @param {DescriptionSettings} settings
         * @returns {PropertyDescription}
         */
        PropertyDescription.prototype.setDecoration = function (settings) {
            this.scheme = typeof settings.scheme === 'undefined'
                ? new Scheme()
                : settings.scheme;
            this.serializedName = typeof settings.serializedName === 'undefined'
                ? this.name
                : settings.serializedName;
            return this;
        };
        return PropertyDescription;
    }());
    exports.PropertyDescription = PropertyDescription;
    /**
     * Class decorator storage.
     *
     * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
     * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
     */
    var ClassDescription = /** @class */ (function () {
        function ClassDescription() {
            this.postDeserialize = function () { };
            this.properties = new Map();
        }
        /**
         * Store decoration
         * @param {DescriptionSettings} settings
         * @returns {ClassDescription}
         */
        ClassDescription.prototype.setDecoration = function (settings) {
            if (typeof settings === 'undefined')
                return this;
            this.postDeserialize = typeof settings.postDeserialize === 'undefined'
                ? function () { }
                : settings.postDeserialize;
            return this;
        };
        return ClassDescription;
    }());
    exports.ClassDescription = ClassDescription;
    /**
     * Main decorator storage. This class will store and provide access to all decorators. An instance is instantiated
     * below.
     */
    var Store = /** @class */ (function () {
        function Store() {
            this.map = new Map();
        }
        /**
         * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
         * are optional, and this ensures we will get a default one when requested
         *
         * @param key
         * @returns {ClassDescription}
         */
        Store.prototype.get = function (key) {
            if (!this.map.has(key)) {
                this.map.set(key, new ClassDescription());
            }
            return this.map.get(key);
        };
        return Store;
    }());
    exports.Store = Store;
    /**
     * Store object to hold our configuration. This needs not be exported because is should only be used internally.
     * @type {Store}
     */
    var store = new Store();
    /**
     * Serializer. Converts a JSON serializable tree to an object instance.
     *
     * @param type
     * @param src
     * @returns {any}
     */
    function deserialize(type, src) {
        if (src === null)
            return null;
        var ret = new type();
        var isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
        if (isDerivedClass) {
            var extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
            Object.assign(ret, deserialize(extendedType, src));
        }
        store.get(type).properties.forEach(function (property, propertyName) {
            if (typeof src[propertyName] !== 'undefined') {
                ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
            }
        });
        store.get(type).postDeserialize(ret);
        return ret;
    }
    exports.deserialize = deserialize;
    /**
     * Deserializer function. Converts an object to a JSON serializable graph.
     *
     * @param src
     * @returns {{[p: string]: any}}
     */
    function serialize(src) {
        var ret = {};
        //parent
        if (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor !== Object) {
            var superClass = new (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor)();
            Object.assign(ret, serialize(superClass));
        }
        store.get(src.constructor).properties.forEach(function (property, propertyName) {
            ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
        });
        return ret;
    }
    exports.serialize = serialize;
    /**
     * Primitive scheme type.
     * The default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    exports.primitive = new Scheme();
    /**
     * Date scheme type.
     * This scheme will properly serialize and deserialize javascript Date objects.
     *
     * Example usage:
     * ```
     * class TestClass {
     *  @serializable(date)
     *  public children: Date;
     * }
     * ```
     *
     * @type {Scheme}
     */
    exports.date = (function () {
        var scheme = new Scheme();
        scheme.serializer = function (v) { return (v instanceof Date) ? v.toJSON() : v; };
        scheme.deserializer = function (v) { return (typeof v === 'string') ? new Date(v) : v; };
        return scheme;
    })();
    /**
     * Array scheme type
     * The array function will apply a scheme to all of its children.
     *
     * Example usage:
     * ```
     * class TestClass {
     *  @serializable(array())
     *  public children: string[];
     * }
     * ```
     *
     * @param {Scheme} childScheme
     * @returns {Scheme}
     */
    function array(childScheme) {
        if (childScheme === void 0) { childScheme = exports.primitive; }
        var scheme = new Scheme();
        scheme.serializer = function (v) {
            return v.map(function (w) { return childScheme.serializer(w); });
        };
        scheme.deserializer = function (v) {
            if (v === undefined)
                return v;
            return v.map(function (w) { return childScheme.deserializer(w); });
        };
        return scheme;
    }
    exports.array = array;
    /**
     * Object scheme type
     * The object function will serialize a nested object
     *
     * Example usage:
     * ```
     * class A { name: string }
     * class B {
     *   @serializable(object(A))
     *   public nestedObject: A;
     * }
     * ```
     *
     * @param type
     * @returns {Scheme}
     */
    function object(type) {
        var scheme = new Scheme();
        scheme.serializer = function (v) { return serialize(v); };
        scheme.deserializer = function (v) { return deserialize(type, v); };
        return scheme;
    }
    exports.object = object;
    /**
     * Custom scheme type
     * The custom function allows you to create your own serializer functionality. Used in polymorph types and arrays.
     *
     * Example usage:
     * ```
     * class A { public type = 'a'; }
     * class B { public type = 'b'; }
     * class TestClass {
     *  @serializable(custom(
     *      (v:any)=>v,
     *      (v:any) => deserialize({
     *          'a':A,
     *          'b':B
     *      }[v.type],v)
     *  ))
     *  public test: A|B;
     * }
     * ```
     *
     * @param {(v: any) => any} serializer
     * @param {(v: any) => any} deserializer
     * @returns {Scheme}
     */
    function custom(serializer, deserializer) {
        var scheme = new Scheme();
        scheme.serializer = serializer;
        scheme.deserializer = deserializer;
        return scheme;
    }
    exports.custom = custom;
    /**
     * Decorator function. This is the only function to decorate your typescript classes with; it servers as both a class
     * decorator and a property decorator.
     *
     * @param {DescriptionSettings} settings
     * @returns {any}
     */
    function serializable(settings) {
        if (settings === void 0) { settings = {}; }
        return function (type, propertyName) {
            // Class decorator
            if (arguments.length === 1) {
                store.get(type).setDecoration(settings);
            }
            // Property decorator
            else if (arguments.length === 3) {
                store.get(type.constructor).properties.set(propertyName, new PropertyDescription(propertyName, settings));
            }
            else {
                throw new Error("Invalid decorator");
            }
        };
    }
    exports.serializable = serializable;
});

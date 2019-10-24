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
            this.direction = ["serialize", "deserialize"];
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
            this.scheme = settings.scheme || new Scheme();
            this.serializedName = settings.serializedName || this.name;
            this.direction = settings.direction || this.direction;
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
        function ClassDescription(classConstructor) {
            var _this = this;
            this.classConstructor = classConstructor;
            this.deserializationFactory = function (data) {
                return new _this.classConstructor();
            };
            this.properties = new Map();
        }
        /**
         * Store decoration
         * @param {DescriptionSettings} settings
         * @returns {ClassDescription}
         */
        ClassDescription.prototype.setDecoration = function (settings) {
            if (typeof settings === 'undefined') {
                return this;
            }
            this.postDeserialize = settings.postDeserialize || undefined;
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
                this.map.set(key, new ClassDescription(key));
            }
            return this.map.get(key);
        };
        /**
         * Setter
         * @param key
         * @param {ClassDescription} value
         */
        Store.prototype.set = function (key, value) {
            this.map.set(key, value);
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
        if (src === null) {
            return null;
        }
        //Construct a runtime ClassDescription containing the current inheritance stack
        var classDescription = createClassDescription(type);
        var ret = classDescription.deserializationFactory(src);
        classDescription.properties.forEach(function (property) {
            if (typeof src[property.serializedName] !== 'undefined' && property.direction.indexOf("deserialize") !== -1) {
                ret[property.name] = property.scheme.deserializer(src[property.serializedName]);
            }
        });
        if (typeof classDescription.postDeserialize === "function") {
            classDescription.postDeserialize(ret);
        }
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
        if (src === null) {
            return null;
        }
        else if (Object.getPrototypeOf(src) === Object.prototype) {
            return src;
        }
        var ret = {};
        var classDescription = createClassDescription(Object.getPrototypeOf(src).constructor);
        classDescription.properties.forEach(function (property) {
            if (property.direction.indexOf("serialize") !== -1) {
                ret[property.serializedName] = property.scheme.serializer(src[property.name]);
            }
        });
        return ret;
    }
    exports.serialize = serialize;
    /**
     * Construct a runtime ClassDescription containing the current inheritance stack
     *
     * @param type
     */
    function createClassDescription(type) {
        var cursor = type;
        var classDescription = new ClassDescription(type);
        do {
            var cursorClassDescription = store.get(cursor);
            if (cursor === type) { //Only first item in the stack (ie. the implementation) can set deserializationFactory.
                classDescription.deserializationFactory = cursorClassDescription.deserializationFactory;
            }
            classDescription.postDeserialize = classDescription.postDeserialize || cursorClassDescription.postDeserialize;
            cursorClassDescription.properties.forEach(function (property) {
                if (!classDescription.properties.has(property.serializedName)) {
                    classDescription.properties.set(property.serializedName, property);
                }
            });
        } while ((cursor = Object.getPrototypeOf(cursor)) instanceof Function);
        return classDescription;
    }
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
    function objectMap(childScheme) {
        if (childScheme === void 0) { childScheme = exports.primitive; }
        var scheme = new Scheme();
        scheme.serializer = function (v) {
            if (v === undefined || typeof v !== "object") {
                return v;
            }
            var ret = {};
            for (var k in v) {
                if (v.hasOwnProperty(k) === true) {
                    ret[k] = childScheme.serializer(v[k]);
                }
            }
            return ret;
        };
        scheme.deserializer = function (v) {
            if (v === undefined || typeof v !== "object") {
                return v;
            }
            var ret = {};
            for (var k in v) {
                if (v.hasOwnProperty(k) === true) {
                    ret[k] = childScheme.deserializer(v[k]);
                }
            }
            return ret;
        };
        return scheme;
    }
    exports.objectMap = objectMap;
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
            if (arguments.length === 1) { // Class decorator
                store.get(type).setDecoration(settings);
            }
            else if (arguments.length === 3) { // Property decorator
                store.get(type.constructor).properties.set(propertyName, new PropertyDescription(propertyName, settings));
            }
            else {
                throw new Error("Invalid decorator");
            }
        };
    }
    exports.serializable = serializable;
    /**
     * postDeserialize decorator. If you are using an AOT build of your project, the class annotation for the
     * serializer cannot be used because functions are not allowed in the class decorator.
     * Therefore, you should create a *static member function* for postDeserialization and annotate it with this function.
     *
     * @returns {any}
     */
    function postDeserialize() {
        return function (type, propertyName, propertyDescriptor) {
            if (arguments.length !== 3) {
                throw new Error("Invalid decorator");
            }
            var classDescriptor = store.get(type);
            classDescriptor.postDeserialize = propertyDescriptor.value;
            store.set(type, classDescriptor);
        };
    }
    exports.postDeserialize = postDeserialize;
    /**
     * DeserializationFactory decorator. Mark a static method as a factory to create an instance of the type during
     * deserialization.
     *
     * @returns {any}
     */
    function deserializationFactory() {
        return function (type, propertyName, propertyDescriptor) {
            if (arguments.length !== 3) {
                throw new Error("Invalid decorator");
            }
            var classDescriptor = store.get(type);
            classDescriptor.deserializationFactory = propertyDescriptor.value;
            store.set(type, classDescriptor);
        };
    }
    exports.deserializationFactory = deserializationFactory;
});

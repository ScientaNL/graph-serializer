define("Scheme", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scheme = /** @class */ (function () {
        function Scheme() {
            this.serializer = function (v) { return v; };
            this.deserializer = function (v) { return v; };
        }
        return Scheme;
    }());
    exports.Scheme = Scheme;
});
define("Store", ["require", "exports", "Scheme"], function (require, exports, Scheme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Property decorator storage class
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
                ? new Scheme_1.Scheme()
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
     * Class decorator storage
     */
    var ClassDescription = /** @class */ (function () {
        function ClassDescription() {
            this.postDeserialize = function () { };
            this.properties = new Map();
        }
        /**
         * Add new class decorator settings here.
         *
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
     * Main decorator storage. This class will store and provide access to all decorators.
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
    exports.store = new Store();
});
define("Decorators", ["require", "exports", "Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serializable decorator. The decorator may receive an object with settings. Example usage:
     *
     * ```
     * @serializable({
     *      postDeserialize: function(obj){ [...] }
     * })
     * class ExampleClass {
     *  @serializable()
     *  public name: string;
     *
     *  @serializable({
     *      serializedName: tags
     *      scheme: array()
     *  })
     *  public tagArr: string[];
     * }
     * ```
     *
     */
    function serializable(settings) {
        if (settings === void 0) { settings = {}; }
        return function (type, propertyName) {
            // Class decorator
            if (arguments.length === 1) {
                Store_1.store.get(type).setDecoration(settings);
            }
            // Property decorator
            else if (arguments.length === 3) {
                Store_1.store.get(type.constructor).properties.set(propertyName, new Store_1.PropertyDescription(propertyName, settings));
            }
            else {
                throw new Error("Invalid decorator");
            }
        };
    }
    exports.serializable = serializable;
});
define("Serializer", ["require", "exports", "Store"], function (require, exports, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serializer. Converts a JSON serializable tree to an object instance.
     *
     * @param type
     * @param src
     * @returns {any}
     */
    function deserialize(type, src) {
        var ret = new type();
        var isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
        if (isDerivedClass) {
            var extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
            Object.assign(ret, deserialize(extendedType, src));
        }
        Store_2.store.get(type).properties.forEach(function (property, propertyName) {
            ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
        });
        Store_2.store.get(type).postDeserialize(ret);
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
        Store_2.store.get(src.constructor).properties.forEach(function (property, propertyName) {
            ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
        });
        return ret;
    }
    exports.serialize = serialize;
});
define("Types", ["require", "exports", "Scheme", "Serializer"], function (require, exports, Scheme_2, Serializer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    exports.primitive = new Scheme_2.Scheme();
    /**
     * Date scheme. This scheme will properly serialize and deserialize javascript Date objects.
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
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return (v instanceof Date) ? v.toJSON() : v; };
        scheme.deserializer = function (v) { return (typeof v === 'string') ? new Date(v) : v; };
        return scheme;
    })();
    /**
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
        var scheme = new Scheme_2.Scheme();
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
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return Serializer_1.serialize(v); };
        scheme.deserializer = function (v) { return Serializer_1.deserialize(type, v); };
        return scheme;
    }
    exports.object = object;
    /**
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
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = serializer;
        scheme.deserializer = deserializer;
        return scheme;
    }
    exports.custom = custom;
});
define("graph-serializer", ["require", "exports", "Scheme", "Store", "Types", "Serializer", "Decorators"], function (require, exports, Scheme_3, Store_3, Types_1, Serializer_2, Decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scheme = Scheme_3.Scheme;
    exports.ClassDescription = Store_3.ClassDescription;
    exports.PropertyDescription = Store_3.PropertyDescription;
    exports.Store = Store_3.Store;
    exports.array = Types_1.array;
    exports.custom = Types_1.custom;
    exports.date = Types_1.date;
    exports.object = Types_1.object;
    exports.primitive = Types_1.primitive;
    exports.deserialize = Serializer_2.deserialize;
    exports.serialize = Serializer_2.serialize;
    exports.serializable = Decorators_1.serializable;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9TY2hlbWUudHMiLCJzcmMvU3RvcmUudHMiLCJzcmMvRGVjb3JhdG9ycy50cyIsInNyYy9TZXJpYWxpemVyLnRzIiwic3JjL1R5cGVzLnRzIiwic3JjL2dyYXBoLXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBQUE7UUFBQTtZQUNXLGVBQVUsR0FBb0IsVUFBQyxDQUFNLElBQUssT0FBQSxDQUFDLEVBQUQsQ0FBQyxDQUFDO1lBQzVDLGlCQUFZLEdBQW9CLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBQUQsYUFBQztJQUFELENBSEEsQUFHQyxJQUFBO0lBSFksd0JBQU07Ozs7O0lDUW5COztPQUVHO0lBQ0g7UUFNSSw2QkFBbUIsWUFBb0IsRUFBRSxRQUFrQztZQUFsQyx5QkFBQSxFQUFBLGFBQWtDO1lBQ3ZFLElBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0ksMkNBQWEsR0FBcEIsVUFBcUIsUUFBNkI7WUFDOUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssV0FBVztnQkFDaEQsQ0FBQyxDQUFDLElBQUksZUFBTSxFQUFFO2dCQUNkLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxRQUFRLENBQUMsY0FBYyxLQUFLLFdBQVc7Z0JBQ2hFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSTtnQkFDWCxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0wsMEJBQUM7SUFBRCxDQTFCQSxBQTBCQyxJQUFBO0lBMUJZLGtEQUFtQjtJQTRCaEM7O09BRUc7SUFDSDtRQUFBO1lBRVcsb0JB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QUFJLE1BQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBQyxDQUFLLElBQUssT0FBQSxzQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFaLENBQVksQ0FBQztRQUM1QyxNQUFNLENBQUMsWUFBWSxHQUFHLFVBQUMsQ0FBSyxJQUFLLE9BQUEsd0JBQVcsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQW5CLENBQW1CLENBQUM7UUFDckQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUxELHdCQUtDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxnQkFBdUIsVUFBMkIsRUFBRSxZQUE2QjtRQUM3RSxJQUFJLE1BQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ25DLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFMRCx3QkFLQzs7Ozs7SUMxR1EsMEJBQUEsTUFBTSxDQUFBO0lBQ04sbUNBQUEsZ0JBQWdCLENBQUE7SUFBRSxzQ0FBQSxtQkFBbUIsQ0FBQTtJQUF1Qix3QkFBQSxLQUFLLENBQUE7SUFDakUsd0JBQUEsS0FBSyxDQUFBO0lBQUUseUJBQUEsTUFBTSxDQUFBO0lBQUUsdUJBQUEsSUFBSSxDQUFBO0lBQUUseUJBQUEsTUFBTSxDQUFBO0lBQUUsNEJBQUEsU0FBUyxDQUFBO0lBQ3RDLG1DQUFBLFdBQVcsQ0FBQTtJQUFFLGlDQUFBLFNBQVMsQ0FBQTtJQUN0QixvQ0FBQSxZQUFZLENBQUEiLCJmaWxlIjoiZ3JhcGgtc2VyaWFsaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBTY2hlbWUge1xuICAgIHB1YmxpYyBzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkgPSAodjogYW55KSA9PiB2O1xuICAgIHB1YmxpYyBkZXNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSA9ICh2OiBhbnkpID0+IHY7XG59XG4iLCJpbXBvcnQge1NjaGVtZX0gZnJvbSBcIi4vU2NoZW1lXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVzY3JpcHRpb25TZXR0aW5ncyB7XG4gICAgc2NoZW1lPzogU2NoZW1lLFxuICAgIHNlcmlhbGl6ZWROYW1lPzogc3RyaW5nLFxuICAgIHBvc3REZXNlcmlhbGl6ZT86IEZ1bmN0aW9uXG59XG5cbi8qKlxuICogUHJvcGVydHkgZGVjb3JhdG9yIHN0b3JhZ2UgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5RGVzY3JpcHRpb24ge1xuXG4gICAgcHVibGljIHNjaGVtZTogU2NoZW1lO1xuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmc7XG4gICAgcHVibGljIHNlcmlhbGl6ZWROYW1lOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJvcGVydHlOYW1lOiBzdHJpbmcsIHNldHRpbmdzOiBEZXNjcmlwdGlvblNldHRpbmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvcGVydHlOYW1lO1xuICAgICAgICB0aGlzLnNldERlY29yYXRpb24oc2V0dGluZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBuZXcgcHJvcGVydHkgZGVjb3JhdG9yIHNldHRpbmdzIGhlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Rlc2NyaXB0aW9uU2V0dGluZ3N9IHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1Byb3BlcnR5RGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6IERlc2NyaXB0aW9uU2V0dGluZ3MpOiBQcm9wZXJ0eURlc2NyaXB0aW9uIHtcbiAgICAgICAgdGhpcy5zY2hlbWUgPSB0eXBlb2Ygc2V0dGluZ3Muc2NoZW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBuZXcgU2NoZW1lKClcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2NoZW1lO1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZWROYW1lID0gdHlwZW9mIHNldHRpbmdzLnNlcmlhbGl6ZWROYW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyB0aGlzLm5hbWVcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2VyaWFsaXplZE5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBkZWNvcmF0b3Igc3RvcmFnZVxuICovXG5leHBvcnQgY2xhc3MgQ2xhc3NEZXNjcmlwdGlvbiB7XG5cbiAgICBwdWJsaWMgcG9zdERlc2VyaWFsaXplOiBGdW5jdGlvbiA9ICgpID0+IHt9O1xuICAgIHB1YmxpYyBwcm9wZXJ0aWVzOiBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0aW9uPiA9IG5ldyBNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIEFkZCBuZXcgY2xhc3MgZGVjb3JhdG9yIHNldHRpbmdzIGhlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Rlc2NyaXB0aW9uU2V0dGluZ3N9IHNldHRpbmdzXG4gICAgICogQHJldHVybnMge0NsYXNzRGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6IERlc2NyaXB0aW9uU2V0dGluZ3MpOiBDbGFzc0Rlc2NyaXB0aW9uIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5wb3N0RGVzZXJpYWxpemUgPSB0eXBlb2Ygc2V0dGluZ3MucG9zdERlc2VyaWFsaXplID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyAoKSA9PiB7IH1cbiAgICAgICAgICAgIDogc2V0dGluZ3MucG9zdERlc2VyaWFsaXplO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuICogTWFpbiBkZWNvcmF0b3Igc3RvcmFnZS4gVGhpcyBjbGFzcyB3aWxsIHN0b3JlIGFuZCBwcm92aWRlIGFjY2VzcyB0byBhbGwgZGVjb3JhdG9ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JlIHtcblxuICAgIHByaXZhdGUgbWFwOk1hcDxhbnksIENsYXNzRGVzY3JpcHRpb24+ID0gbmV3IE1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgTWFwIGdldHRlci4gV2hlbiBubyBjbGFzcyBkZXNjcmlwdGlvbiBpcyBmb3VuZCwgd2Ugd2FudCB0byBpbnN0YW50aWF0ZSBhbmQgcmV0dXJuIG9uZS4gQ2xhc3MgZGVjb3JhdG9yc1xuICAgICAqIGFyZSBvcHRpb25hbCwgYW5kIHRoaXMgZW5zdXJlcyB3ZSB3aWxsIGdldCBhIGRlZmF1bHQgb25lIHdoZW4gcmVxdWVzdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICogQHJldHVybnMge0NsYXNzRGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIGdldChrZXk6IGFueSk6IENsYXNzRGVzY3JpcHRpb24ge1xuICAgICAgICBpZiAoIXRoaXMubWFwLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aGlzLm1hcC5zZXQoa2V5LCBuZXcgQ2xhc3NEZXNjcmlwdGlvbigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBsZXQgc3RvcmUgPSBuZXcgU3RvcmUoKTtcblxuIiwiaW1wb3J0IHtQcm9wZXJ0eURlc2NyaXB0aW9uLCBEZXNjcmlwdGlvblNldHRpbmdzLCBzdG9yZX0gZnJvbSBcIi4vU3RvcmVcIjtcclxuXHJcbi8qKlxyXG4gKiBTZXJpYWxpemFibGUgZGVjb3JhdG9yLiBUaGUgZGVjb3JhdG9yIG1heSByZWNlaXZlIGFuIG9iamVjdCB3aXRoIHNldHRpbmdzLiBFeGFtcGxlIHVzYWdlOlxyXG4gKlxyXG4gKiBgYGBcclxuICogQHNlcmlhbGl6YWJsZSh7XHJcbiAqICAgICAgcG9zdERlc2VyaWFsaXplOiBmdW5jdGlvbihvYmopeyBbLi4uXSB9XHJcbiAqIH0pXHJcbiAqIGNsYXNzIEV4YW1wbGVDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKClcclxuICogIHB1YmxpYyBuYW1lOiBzdHJpbmc7XHJcbiAqXHJcbiAqICBAc2VyaWFsaXphYmxlKHtcclxuICogICAgICBzZXJpYWxpemVkTmFtZTogdGFnc1xyXG4gKiAgICAgIHNjaGVtZTogYXJyYXkoKVxyXG4gKiAgfSlcclxuICogIHB1YmxpYyB0YWdBcnI6IHN0cmluZ1tdO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6YWJsZShzZXR0aW5nczogRGVzY3JpcHRpb25TZXR0aW5ncyA9IHt9KTogYW55IHtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZTphbnksIHByb3BlcnR5TmFtZTogc3RyaW5nKXtcclxuXHJcbiAgICAgICAgLy8gQ2xhc3MgZGVjb3JhdG9yXHJcbiAgICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICBzdG9yZS5nZXQodHlwZSkuc2V0RGVjb3JhdGlvbihzZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9wZXJ0eSBkZWNvcmF0b3JcclxuICAgICAgICBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuc2V0KHByb3BlcnR5TmFtZSwgbmV3IFByb3BlcnR5RGVzY3JpcHRpb24ocHJvcGVydHlOYW1lLCBzZXR0aW5ncykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGVjb3JhdG9yXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59XHJcblxyXG4iLCJpbXBvcnQge1Byb3BlcnR5RGVzY3JpcHRpb24sIHN0b3JlfSBmcm9tIFwiLi9TdG9yZVwiO1xuXG4vKipcbiAqIFNlcmlhbGl6ZXIuIENvbnZlcnRzIGEgSlNPTiBzZXJpYWxpemFibGUgdHJlZSB0byBhbiBvYmplY3QgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSBzcmNcbiAqIEByZXR1cm5zIHthbnl9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNlcmlhbGl6ZSh0eXBlOiBhbnksIHNyYzogYW55KTogYW55IHtcblxuICAgIGxldCByZXQgPSBuZXcgdHlwZSgpO1xuXG4gICAgbGV0IGlzRGVyaXZlZENsYXNzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUpIGluc3RhbmNlb2YgRnVuY3Rpb247XG4gICAgaWYoaXNEZXJpdmVkQ2xhc3MpIHtcbiAgICAgICAgbGV0IGV4dGVuZGVkVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IHR5cGUoKSkpLmNvbnN0cnVjdG9yO1xuICAgICAgICBPYmplY3QuYXNzaWduKHJldCxkZXNlcmlhbGl6ZShleHRlbmRlZFR5cGUsc3JjKSk7XG4gICAgfVxuXG4gICAgc3RvcmUuZ2V0KHR5cGUpLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6IFByb3BlcnR5RGVzY3JpcHRpb24sIHByb3BlcnR5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldFtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHkuc2NoZW1lLmRlc2VyaWFsaXplcihzcmNbcHJvcGVydHkuc2VyaWFsaXplZE5hbWVdKTtcbiAgICB9KTtcblxuICAgIHN0b3JlLmdldCh0eXBlKS5wb3N0RGVzZXJpYWxpemUocmV0KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogRGVzZXJpYWxpemVyIGZ1bmN0aW9uLiBDb252ZXJ0cyBhbiBvYmplY3QgdG8gYSBKU09OIHNlcmlhbGl6YWJsZSBncmFwaC5cbiAqXG4gKiBAcGFyYW0gc3JjXG4gKiBAcmV0dXJucyB7e1twOiBzdHJpbmddOiBhbnl9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKHNyYzogYW55KTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSB7XG4gICAgbGV0IHJldDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuXG4gICAgLy9wYXJlbnRcbiAgICBpZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNyYykpLmNvbnN0cnVjdG9yICE9PSBPYmplY3QpIHtcbiAgICAgICAgbGV0IHN1cGVyQ2xhc3MgPSBuZXcgKE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSkuY29uc3RydWN0b3IpKCk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ocmV0LHNlcmlhbGl6ZShzdXBlckNsYXNzKSk7XG4gICAgfVxuXG4gICAgc3RvcmUuZ2V0KHNyYy5jb25zdHJ1Y3RvcikucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eTpQcm9wZXJ0eURlc2NyaXB0aW9uLHByb3BlcnR5TmFtZTpzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0W3Byb3BlcnR5LnNlcmlhbGl6ZWROYW1lXSA9IHByb3BlcnR5LnNjaGVtZS5zZXJpYWxpemVyKHNyY1twcm9wZXJ0eU5hbWVdKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbiIsImltcG9ydCB7U2NoZW1lfSBmcm9tIFwiLi9TY2hlbWVcIjtcclxuaW1wb3J0IHtkZXNlcmlhbGl6ZSwgc2VyaWFsaXplfSBmcm9tIFwiLi9TZXJpYWxpemVyXCI7XHJcblxyXG4vKipcclxuICogUHJpbWl0aXZlLCB0aGUgZGVmYXVsdCBzY2hlbWUuIFRoaXMgd2lsbCByZXR1cm4gcHJvcGVydGllcyBhcy1pcyBvbiBkZXNlcmlhbGl6ZS4gVGhpcyBpcyBleHBvcnRlZCBhcyBjb25zdCBiZWNhdXNlXHJcbiAqIHRoZSBwcmltaXRpdmUgc2NoZW1lIHNob3VsZCBuZXZlciBjaGFuZ2UuXHJcbiAqIEB0eXBlIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlID0gbmV3IFNjaGVtZSgpO1xyXG5cclxuLyoqXHJcbiAqIERhdGUgc2NoZW1lLiBUaGlzIHNjaGVtZSB3aWxsIHByb3Blcmx5IHNlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgamF2YXNjcmlwdCBEYXRlIG9iamVjdHMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShkYXRlKVxyXG4gKiAgcHVibGljIGNoaWxkcmVuOiBEYXRlO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAdHlwZSB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGRhdGUgPSAoZnVuY3Rpb24oKXtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OkRhdGUpID0+ICh2IGluc3RhbmNlb2YgRGF0ZSkgPyB2LnRvSlNPTigpIDogdjtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjpzdHJpbmcpID0+ICh0eXBlb2YgdiA9PT0gJ3N0cmluZycpID8gbmV3IERhdGUodikgOiB2O1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgYXJyYXkgZnVuY3Rpb24gd2lsbCBhcHBseSBhIHNjaGVtZSB0byBhbGwgb2YgaXRzIGNoaWxkcmVuLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgVGVzdENsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoYXJyYXkoKSlcclxuICogIHB1YmxpYyBjaGlsZHJlbjogc3RyaW5nW107XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB7U2NoZW1lfSBjaGlsZFNjaGVtZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KGNoaWxkU2NoZW1lOiBTY2hlbWUgPSBwcmltaXRpdmUpIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OiBhbnkpID0+IHtcclxuICAgICAgICByZXR1cm4gdi5tYXAoKHc6IGFueSkgPT4gY2hpbGRTY2hlbWUuc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmKHYgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHY7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh3OiBhbnkpID0+IGNoaWxkU2NoZW1lLmRlc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4vKipcclxuICogVGhlIG9iamVjdCBmdW5jdGlvbiB3aWxsIHNlcmlhbGl6ZSBhIG5lc3RlZCBvYmplY3RcclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIEEgeyBuYW1lOiBzdHJpbmcgfVxyXG4gKiBjbGFzcyBCIHtcclxuICogICBAc2VyaWFsaXphYmxlKG9iamVjdChBKSlcclxuICogICBwdWJsaWMgbmVzdGVkT2JqZWN0OiBBO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0gdHlwZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdCh0eXBlOiBhbnkpOiBTY2hlbWUge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6YW55KSA9PiBzZXJpYWxpemUodik7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6YW55KSA9PiBkZXNlcmlhbGl6ZSh0eXBlLHYpO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBjdXN0b20gZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjcmVhdGUgeW91ciBvd24gc2VyaWFsaXplciBmdW5jdGlvbmFsaXR5LiBVc2VkIGluIHBvbHltb3JwaCB0eXBlcyBhbmQgYXJyYXlzLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgQSB7IHB1YmxpYyB0eXBlID0gJ2EnOyB9XHJcbiAqIGNsYXNzIEIgeyBwdWJsaWMgdHlwZSA9ICdiJzsgfVxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShjdXN0b20oXHJcbiAqICAgICAgKHY6YW55KT0+dixcclxuICogICAgICAodjphbnkpID0+IGRlc2VyaWFsaXplKHtcclxuICogICAgICAgICAgJ2EnOkEsXHJcbiAqICAgICAgICAgICdiJzpCXHJcbiAqICAgICAgfVt2LnR5cGVdLHYpXHJcbiAqICApKVxyXG4gKiAgcHVibGljIHRlc3Q6IEF8QjtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IHNlcmlhbGl6ZXJcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IGRlc2VyaWFsaXplclxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbShzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnksIGRlc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55KTogU2NoZW1lIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9IHNlcmlhbGl6ZXI7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gZGVzZXJpYWxpemVyO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuIiwiZXhwb3J0IHsgU2NoZW1lIH0gZnJvbSBcIi4vU2NoZW1lXCI7XG5leHBvcnQgeyBDbGFzc0Rlc2NyaXB0aW9uLCBQcm9wZXJ0eURlc2NyaXB0aW9uLCBEZXNjcmlwdGlvblNldHRpbmdzLCBTdG9yZSB9IGZyb20gXCIuL1N0b3JlXCI7XG5leHBvcnQgeyBhcnJheSwgY3VzdG9tLCBkYXRlLCBvYmplY3QsIHByaW1pdGl2ZX0gZnJvbSBcIi4vVHlwZXNcIjtcbmV4cG9ydCB7IGRlc2VyaWFsaXplLCBzZXJpYWxpemUgfSBmcm9tIFwiLi9TZXJpYWxpemVyXCI7XG5leHBvcnQgeyBzZXJpYWxpemFibGUgfSBmcm9tIFwiLi9EZWNvcmF0b3JzXCI7XG5cbiJdfQ==

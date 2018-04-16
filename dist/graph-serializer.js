(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Store"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Store_1 = require("./Store");
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
    var Scheme = /** @class */ (function () {
        function Scheme() {
            this.serializer = function (v) { return v; };
            this.deserializer = function (v) { return v; };
        }
        return Scheme;
    }());
    exports.Scheme = Scheme;
});

(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Store"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Store_1 = require("./Store");
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
            var extendedProperties_1 = deserialize(extendedType, src);
            Object.keys(extendedProperties_1).forEach(function (key) {
                ret[key] = extendedProperties_1[key];
            });
        }
        Store_1.store.get(type).properties.forEach(function (property, propertyName) {
            ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
        });
        Store_1.store.get(type).postDeserialize(ret);
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
            var superClassProperties_1 = serialize(superClass);
            Object.keys(superClassProperties_1).forEach(function (key) {
                ret[key] = superClassProperties_1[key];
            });
        }
        Store_1.store.get(src.constructor).properties.forEach(function (property, propertyName) {
            ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
        });
        return ret;
    }
    exports.serialize = serialize;
});

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript-map", "./Scheme"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var typescript_map_1 = require("typescript-map");
    var Scheme_1 = require("./Scheme");
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
         * @param {{[p: string]: any}} settings
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
            this.properties = new typescript_map_1.TSMap();
        }
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
    /**
     * Main decorator storage. This class will store and provide access to all decorators.
     */
    var Store = /** @class */ (function (_super) {
        __extends(Store, _super);
        function Store() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
         * are optional, and this ensures we will get a default one when requested
         *
         * @param key
         * @returns {ClassDescription}
         */
        Store.prototype.get = function (key) {
            if (!this.has(key))
                this.set(key, new ClassDescription());
            return _super.prototype.get.call(this, key);
        };
        return Store;
    }(typescript_map_1.TSMap));
    exports.store = new Store();
});

(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Scheme", "./Serializer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scheme_1 = require("./Scheme");
    var Serializer_1 = require("./Serializer");
    /**
     * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    exports.primitive = new Scheme_1.Scheme();
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
        var scheme = new Scheme_1.Scheme();
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
        var scheme = new Scheme_1.Scheme();
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
        var scheme = new Scheme_1.Scheme();
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
        var scheme = new Scheme_1.Scheme();
        scheme.serializer = serializer;
        scheme.deserializer = deserializer;
        return scheme;
    }
    exports.custom = custom;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkRlY29yYXRvcnMudHMiLCJTY2hlbWUudHMiLCJTZXJpYWxpemVyLnRzIiwiU3RvcmUudHMiLCJUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFBLGlDQUFtRDtJQUVuRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW1CRztJQUNILHNCQUE2QixRQUFxQjtRQUFyQix5QkFBQSxFQUFBLGFBQXFCO1FBRTlDLE9BQU8sVUFBUyxJQUFRLEVBQUUsWUFBb0I7WUFFMUMsa0JBQWtCO1lBQ2xCLElBQUcsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzNDO1lBRUQscUJBQXFCO2lCQUNoQixJQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUM1QixhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLDJCQUFtQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQzdHO2lCQUVJO2dCQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQzthQUN4QztRQUNMLENBQUMsQ0FBQztJQUVOLENBQUM7SUFuQkQsb0NBbUJDOzs7Ozs7Ozs7Ozs7OztJQ3pDRDtRQUFBO1lBQ1csZUFBVSxHQUFvQixVQUFDLENBQU0sSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7WUFDNUMsaUJBQVksR0FBb0IsVUFBQyxDQUFNLElBQUssT0FBQSxDQUFDLEVBQUQsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFBRCxhQUFDO0lBQUQsQ0FIQSxBQUdDLElBQUE7SUFIWSx3QkFBTTs7Ozs7Ozs7Ozs7Ozs7SUNBbkIsaUNBQW1EO0lBRW5EOzs7Ozs7T0FNRztJQUNILHFCQUE0QixJQUFTLEVB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LFNBQVM7Z0JBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0IsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBTSxJQUFLLE9BQUEsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBM0IsQ0FBMkIsQ0FBQyxDQUFBO1FBQ3pELENBQUMsQ0FBQztRQUNGLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFWRCxzQkFVQztJQUVEOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsZ0JBQXVCLElBQVM7UUFDNUIsSUFBSSxNQUFNLEdBQUcsSUFBSSxlQUFNLEVBQUUsQ0FBQztRQUMxQixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQUMsQ0FBSyxJQUFLLE9BQUEsc0JBQVMsQ0FBQyxDQUFDLENBQUMsRUFBWixDQUFZLENBQUM7UUFDNUMsTUFBTSxDQUFDLFlBQVksR0FBRyxVQUFDLENBQUssSUFBSyxPQUFBLHdCQUFXLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFuQixDQUFtQixDQUFDO1FBQ3JELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFMRCx3QkFLQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsZ0JBQXVCLFVBQTJCLEVBQUUsWUFBNkI7UUFDN0UsSUFBSSxNQUFNLEdBQUcsSUFBSSxlQUFNLEVBQUUsQ0FBQztRQUMxQixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUMvQixNQUFNLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNuQyxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBTEQsd0JBS0MiLCJmaWxlIjoiZ3JhcGgtc2VyaWFsaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7UHJvcGVydHlEZXNjcmlwdGlvbiwgc3RvcmV9IGZyb20gXCIuL1N0b3JlXCI7XHJcblxyXG4vKipcclxuICogU2VyaWFsaXphYmxlIGRlY29yYXRvci4gVGhlIGRlY29yYXRvciBtYXkgcmVjZWl2ZSBhbiBvYmplY3Qgd2l0aCBzZXR0aW5ncy4gRXhhbXBsZSB1c2FnZTpcclxuICpcclxuICogYGBgXHJcbiAqIEBzZXJpYWxpemFibGUoe1xyXG4gKiAgICAgIHBvc3REZXNlcmlhbGl6ZTogZnVuY3Rpb24ob2JqKXsgWy4uLl0gfVxyXG4gKiB9KVxyXG4gKiBjbGFzcyBFeGFtcGxlQ2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZSgpXHJcbiAqICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG4gKlxyXG4gKiAgQHNlcmlhbGl6YWJsZSh7XHJcbiAqICAgICAgc2VyaWFsaXplZE5hbWU6IHRhZ3NcclxuICogICAgICBzY2hlbWU6IGFycmF5KClcclxuICogIH0pXHJcbiAqICBwdWJsaWMgdGFnQXJyOiBzdHJpbmdbXTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemFibGUoc2V0dGluZ3M6IG9iamVjdCA9IHt9KTogYW55IHtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZTphbnksIHByb3BlcnR5TmFtZTogc3RyaW5nKXtcclxuXHJcbiAgICAgICAgLy8gQ2xhc3MgZGVjb3JhdG9yXHJcbiAgICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICBzdG9yZS5nZXQodHlwZSkuc2V0RGVjb3JhdGlvbihzZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9wZXJ0eSBkZWNvcmF0b3JcclxuICAgICAgICBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuc2V0KHByb3BlcnR5TmFtZSwgbmV3IFByb3BlcnR5RGVzY3JpcHRpb24ocHJvcGVydHlOYW1lLCBzZXR0aW5ncykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGVjb3JhdG9yXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59XHJcblxyXG4iLCJleHBvcnQgY2xhc3MgU2NoZW1lIHtcbiAgICBwdWJsaWMgc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55ID0gKHY6IGFueSkgPT4gdjtcbiAgICBwdWJsaWMgZGVzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkgPSAodjogYW55KSA9PiB2O1xufVxuIiwiaW1wb3J0IHtQcm9wZXJ0eURlc2NyaXB0aW9uLCBzdG9yZX0gZnJvbSBcIi4vU3RvcmVcIjtcblxuLyoqXG4gKiBTZXJpYWxpemVyLiBDb252ZXJ0cyBhIEpTT04gc2VyaWFsaXphYmxlIHRyZWUgdG8gYW4gb2JqZWN0IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB0eXBlXG4gKiBAcGFyYW0gc3JjXG4gKiBAcmV0dXJucyB7YW55fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzZXJpYWxpemUodHlwZTogYW55LCBzcmM6IGFueSk6IGFueSB7XG5cbiAgICBsZXQgcmV0ID0gbmV3IHR5cGUoKTtcblxuICAgIGxldCBpc0Rlcml2ZWRDbGFzcyA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlKSBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xuICAgIGlmKGlzRGVyaXZlZENsYXNzKSB7XG4gICAgICAgIGxldCBleHRlbmRlZFR5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKG5ldyB0eXBlKCkpKS5jb25zdHJ1Y3RvcjtcbiAgICAgICAgbGV0IGV4dGVuZGVkUHJvcGVydGllcyA9IGRlc2VyaWFsaXplKGV4dGVuZGVkVHlwZSxzcmMpO1xuICAgICAgICBPYmplY3Qua2V5cyhleHRlbmRlZFByb3BlcnRpZXMpLmZvckVhY2goKGtleTpzdHJpbmcpPT57XG4gICAgICAgICAgICByZXRba2V5XSA9IGV4dGVuZGVkUHJvcGVydGllc1trZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9yZS5nZXQodHlwZSkucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eTogUHJvcGVydHlEZXNjcmlwdGlvbiwgcHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0W3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eS5zY2hlbWUuZGVzZXJpYWxpemVyKHNyY1twcm9wZXJ0eS5zZXJpYWxpemVkTmFtZV0pO1xuICAgIH0pO1xuXG4gICAgc3RvcmUuZ2V0KHR5cGUpLnBvc3REZXNlcmlhbGl6ZShyZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBEZXNlcmlhbGl6ZXIgZnVuY3Rpb24uIENvbnZlcnRzIGFuIG9iamVjdCB0byBhIEpTT04gc2VyaWFsaXphYmxlIGdyYXBoLlxuICpcbiAqIEBwYXJhbSBzcmNcbiAqIEByZXR1cm5zIHt7W3A6IHN0cmluZ106IGFueX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoc3JjOiBhbnkpOiB7IFtrZXk6IHN0cmluZ106IGFueSB9IHtcbiAgICBsZXQgcmV0OiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG5cbiAgICAvL3BhcmVudFxuICAgIGlmKE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSkuY29uc3RydWN0b3IgIT09IE9iamVjdCkge1xuICAgICAgICBsZXQgc3VwZXJDbGFzcyA9IG5ldyAoT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihzcmMpKS5jb25zdHJ1Y3RvcikoKTtcbiAgICAgICAgbGV0IHN1cGVyQ2xhc3NQcm9wZXJ0aWVzID0gc2VyaWFsaXplKHN1cGVyQ2xhc3MpO1xuICAgICAgICBPYmplY3Qua2V5cyhzdXBlckNsYXNzUHJvcGVydGllcykuZm9yRWFjaCgoa2V5OnN0cmluZykgPT57XG4gICAgICAgICAgICByZXRba2V5XSA9IHN1cGVyQ2xhc3NQcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3JlLmdldChzcmMuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6UHJvcGVydHlEZXNjcmlwdGlvbixwcm9wZXJ0eU5hbWU6c3RyaW5nKSA9PiB7XG4gICAgICAgIHJldFtwcm9wZXJ0eS5zZXJpYWxpemVkTmFtZV0gPSBwcm9wZXJ0eS5zY2hlbWUuc2VyaWFsaXplcihzcmNbcHJvcGVydHlOYW1lXSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG4iLCJpbXBvcnQge1RTTWFwfSBmcm9tIFwidHlwZXNjcmlwdC1tYXBcIjtcbmltcG9ydCB7U2NoZW1lfSBmcm9tIFwiLi9TY2hlbWVcIjtcblxuLyoqXG4gKiBQcm9wZXJ0eSBkZWNvcmF0b3Igc3RvcmFnZSBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEZXNjcmlwdGlvbiB7XG5cbiAgICBwdWJsaWMgc2NoZW1lOlNjaGVtZTtcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xuICAgIHB1YmxpYyBzZXJpYWxpemVkTmFtZTpzdHJpbmc7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJvcGVydHlOYW1lOiBzdHJpbmcsIHNldHRpbmdzOntba2V5OnN0cmluZ106YW55fSA9IHt9KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb3BlcnR5TmFtZTtcbiAgICAgICAgdGhpcy5zZXREZWNvcmF0aW9uKHNldHRpbmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbmV3IHByb3BlcnR5IGRlY29yYXRvciBzZXR0aW5ncyBoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7W3A6IHN0cmluZ106IGFueX19IHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1Byb3BlcnR5RGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6e1trZXk6c3RyaW5nXTphbnl9KTpQcm9wZXJ0eURlc2NyaXB0aW9uIHtcbiAgICAgICAgdGhpcy5zY2hlbWUgPSB0eXBlb2Ygc2V0dGluZ3Muc2NoZW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBuZXcgU2NoZW1lKClcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2NoZW1lO1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZWROYW1lID0gdHlwZW9mIHNldHRpbmdzLnNlcmlhbGl6ZWROYW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyB0aGlzLm5hbWVcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2VyaWFsaXplZE5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBkZWNvcmF0b3Igc3RvcmFnZVxuICovXG5jbGFzcyBDbGFzc0Rlc2NyaXB0aW9uIHtcblxuICAgIHB1YmxpYyBwb3N0RGVzZXJpYWxpemU6IEZ1bmN0aW9uID0gKCk9Pnt9O1xuICAgIHB1YmxpYyBwcm9wZXJ0aWVzOiBUU01hcDxzdHJpbmcsUHJvcGVydHlEZXNjcmlwdGlvbj4gPSBuZXcgVFNNYXAoKTtcblxuICAgIHB1YmxpYyBzZXREZWNvcmF0aW9uKHNldHRpbmdzOntba2V5OnN0cmluZ106YW55fSk6Q2xhc3NEZXNjcmlwdGlvbiB7XG4gICAgICAgIGlmKHR5cGVvZiBzZXR0aW5ncyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5wb3N0RGVzZXJpYWxpemUgPSB0eXBlb2Ygc2V0dGluZ3MucG9zdERlc2VyaWFsaXplID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyAoKT0+e31cbiAgICAgICAgICAgIDogc2V0dGluZ3MucG9zdERlc2VyaWFsaXplO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuICogTWFpbiBkZWNvcmF0b3Igc3RvcmFnZS4gVGhpcyBjbGFzcyB3aWxsIHN0b3JlIGFuZCBwcm92aWRlIGFjY2VzcyB0byBhbGwgZGVjb3JhdG9ycy5cbiAqL1xuY2xhc3MgU3RvcmUgZXh0ZW5kcyBUU01hcDxhbnksQ2xhc3NEZXNjcmlwdGlvbj4ge1xuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgTWFwIGdldHRlci4gV2hlbiBubyBjbGFzcyBkZXNjcmlwdGlvbiBpcyBmb3VuZCwgd2Ugd2FudCB0byBpbnN0YW50aWF0ZSBhbmQgcmV0dXJuIG9uZS4gQ2xhc3MgZGVjb3JhdG9yc1xuICAgICAqIGFyZSBvcHRpb25hbCwgYW5kIHRoaXMgZW5zdXJlcyB3ZSB3aWxsIGdldCBhIGRlZmF1bHQgb25lIHdoZW4gcmVxdWVzdGVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICogQHJldHVybnMge0NsYXNzRGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIGdldChrZXk6YW55KTpDbGFzc0Rlc2NyaXB0aW9uIHtcbiAgICAgICAgaWYoIXRoaXMuaGFzKGtleSkpIHRoaXMuc2V0KGtleSxuZXcgQ2xhc3NEZXNjcmlwdGlvbigpKTtcbiAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgIH1cblxufVxuXG5leHBvcnQgbGV0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG5cbiIsImltcG9ydCB7U2NoZW1lfSBmcm9tIFwiLi9TY2hlbWVcIjtcclxuaW1wb3J0IHtkZXNlcmlhbGl6ZSwgc2VyaWFsaXplfSBmcm9tIFwiLi9TZXJpYWxpemVyXCI7XHJcblxyXG4vKipcclxuICogUHJpbWl0aXZlLCB0aGUgZGVmYXVsdCBzY2hlbWUuIFRoaXMgd2lsbCByZXR1cm4gcHJvcGVydGllcyBhcy1pcyBvbiBkZXNlcmlhbGl6ZS4gVGhpcyBpcyBleHBvcnRlZCBhcyBjb25zdCBiZWNhdXNlXHJcbiAqIHRoZSBwcmltaXRpdmUgc2NoZW1lIHNob3VsZCBuZXZlciBjaGFuZ2UuXHJcbiAqIEB0eXBlIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlID0gbmV3IFNjaGVtZSgpO1xyXG5cclxuLyoqXHJcbiAqIERhdGUgc2NoZW1lLiBUaGlzIHNjaGVtZSB3aWxsIHByb3Blcmx5IHNlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgamF2YXNjcmlwdCBEYXRlIG9iamVjdHMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShkYXRlKVxyXG4gKiAgcHVibGljIGNoaWxkcmVuOiBEYXRlO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAdHlwZSB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGRhdGUgPSAoZnVuY3Rpb24oKXtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OkRhdGUpID0+ICh2IGluc3RhbmNlb2YgRGF0ZSkgPyB2LnRvSlNPTigpIDogdjtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjpzdHJpbmcpID0+ICh0eXBlb2YgdiA9PT0gJ3N0cmluZycpID8gbmV3IERhdGUodikgOiB2O1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgYXJyYXkgZnVuY3Rpb24gd2lsbCBhcHBseSBhIHNjaGVtZSB0byBhbGwgb2YgaXRzIGNoaWxkcmVuLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgVGVzdENsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoYXJyYXkoKSlcclxuICogIHB1YmxpYyBjaGlsZHJlbjogc3RyaW5nW107XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB7U2NoZW1lfSBjaGlsZFNjaGVtZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KGNoaWxkU2NoZW1lOiBTY2hlbWUgPSBwcmltaXRpdmUpIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OiBhbnkpID0+IHtcclxuICAgICAgICByZXR1cm4gdi5tYXAoKHc6IGFueSkgPT4gY2hpbGRTY2hlbWUuc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmKHYgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHY7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh3OiBhbnkpID0+IGNoaWxkU2NoZW1lLmRlc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4vKipcclxuICogVGhlIG9iamVjdCBmdW5jdGlvbiB3aWxsIHNlcmlhbGl6ZSBhIG5lc3RlZCBvYmplY3RcclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIEEgeyBuYW1lOiBzdHJpbmcgfVxyXG4gKiBjbGFzcyBCIHtcclxuICogICBAc2VyaWFsaXphYmxlKG9iamVjdChBKSlcclxuICogICBwdWJsaWMgbmVzdGVkT2JqZWN0OiBBO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0gdHlwZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdCh0eXBlOiBhbnkpOiBTY2hlbWUge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6YW55KSA9PiBzZXJpYWxpemUodik7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6YW55KSA9PiBkZXNlcmlhbGl6ZSh0eXBlLHYpO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBjdXN0b20gZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjcmVhdGUgeW91ciBvd24gc2VyaWFsaXplciBmdW5jdGlvbmFsaXR5LiBVc2VkIGluIHBvbHltb3JwaCB0eXBlcyBhbmQgYXJyYXlzLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgQSB7IHB1YmxpYyB0eXBlID0gJ2EnOyB9XHJcbiAqIGNsYXNzIEIgeyBwdWJsaWMgdHlwZSA9ICdiJzsgfVxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShjdXN0b20oXHJcbiAqICAgICAgKHY6YW55KT0+dixcclxuICogICAgICAodjphbnkpID0+IGRlc2VyaWFsaXplKHtcclxuICogICAgICAgICAgJ2EnOkEsXHJcbiAqICAgICAgICAgICdiJzpCXHJcbiAqICAgICAgfVt2LnR5cGVdLHYpXHJcbiAqICApKVxyXG4gKiAgcHVibGljIHRlc3Q6IEF8QjtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IHNlcmlhbGl6ZXJcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IGRlc2VyaWFsaXplclxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbShzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnksIGRlc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55KTogU2NoZW1lIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9IHNlcmlhbGl6ZXI7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gZGVzZXJpYWxpemVyO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuIl19

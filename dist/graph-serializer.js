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
define("Store", ["require", "exports", "typescript-map", "Scheme"], function (require, exports, typescript_map_1, Scheme_1) {
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
    exports.ClassDescription = ClassDescription;
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
            var extendedProperties_1 = deserialize(extendedType, src);
            Object.keys(extendedProperties_1).forEach(function (key) {
                ret[key] = extendedProperties_1[key];
            });
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
            var superClassProperties_1 = serialize(superClass);
            Object.keys(superClassProperties_1).forEach(function (key) {
                ret[key] = superClassProperties_1[key];
            });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9TY2hlbWUudHMiLCJzcmMvU3RvcmUudHMiLCJzcmMvRGVjb3JhdG9ycy50cyIsInNyYy9TZXJpYWxpemVyLnRzIiwic3JjL1R5cGVzLnRzIiwic3JjL2dyYXBoLXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBO1FBQUE7WUFDVyxlQUFVLEdBQW9CLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQztZQUM1QyxpQkFBWSxHQUFvQixVQUFDLENBQU0sSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUFELGFBQUM7SUFBRCxDQUhBLEFBR0MsSUFBQTtJQUhZLHdCQUFNOzs7OztJQ0duQjs7T0FFRztJQUNIO1FBTUksNkJBQW1CLFlBQW9CLEVBQUUsUUFBZ0M7WUFBaEMseUJBQUEsRUFBQSxhQUFnQztZQUNyRSxJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNJLDJDQUFhLEdBQXBCLFVBQXFCLFFBQTJCO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLFdBQVc7Z0JBQ2hELENBQUMsQ0FBQyxJQUFJLGVBQU0sRUFBRTtnQkFDZCxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2dCQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNMLDBCQUFDO0lBQUQsQ0ExQkEsQUEwQkMsSUFBQTtJQTFCWSxrREFBbUI7SUE0QmhDOztPQUVHO0lBQ0g7UUFB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QixvQ0FBQSxZQUFZLENBQUEiLCJmaWxlIjoiZ3JhcGgtc2VyaWFsaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBTY2hlbWUge1xuICAgIHB1YmxpYyBzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkgPSAodjogYW55KSA9PiB2O1xuICAgIHB1YmxpYyBkZXNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSA9ICh2OiBhbnkpID0+IHY7XG59XG4iLCJpbXBvcnQge1RTTWFwfSBmcm9tIFwidHlwZXNjcmlwdC1tYXBcIjtcbmltcG9ydCB7U2NoZW1lfSBmcm9tIFwiLi9TY2hlbWVcIjtcblxuLyoqXG4gKiBQcm9wZXJ0eSBkZWNvcmF0b3Igc3RvcmFnZSBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEZXNjcmlwdGlvbiB7XG5cbiAgICBwdWJsaWMgc2NoZW1lOlNjaGVtZTtcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xuICAgIHB1YmxpYyBzZXJpYWxpemVkTmFtZTpzdHJpbmc7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJvcGVydHlOYW1lOiBzdHJpbmcsIHNldHRpbmdzOntba2V5OnN0cmluZ106YW55fSA9IHt9KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb3BlcnR5TmFtZTtcbiAgICAgICAgdGhpcy5zZXREZWNvcmF0aW9uKHNldHRpbmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbmV3IHByb3BlcnR5IGRlY29yYXRvciBzZXR0aW5ncyBoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7W3A6IHN0cmluZ106IGFueX19IHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1Byb3BlcnR5RGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6e1trZXk6c3RyaW5nXTphbnl9KTpQcm9wZXJ0eURlc2NyaXB0aW9uIHtcbiAgICAgICAgdGhpcy5zY2hlbWUgPSB0eXBlb2Ygc2V0dGluZ3Muc2NoZW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBuZXcgU2NoZW1lKClcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2NoZW1lO1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZWROYW1lID0gdHlwZW9mIHNldHRpbmdzLnNlcmlhbGl6ZWROYW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyB0aGlzLm5hbWVcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2VyaWFsaXplZE5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBkZWNvcmF0b3Igc3RvcmFnZVxuICovXG5leHBvcnQgY2xhc3MgQ2xhc3NEZXNjcmlwdGlvbiB7XG5cbiAgICBwdWJsaWMgcG9zdERlc2VyaWFsaXplOiBGdW5jdGlvbiA9ICgpPT57fTtcbiAgICBwdWJsaWMgcHJvcGVydGllczogVFNNYXA8c3RyaW5nLFByb3BlcnR5RGVzY3JpcHRpb24+ID0gbmV3IFRTTWFwKCk7XG5cbiAgICBwdWJsaWMgc2V0RGVjb3JhdGlvbihzZXR0aW5nczp7W2tleTpzdHJpbmddOmFueX0pOkNsYXNzRGVzY3JpcHRpb24ge1xuICAgICAgICBpZih0eXBlb2Ygc2V0dGluZ3MgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHRoaXMucG9zdERlc2VyaWFsaXplID0gdHlwZW9mIHNldHRpbmdzLnBvc3REZXNlcmlhbGl6ZSA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgID8gKCk9Pnt9XG4gICAgICAgICAgICA6IHNldHRpbmdzLnBvc3REZXNlcmlhbGl6ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG4vKipcbiAqIE1haW4gZGVjb3JhdG9yIHN0b3JhZ2UuIFRoaXMgY2xhc3Mgd2lsbCBzdG9yZSBhbmQgcHJvdmlkZSBhY2Nlc3MgdG8gYWxsIGRlY29yYXRvcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdG9yZSBleHRlbmRzIFRTTWFwPGFueSxDbGFzc0Rlc2NyaXB0aW9uPiB7XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSBNYXAgZ2V0dGVyLiBXaGVuIG5vIGNsYXNzIGRlc2NyaXB0aW9uIGlzIGZvdW5kLCB3ZSB3YW50IHRvIGluc3RhbnRpYXRlIGFuZCByZXR1cm4gb25lLiBDbGFzcyBkZWNvcmF0b3JzXG4gICAgICogYXJlIG9wdGlvbmFsLCBhbmQgdGhpcyBlbnN1cmVzIHdlIHdpbGwgZ2V0IGEgZGVmYXVsdCBvbmUgd2hlbiByZXF1ZXN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKiBAcmV0dXJucyB7Q2xhc3NEZXNjcmlwdGlvbn1cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0KGtleTphbnkpOkNsYXNzRGVzY3JpcHRpb24ge1xuICAgICAgICBpZighdGhpcy5oYXMoa2V5KSkgdGhpcy5zZXQoa2V5LG5ldyBDbGFzc0Rlc2NyaXB0aW9uKCkpO1xuICAgICAgICByZXR1cm4gc3VwZXIuZ2V0KGtleSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBsZXQgc3RvcmUgPSBuZXcgU3RvcmUoKTtcblxuIiwiaW1wb3J0IHtQcm9wZXJ0eURlc2NyaXB0aW9uLCBzdG9yZX0gZnJvbSBcIi4vU3RvcmVcIjtcclxuXHJcbi8qKlxyXG4gKiBTZXJpYWxpemFibGUgZGVjb3JhdG9yLiBUaGUgZGVjb3JhdG9yIG1heSByZWNlaXZlIGFuIG9iamVjdCB3aXRoIHNldHRpbmdzLiBFeGFtcGxlIHVzYWdlOlxyXG4gKlxyXG4gKiBgYGBcclxuICogQHNlcmlhbGl6YWJsZSh7XHJcbiAqICAgICAgcG9zdERlc2VyaWFsaXplOiBmdW5jdGlvbihvYmopeyBbLi4uXSB9XHJcbiAqIH0pXHJcbiAqIGNsYXNzIEV4YW1wbGVDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKClcclxuICogIHB1YmxpYyBuYW1lOiBzdHJpbmc7XHJcbiAqXHJcbiAqICBAc2VyaWFsaXphYmxlKHtcclxuICogICAgICBzZXJpYWxpemVkTmFtZTogdGFnc1xyXG4gKiAgICAgIHNjaGVtZTogYXJyYXkoKVxyXG4gKiAgfSlcclxuICogIHB1YmxpYyB0YWdBcnI6IHN0cmluZ1tdO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6YWJsZShzZXR0aW5nczogb2JqZWN0ID0ge30pOiBhbnkge1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbih0eXBlOmFueSwgcHJvcGVydHlOYW1lOiBzdHJpbmcpe1xyXG5cclxuICAgICAgICAvLyBDbGFzcyBkZWNvcmF0b3JcclxuICAgICAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHN0b3JlLmdldCh0eXBlKS5zZXREZWNvcmF0aW9uKHNldHRpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByb3BlcnR5IGRlY29yYXRvclxyXG4gICAgICAgIGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICBzdG9yZS5nZXQodHlwZS5jb25zdHJ1Y3RvcikucHJvcGVydGllcy5zZXQocHJvcGVydHlOYW1lLCBuZXcgUHJvcGVydHlEZXNjcmlwdGlvbihwcm9wZXJ0eU5hbWUsIHNldHRpbmdzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkZWNvcmF0b3JcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbiIsImltcG9ydCB7UHJvcGVydHlEZXNjcmlwdGlvbiwgc3RvcmV9IGZyb20gXCIuL1N0b3JlXCI7XG5cbi8qKlxuICogU2VyaWFsaXplci4gQ29udmVydHMgYSBKU09OIHNlcmlhbGl6YWJsZSB0cmVlIHRvIGFuIG9iamVjdCBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdHlwZVxuICogQHBhcmFtIHNyY1xuICogQHJldHVybnMge2FueX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc2VyaWFsaXplKHR5cGU6IGFueSwgc3JjOiBhbnkpOiBhbnkge1xuXG4gICAgbGV0IHJldCA9IG5ldyB0eXBlKCk7XG5cbiAgICBsZXQgaXNEZXJpdmVkQ2xhc3MgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZSkgaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgICBpZihpc0Rlcml2ZWRDbGFzcykge1xuICAgICAgICBsZXQgZXh0ZW5kZWRUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihuZXcgdHlwZSgpKSkuY29uc3RydWN0b3I7XG4gICAgICAgIGxldCBleHRlbmRlZFByb3BlcnRpZXMgPSBkZXNlcmlhbGl6ZShleHRlbmRlZFR5cGUsc3JjKTtcbiAgICAgICAgT2JqZWN0LmtleXMoZXh0ZW5kZWRQcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXk6c3RyaW5nKT0+e1xuICAgICAgICAgICAgcmV0W2tleV0gPSBleHRlbmRlZFByb3BlcnRpZXNba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RvcmUuZ2V0KHR5cGUpLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6IFByb3BlcnR5RGVzY3JpcHRpb24sIHByb3BlcnR5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldFtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHkuc2NoZW1lLmRlc2VyaWFsaXplcihzcmNbcHJvcGVydHkuc2VyaWFsaXplZE5hbWVdKTtcbiAgICB9KTtcblxuICAgIHN0b3JlLmdldCh0eXBlKS5wb3N0RGVzZXJpYWxpemUocmV0KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogRGVzZXJpYWxpemVyIGZ1bmN0aW9uLiBDb252ZXJ0cyBhbiBvYmplY3QgdG8gYSBKU09OIHNlcmlhbGl6YWJsZSBncmFwaC5cbiAqXG4gKiBAcGFyYW0gc3JjXG4gKiBAcmV0dXJucyB7e1twOiBzdHJpbmddOiBhbnl9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKHNyYzogYW55KTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSB7XG4gICAgbGV0IHJldDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuXG4gICAgLy9wYXJlbnRcbiAgICBpZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNyYykpLmNvbnN0cnVjdG9yICE9PSBPYmplY3QpIHtcbiAgICAgICAgbGV0IHN1cGVyQ2xhc3MgPSBuZXcgKE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSkuY29uc3RydWN0b3IpKCk7XG4gICAgICAgIGxldCBzdXBlckNsYXNzUHJvcGVydGllcyA9IHNlcmlhbGl6ZShzdXBlckNsYXNzKTtcbiAgICAgICAgT2JqZWN0LmtleXMoc3VwZXJDbGFzc1Byb3BlcnRpZXMpLmZvckVhY2goKGtleTpzdHJpbmcpID0+e1xuICAgICAgICAgICAgcmV0W2tleV0gPSBzdXBlckNsYXNzUHJvcGVydGllc1trZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9yZS5nZXQoc3JjLmNvbnN0cnVjdG9yKS5wcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5OlByb3BlcnR5RGVzY3JpcHRpb24scHJvcGVydHlOYW1lOnN0cmluZykgPT4ge1xuICAgICAgICByZXRbcHJvcGVydHkuc2VyaWFsaXplZE5hbWVdID0gcHJvcGVydHkuc2NoZW1lLnNlcmlhbGl6ZXIoc3JjW3Byb3BlcnR5TmFtZV0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuIiwiaW1wb3J0IHtTY2hlbWV9IGZyb20gXCIuL1NjaGVtZVwiO1xyXG5pbXBvcnQge2Rlc2VyaWFsaXplLCBzZXJpYWxpemV9IGZyb20gXCIuL1NlcmlhbGl6ZXJcIjtcclxuXHJcbi8qKlxyXG4gKiBQcmltaXRpdmUsIHRoZSBkZWZhdWx0IHNjaGVtZS4gVGhpcyB3aWxsIHJldHVybiBwcm9wZXJ0aWVzIGFzLWlzIG9uIGRlc2VyaWFsaXplLiBUaGlzIGlzIGV4cG9ydGVkIGFzIGNvbnN0IGJlY2F1c2VcclxuICogdGhlIHByaW1pdGl2ZSBzY2hlbWUgc2hvdWxkIG5ldmVyIGNoYW5nZS5cclxuICogQHR5cGUge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBjb25zdCBwcmltaXRpdmUgPSBuZXcgU2NoZW1lKCk7XHJcblxyXG4vKipcclxuICogRGF0ZSBzY2hlbWUuIFRoaXMgc2NoZW1lIHdpbGwgcHJvcGVybHkgc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBqYXZhc2NyaXB0IERhdGUgb2JqZWN0cy5cclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIFRlc3RDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKGRhdGUpXHJcbiAqICBwdWJsaWMgY2hpbGRyZW46IERhdGU7XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEB0eXBlIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgZGF0ZSA9IChmdW5jdGlvbigpe1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6RGF0ZSkgPT4gKHYgaW5zdGFuY2VvZiBEYXRlKSA/IHYudG9KU09OKCkgOiB2O1xyXG4gICAgc2NoZW1lLmRlc2VyaWFsaXplciA9ICh2OnN0cmluZykgPT4gKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgPyBuZXcgRGF0ZSh2KSA6IHY7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBhcnJheSBmdW5jdGlvbiB3aWxsIGFwcGx5IGEgc2NoZW1lIHRvIGFsbCBvZiBpdHMgY2hpbGRyZW4uXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShhcnJheSgpKVxyXG4gKiAgcHVibGljIGNoaWxkcmVuOiBzdHJpbmdbXTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHtTY2hlbWV9IGNoaWxkU2NoZW1lXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkoY2hpbGRTY2hlbWU6IFNjaGVtZSA9IHByaW1pdGl2ZSkge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB2Lm1hcCgodzogYW55KSA9PiBjaGlsZFNjaGVtZS5zZXJpYWxpemVyKHcpKVxyXG4gICAgfTtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjogYW55KSA9PiB7XHJcbiAgICAgICAgaWYodiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdjtcclxuICAgICAgICByZXR1cm4gdi5tYXAoKHc6IGFueSkgPT4gY2hpbGRTY2hlbWUuZGVzZXJpYWxpemVyKHcpKVxyXG4gICAgfTtcclxuICAgIHJldHVybiBzY2hlbWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGUgb2JqZWN0IGZ1bmN0aW9uIHdpbGwgc2VyaWFsaXplIGEgbmVzdGVkIG9iamVjdFxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgQSB7IG5hbWU6IHN0cmluZyB9XHJcbiAqIGNsYXNzIEIge1xyXG4gKiAgIEBzZXJpYWxpemFibGUob2JqZWN0KEEpKVxyXG4gKiAgIHB1YmxpYyBuZXN0ZWRPYmplY3Q6IEE7XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB0eXBlXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0KHR5cGU6IGFueSk6IFNjaGVtZSB7XHJcbiAgICBsZXQgc2NoZW1lID0gbmV3IFNjaGVtZSgpO1xyXG4gICAgc2NoZW1lLnNlcmlhbGl6ZXIgPSAodjphbnkpID0+IHNlcmlhbGl6ZSh2KTtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjphbnkpID0+IGRlc2VyaWFsaXplKHR5cGUsdik7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4vKipcclxuICogVGhlIGN1c3RvbSBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNyZWF0ZSB5b3VyIG93biBzZXJpYWxpemVyIGZ1bmN0aW9uYWxpdHkuIFVzZWQgaW4gcG9seW1vcnBoIHR5cGVzIGFuZCBhcnJheXMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBBIHsgcHVibGljIHR5cGUgPSAnYSc7IH1cclxuICogY2xhc3MgQiB7IHB1YmxpYyB0eXBlID0gJ2InOyB9XHJcbiAqIGNsYXNzIFRlc3RDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKGN1c3RvbShcclxuICogICAgICAodjphbnkpPT52LFxyXG4gKiAgICAgICh2OmFueSkgPT4gZGVzZXJpYWxpemUoe1xyXG4gKiAgICAgICAgICAnYSc6QSxcclxuICogICAgICAgICAgJ2InOkJcclxuICogICAgICB9W3YudHlwZV0sdilcclxuICogICkpXHJcbiAqICBwdWJsaWMgdGVzdDogQXxCO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0geyh2OiBhbnkpID0+IGFueX0gc2VyaWFsaXplclxyXG4gKiBAcGFyYW0geyh2OiBhbnkpID0+IGFueX0gZGVzZXJpYWxpemVyXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3VzdG9tKHNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSwgZGVzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkpOiBTY2hlbWUge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gc2VyaWFsaXplcjtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSBkZXNlcmlhbGl6ZXI7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4iLCJleHBvcnQgeyBTY2hlbWUgfSBmcm9tIFwiLi9TY2hlbWVcIjtcbmV4cG9ydCB7IENsYXNzRGVzY3JpcHRpb24sIFByb3BlcnR5RGVzY3JpcHRpb24sIFN0b3JlIH0gZnJvbSBcIi4vU3RvcmVcIjtcbmV4cG9ydCB7IGFycmF5LCBjdXN0b20sIGRhdGUsIG9iamVjdCwgcHJpbWl0aXZlfSBmcm9tIFwiLi9UeXBlc1wiO1xuZXhwb3J0IHsgZGVzZXJpYWxpemUsIHNlcmlhbGl6ZSB9IGZyb20gXCIuL1NlcmlhbGl6ZXJcIjtcbmV4cG9ydCB7IHNlcmlhbGl6YWJsZSB9IGZyb20gXCIuL0RlY29yYXRvcnNcIjtcblxuIl19
